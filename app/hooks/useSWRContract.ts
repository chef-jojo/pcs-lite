import { BigNumber, Contract, ethers } from 'ethers';
import { FormatTypes, Result } from 'ethers/lib/utils';
import { useEffect, useMemo, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import useSWR, {
  Middleware,
  SWRConfiguration,
  SWRHook,
  unstable_serialize,
} from 'swr';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { Call, MulticallOptions } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';

type ContractAddress = string;
type ContractAbiFormat = string[];
type ContractCallData = string;

type UseSWRContractSerializeKeys = readonly [
  ContractAddress,
  ContractAbiFormat,
  ContractMethodName,
  ContractCallData,
];

const stringify = (value: any) => unstable_serialize(value);

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

const serializesContractKey = (
  key?: UseSWRContractKeys | null,
): UseSWRContractSerializeKeys | null => {
  const [contract, methodName, inputs] = key || [];
  const serializedKeys =
    key && contract && methodName
      ? ([
          contract.address,
          contract.interface.format(FormatTypes.full) as string[],
          methodName,
          contract.interface.encodeFunctionData(methodName, inputs),
        ] as const)
      : null;
  return serializedKeys;
};

export function useSWRContract<Data = any, Error = any>(
  keys?: UseSWRContractKeys | null,
  config: SWRConfiguration<Data, Error> = {},
) {
  const [contract, methodName, inputs] = keys || [];
  const serializedKeys = serializesContractKey(keys);

  return useSWR<Data, Error>(
    serializedKeys,
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
    key: UseSWRContractSerializeKeys,
    _: any,
    config?: SWRConfiguration,
  ): any => {
    const stringKey = useMemo(
      () => (key ? stringify(key) : null),
      [key],
    );
    const swr = useSWRNext(
      key,
      () => {
        if (key) {
          store.batchSet(key);
          return store.getState().currentState.get(stringKey!);
        }
      },
      config,
    );

    const { data, mutate } = swr;

    const value = useSyncExternalStoreWithSelector(
      store.subscribe,
      store.getState,
      null,
      (select) =>
        stringKey ? select.currentState.get(stringKey) : null,
    );
    console.trace(value, 'value', data, key);

    useEffect(() => {
      if (value) {
        mutate(value, { revalidate: false });
        store.deleteValues(stringKey!);
      }
    }, [mutate, value, stringKey]);

    return Object.assign({}, swr, { data: value || data });
  }) as Middleware;

const store = createMulticallStore();

function createMulticallStore() {
  const listeners = new Set<Function>();
  let batchKeys = new Map<string, UseSWRContractSerializeKeys>();
  let currentState = new Map<string, any>();

  const update = () => {
    unstable_batchedUpdates(() => {
      listeners.forEach((listener) => listener());
    });
  };

  return {
    batchSet(multicallKey: UseSWRContractSerializeKeys) {
      batchKeys.set(stringify(multicallKey), multicallKey);
      update();
    },
    batchDelete(multicallKey: UseSWRContractSerializeKeys) {
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
    deleteValues(key: string) {
      currentState.delete(key);
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
  delay: number = 300,
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
      // find out why this keeps getting called
      if (batchKeys.size === 0) return;
      const calls = Array.from(batchKeys.values())
        .filter(Boolean)
        .map((contractCall) => {
          const [address, abi, methodName, callData] = contractCall;
          return {
            key: contractCall,
            abi,
            methodName,
            address,
            callData,
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
              const { abi, key, methodName } = calls[i];
              const itf = new ethers.utils.Interface(abi);
              const [result, data] = call;
              return result && data !== '0x'
                ? {
                    value: itf.decodeFunctionResult(methodName, data),
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
    true,
  );
}
