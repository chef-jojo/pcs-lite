import { BigNumber, Contract, ethers } from 'ethers';
import { FormatTypes, Result } from 'ethers/lib/utils';
import { useEffect, useMemo, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import useSWR, {
  Middleware,
  SWRConfiguration,
  SWRHook,
  unstable_serialize,
  SWRResponse,
} from 'swr';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { Erc20 } from '~/config/abi/types';
import { Call, MulticallOptions } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';

type UseSWRContractSerializeKeys = {
  address: string;
  interfaceFormat: string[];
  methodName: string;
  callData: string;
};

const stringify = (value: any) => unstable_serialize(value);

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

type MaybeContract<C extends Contract = Contract> =
  | C
  | null
  | undefined;
type ContractMethodName<C extends Contract = Contract> =
  keyof C['functions'] & string;

type ContractMethodParams<
  C extends Contract = Contract,
  N extends ContractMethodName<C> = ContractMethodName<C>,
> = Parameters<C['functions'][N]>;

type UseSWRContractArrayKey<
  C extends Contract = Contract,
  N extends ContractMethodName<C> = any,
> =
  | [MaybeContract<C>, N, ContractMethodParams<C, N>]
  | [MaybeContract<C>, N];

export type UseSWRContractObjectKey<
  C extends Contract = Contract,
  N extends ContractMethodName<C> = ContractMethodName<C>,
> = {
  contract: MaybeContract<C>;
  methodName: N;
  params?: ContractMethodParams<C, N>;
};

type UseSWRContractKey<
  T extends Contract = Contract,
  N extends ContractMethodName<T> = any,
> = UseSWRContractArrayKey<T, N> | UseSWRContractObjectKey<T, N>;

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

export enum FetchStatus {
  Idle = 'IDLE',
  Fetching = 'FETCHING',
  Fetched = 'FETCHED',
  Failed = 'FAILED',
  Revalidating = 'REVALIDATING',
}

export const fetchStatusMiddleware: Middleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    const swr = useSWRNext(key, fetcher, config);
    let status = FetchStatus.Idle;

    if (!swr.isValidating && !swr.error && !swr.data) {
      status = FetchStatus.Idle;
    } else if (swr.isValidating && !swr.error && !swr.data) {
      status = FetchStatus.Fetching;
    } else if (swr.data) {
      status = FetchStatus.Fetched;
    } else if (swr.error && !swr.data) {
      status = FetchStatus.Failed;
    } else if (swr.isValidating && swr.data) {
      status = FetchStatus.Revalidating;
    }

    return {
      status,
      ...swr,
    };
  };
};

const getContractKey = <
  T extends Contract = Contract,
  N extends ContractMethodName<T> = any,
>(
  key?: UseSWRContractKey<T, N> | null,
) => {
  if (Array.isArray(key)) {
    const [contract, methodName, params] = key || [];
    return {
      contract,
      methodName,
      params,
    };
  }
  return key;
};

const serializesContractKey = <T extends Contract = Contract>(
  key?: UseSWRContractKey<T> | null,
): UseSWRContractSerializeKeys | null => {
  const { contract, methodName, params } = getContractKey(key) || {};
  const serializedKeys =
    key && contract && methodName
      ? {
          address: contract.address,
          interfaceFormat: contract.interface.format(
            FormatTypes.full,
          ) as string[],
          methodName,
          callData: contract.interface.encodeFunctionData(
            methodName,
            params,
          ),
        }
      : null;
  return serializedKeys;
};

export function useSWRContract<
  Error = any,
  T extends Contract = Contract,
  N extends ContractMethodName<T> = ContractMethodName<T>,
  Data = Awaited<ReturnType<T['functions'][N]>>,
>(
  key?: UseSWRContractKey<T, N> | null,
  config: SWRConfiguration<Data, Error> = {},
) {
  const { contract, methodName, params } = getContractKey(key) || {};
  const serializedKeys = serializesContractKey(key);

  return useSWR<Data, Error>(
    serializedKeys,
    async () => {
      if (!contract || !methodName) return null;
      if (!params) return contract[methodName]();
      return contract[methodName](...params);
    },
    { ...config, use: [fetchStatusMiddleware] },
  ) as SWRResponse<Data, Error> & {
    status: FetchStatus;
  };
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
          const {
            address,
            callData,
            interfaceFormat: interfaceFormaat,
            methodName,
          } = contractCall;
          return {
            key: contractCall,
            abi: interfaceFormaat,
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
            calls.map((c) => ({
              target: c.address,
              callData: c.callData,
            })),
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
