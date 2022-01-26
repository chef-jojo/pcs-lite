import { Contract, ethers } from 'ethers';
import { FormatTypes, Result } from 'ethers/lib/utils';
import useSWR, {
  Middleware,
  SWRConfiguration,
  SWRHook,
  SWRResponse,
} from 'swr';
import { Multicall } from '~/config/abi/types';
import { CallStruct } from '~/config/abi/types/Multicall';
import { getMulticallContract } from '~/utils/contract-helper';
import { Call, MulticallOptions } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';

type UseSWRContractSerializeKeys = {
  address: string;
  interfaceFormat: string[];
  methodName: string;
  callData: string;
};

// integrated with address and chainId
export function useMultiCall<Data = any, Error = any>(
  abi: any[],
  calls?: Call[] | null,
  options: MulticallOptions = { requireSuccess: true },
  config: SWRConfiguration<Data, Error> = {},
) {
  const multicallContract = useMulticallContract();
  return useSWRMultiCall<Data, Error>(
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
  keyof C['callStatic'] & string;

type ContractMethodParams<
  C extends Contract = Contract,
  N extends ContractMethodName<C> = ContractMethodName<C>,
> = Parameters<C['callStatic'][N]>;

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

interface PendingCall {
  key: UseSWRContractSerializeKeys;
  resolve: any;
  reject: any;
}

class BatchFetcher<MC extends Multicall = Multicall> {
  _timer?: NodeJS.Timeout;
  _pendingCalls: PendingCall[] = [];
  multiCallContract: MaybeContract<MC>;
  constructor(multiCallContract: MC) {
    this.multiCallContract = multiCallContract;
  }

  add(key: UseSWRContractSerializeKeys) {
    const inflightRequest: PendingCall = {
      key,
      resolve: null,
      reject: null,
    };
    const promise = new Promise((resolve, reject) => {
      inflightRequest.resolve = resolve;
      inflightRequest.reject = reject;
    });
    this._pendingCalls.push(inflightRequest);

    if (!this._timer) {
      this._timer = setTimeout(() => {
        console.log(this._pendingCalls, '_pendingCalls');
        const pendingCalls = this._pendingCalls;
        this._timer = undefined;
        this._pendingCalls = [];

        const batchCalls = pendingCalls.map((c) => ({
          target: c.key.address,
          callData: c.key.callData,
        }));
        console.debug('Batch fetching', batchCalls);
        this.multiCallContract
          ?.tryBlockAndAggregate(false, batchCalls)
          .then((res) => {
            const [blockNumber, blockHash, returnData] = res;
            return (returnData as Result[]).map((call, i) => {
              const { methodName, interfaceFormat } =
                pendingCalls[i].key;
              const itf = new ethers.utils.Interface(interfaceFormat);
              const [result, data] = call;
              return result && data !== '0x'
                ? itf.decodeFunctionResult(methodName, data)
                : null;
            });
          })
          .then((results) => {
            pendingCalls.forEach((call, i) => {
              const result = results[i];
              if (result) {
                call.resolve(result);
              } else {
                call.reject(new Error('Failed to fetch'));
              }
            });
          });
      }, 10);
    }

    return promise;
  }
}

const serializesContractKey = <T extends Contract = Contract>(
  key?: UseSWRContractKey<T> | null,
  afterSuccess?: Function,
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
          ...(afterSuccess && {
            afterSuccess: JSON.stringify(afterSuccess),
          }),
        }
      : null;
  return serializedKeys;
};

export function useSWRContract<
  Error = any,
  T extends Contract = Contract,
  N extends ContractMethodName<T> = ContractMethodName<T>,
  ProcessData = any,
>(
  key: UseSWRContractKey<T, N> | null,
  config: SWRConfiguration<ProcessData, Error> & {
    afterSuccess: (
      data: Awaited<ReturnType<T['callStatic'][N]>>,
    ) => ProcessData;
  },
): SWRResponse<ProcessData, Error> & {
  status: FetchStatus;
};

export function useSWRContract<
  Error = any,
  T extends Contract = Contract,
  N extends ContractMethodName<T> = ContractMethodName<T>,
  ProcessData = Awaited<ReturnType<T['callStatic'][N]>>,
>(
  key?: UseSWRContractKey<T, N> | null,
  config?: SWRConfiguration<ProcessData, Error>,
): SWRResponse<ProcessData, Error> & {
  status: FetchStatus;
};

export function useSWRContract<
  Error = any,
  T extends Contract = Contract,
  N extends ContractMethodName<T> = ContractMethodName<T>,
  ProcessData = any,
>(
  key?: UseSWRContractKey<T, N> | null,
  config: SWRConfiguration<ProcessData, Error> & {
    afterSuccess?: (
      data: Awaited<ReturnType<T['callStatic'][N]>>,
    ) => ProcessData;
  } = {
    afterSuccess: (t) => t,
  },
) {
  const { afterSuccess = (t) => t, ...restConfig } = config;
  const { contract, methodName, params } = getContractKey(key) || {};
  const serializedKeys = serializesContractKey(key);

  const swr = useSWR(
    serializedKeys,
    async () => {
      if (!methodName || !contract) return null;
      return afterSuccess(
        contract[methodName].apply(contract, params),
      );
    },
    {
      ...restConfig,
      use: [fetchStatusMiddleware, ...(restConfig.use ?? [])],
    },
  );
  return swr as SWRResponse<ProcessData, Error> & {
    status: FetchStatus;
  };
}

export function useSWRMultiCall<Data = any, Error = any>(
  multicallContract: Multicall | null | undefined,
  abi: any[],
  calls?: Call[] | null,
  options: MulticallOptions = { requireSuccess: true },
  config: SWRConfiguration<Data, Error> = {},
) {
  const { requireSuccess = true } = options;

  const itf = new ethers.utils.Interface(abi);
  const calldata: CallStruct[] =
    calls?.map((call) => ({
      target: call.address.toLowerCase(),
      callData: itf.encodeFunctionData(call.name, call.params),
    })) ?? [];

  const swrResult = useSWR<Data, Error>(
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

const batchFetcher = new BatchFetcher(getMulticallContract());

export const unstable_batchMiddleware = (<Data, Error>(
    useSWRNext: SWRHook,
  ) =>
  (
    key: UseSWRContractSerializeKeys,
    _: any,
    config?: SWRConfiguration,
  ): any => {
    const swr = useSWRNext(
      key,
      async (args) => {
        return batchFetcher.add(args);
      },
      config,
    );

    return swr;
  }) as Middleware;
