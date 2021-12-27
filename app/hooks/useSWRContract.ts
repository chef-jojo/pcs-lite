import { BigNumber, Contract, ethers } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { useEffect, useMemo, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import useSWR, { Middleware, SWRConfiguration, SWRHook } from 'swr';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { Call, MulticallOptions } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const stringify = (value: any) =>
  JSON.stringify(value, getCircularReplacer());

type MethodArg = string | number | BigNumber;
type MethodArgs = Array<MethodArg | MethodArg[]>;

type OptionalMethodInputs =
  | Array<MethodArg | MethodArg[] | undefined>
  | undefined;

// integrated with address and chainId
export function useMultiCall<Data = any, Error = any>(
  abi: any[],
  calls?: Call[] | null,
  options: MulticallOptions = { requireSuccess: true },
  config: SWRConfiguration<Data, Error> = {},
) {
  const multicallContract = useMulticallContract();
  return useSWRMultiCall(
    multicallContract,
    abi,
    calls,
    options,
    config,
  );
}

type MaybeContract = Contract | null | undefined;
type ContractMethodName = string;

type UseSWRContractKeys = [
  MaybeContract,
  ContractMethodName,
  OptionalMethodInputs,
];

export const immutableMiddleware: Middleware =
  (useSWRNext) => (key, fetcher, config) => {
    config.revalidateOnFocus = false;
    config.revalidateIfStale = false;
    config.revalidateOnReconnect = false;
    return useSWRNext(key, fetcher, config);
  };

export const loggerMiddleware: Middleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    // Add logger to the original fetcher.
    const extendedFetcher = fetcher
      ? (...args: unknown[]) => {
          console.log('SWR Request:', key);
          return fetcher(...args);
        }
      : null;

    // Execute the hook with the new fetcher.
    return useSWRNext(key, extendedFetcher, config);
  };
};

export function useSWRContract<Data = any, Error = any>(
  keys?: UseSWRContractKeys | null,
  config: SWRConfiguration<Data, Error> = {},
) {
  const [contract, methodName, inputs] = keys || [];
  return useSWR<Data, Error>(
    keys,
    async () => {
      if (!contract || !methodName) return null;
      if (!inputs) return contract[methodName]();
      return contract[methodName](...inputs);
    },
    config,
  );
}

export function useSWRMultiCall<Data = any, Error = any>(
  multicallContract: Contract | null | undefined,
  abi: any[],
  calls?: Call[] | null,
  options: MulticallOptions = { requireSuccess: true },
  config: SWRConfiguration<Data, Error> = {},
) {
  const { requireSuccess } = options;

  const itf = new ethers.utils.Interface(abi);
  const calldata =
    calls?.map((call) => [
      call.address.toLowerCase(),
      itf.encodeFunctionData(call.name, call.params),
    ]) ?? [];

  const swrResult = useSWR(
    calls && Boolean(calls.length) ? [abi, calls] : null,
    async () => {
      console.debug('multicall', calls);
      if (!multicallContract) {
        throw new Error('Multicall contract not found');
      }
      const res =
        await multicallContract.functions.tryBlockAndAggregate(
          requireSuccess,
          calldata,
        );
      const [blockNumber, blockHash, returnData] = res;
      // TODO: blockNumber refetch

      // @ts-ignore
      return returnData.map((call, i) => {
        const [result, data] = call;
        return result && data !== '0x'
          ? // @ts-ignore
            itf.decodeFunctionResult(calls[i].name, data)
          : null;
      });
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...config,
    },
  );

  if (process.env.NODE_ENV === 'development') {
    if (swrResult.error) {
      console.error(swrResult.error);
    }
  }

  return swrResult;
}

export const unstable_batchMiddleware = (<Data, Error>(
    useSWRNext: SWRHook,
  ) =>
  (
    key: UseSWRContractKeys,
    _: any,
    config?: SWRConfiguration,
  ): any => {
    const { data, error, mutate } = useSWRNext(key, null, config);

    const stringKey = useMemo(() => stringify(key), [key]);

    const value = useSyncExternalStoreWithSelector(
      store.subscribe,
      store.getState,
      null,
      (select) => select.currentState.get(stringKey),
    );

    useEffect(() => {
      store.batchSet(key);
    }, [key]);

    useEffect(() => {
      if (value) {
        mutate(value);
        store.batchDelete(key);
      }
    }, [key, mutate, value]);

    return { data, error };
  }) as Middleware;

const store = createMulticallStore();

function createMulticallStore() {
  const listeners = new Set<Function>();
  let batchKeys = new Map<string, UseSWRContractKeys>();
  let currentState = new Map<string, any>();

  const update = () => {
    unstable_batchedUpdates(() => {
      listeners.forEach((listener) => listener());
    });
  };

  return {
    batchSet(multicallKey: UseSWRContractKeys) {
      batchKeys.set(stringify(multicallKey), multicallKey);
      update();
    },
    batchDelete(multicallKey: UseSWRContractKeys) {
      batchKeys.delete(stringify(multicallKey));
      update();
    },
    batchClear() {
      batchKeys.clear();
      update();
    },
    setValues(values: { key: string; value: any }[]) {
      for (const value of values) {
        currentState.set(value.key, value.value);
      }
      update();
    },
    subscribe(listener: Function) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return {
        batchKeys,
        currentState,
      };
    },
    getSubscriberCount() {
      return listeners.size;
    },
  };
}

export default function useInterval(
  callback: () => void,
  delay: null | number,
  leading = true,
) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      const { current } = savedCallback;
      if (current) {
        current();
      }
    }

    if (delay !== null) {
      if (leading) tick();
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    return undefined;
  }, [delay, leading]);
}

export function unstable_useSWRContractBatchUpdater(
  delay: number = 100,
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const batchKeys = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getState,
    null,
    (select) => select.batchKeys,
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const multicallContract = useMulticallContract();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useInterval(
    async () => {
      const calls = Array.from(batchKeys.values())
        .filter(Boolean)
        .map((contractCall) => {
          const [contract, methodName, input] = contractCall;
          return {
            key: contractCall,
            contract,
            methodName,
            address: contract?.address,
            callData: contract?.interface.encodeFunctionData(
              methodName,
              input,
            ),
          };
        });
      store.batchClear();
      if (calls.length === 0) {
        return;
      }
      console.log(calls, 'calls');
      if (multicallContract) {
        multicallContract.functions
          .tryBlockAndAggregate(
            false,
            calls.map((c) => [c.address, c.callData]),
          )
          .then((res) => {
            const [blockNumber, blockHash, returnData] = res;
            return (returnData as Result[]).map((call, i) => {
              const { contract, methodName, key } = calls[i];
              const [result, data] = call;
              return result && data !== '0x'
                ? {
                    value: contract?.interface.decodeFunctionResult(
                      methodName,
                      data,
                    ),
                    key: stringify(key),
                  }
                : null;
            });
          })
          .then((r) => {
            // @ts-ignore
            store.setValues(r);
          });
      }
    },
    batchKeys.size > 0 ? delay : null,
    false,
  );
}
