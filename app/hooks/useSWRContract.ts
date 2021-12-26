import { BigNumber, Contract, ethers } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import useSWR, {
  BareFetcher,
  Key,
  Middleware,
  SWRConfiguration,
  SWRHook,
} from 'swr';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { Call, MulticallOptions } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';

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

export const batchMiddleware = (<Data, Error>(useSWRNext: SWRHook) =>
  (
    key: UseSWRContractKeys,
    _: any,
    config?: SWRConfiguration,
  ): any => {
    const { data, error, mutate } = useSWRNext(key, null, config);
    const value = useSyncExternalStore(
      store.subscribe,
      store.getState,
    );

    useEffect(() => {
      store.add(key);

      return () => {};
    }, [key]);

    return { data, error };
  }) as Middleware;

const store = createMulticallStore();

function createMulticallStore(
  initialState: Set<UseSWRContractKeys> = new Set(),
) {
  const listeners = new Set<Function>();
  let currentState = initialState;
  return {
    add(multicallKey: UseSWRContractKeys) {
      currentState.add(multicallKey);
      unstable_batchedUpdates(() => {
        listeners.forEach((listener) => listener());
      });
    },
    clear() {
      currentState.clear();
      unstable_batchedUpdates(() => {
        listeners.forEach((listener) => listener());
      });
    },
    subscribe(listener: Function) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return currentState;
    },
    getSubscriberCount() {
      return listeners.size;
    },
  };
}

function useDebounce<T>(value: T, delay: number) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );
  return debouncedValue;
}

// export function useSWRContractBatchUpdater(delay: number = 500) {
//   const value = useSyncExternalStore(store.subscribe, store.getState);

//   const debouncedValue = useDebounce(value, delay);
//   const multicallContract = useMulticallContract();

//   const calls = Array.from(debouncedValue)
//     .filter(Boolean)
//     .map((contractCall) => {
//       const [contract, methodName, input] = contractCall;
//       return {
//         contract,
//         methodName,
//         address: contract?.address,
//         callData: contract?.interface.encodeFunctionData(
//           methodName,
//           input,
//         ),
//       };
//     });

//   useEffect(() => {
//     console.log(calls.map((c) => [c.address, c.callData]));
//     if (multicallContract) {
//       multicallContract.functions
//         .tryBlockAndAggregate(
//           false,
//           calls.map((c) => [c.address, c.callData]),
//         )
//         .then((returnData: Result[]) => {
//           console.log(returnData, 'returnData');
//           return returnData.map((call, i) => {
//             const { contract, methodName } = calls[i];
//             const [result, data] = call;
//             return result && data !== '0x'
//               ? contract?.interface.decodeFunctionResult(
//                   methodName,
//                   data,
//                 )
//               : null;
//           });
//         })
//         .then(console.info);
//     }
//   }, [calls, multicallContract]);
// }

// // integrated with address and chainId
// export function useMultiCallMultipleContract<Data = any, Error = any>(
//   calls?: Array<UseSWRContractKeys> | null,
//   options: MulticallOptions = { requireSuccess: true },
//   config: SWRConfiguration<Data, Error> = {},
// ) {
//   const multicallContract = useMulticallContract();
//   return useSWRMultiCallMultipleContract(
//     multicallContract,
//     calls,
//     options,
//     config,
//   );
// }

// export function useSWRMultiCallMultipleContract<
//   Data = any,
//   Error = any,
// >(
//   multicallContract: Contract | null | undefined,
//   calls?: Array<UseSWRContractKeys> | null,
//   options: MulticallOptions = { requireSuccess: true },
//   config: SWRConfiguration<Data, Error> = {},
// ) {
//   const { requireSuccess } = options;

//   const calldata =
//     calls?.map((call) => {
//       const [contract, methodName, inputs] = call;
//       return [
//         contract?.address.toLowerCase(),
//         contract?.interface.encodeFunctionData(methodName, inputs),
//       ];
//     }) ?? [];

//   const swrResult = useSWR(
//     calls && Boolean(calls.length) ? [calls] : null,
//     async () => {
//       console.debug('multicall multiple contract', calls);
//       if (!multicallContract) {
//         throw new Error('Multicall contract not found');
//       }
//       const res =
//         await multicallContract.functions.tryBlockAndAggregate(
//           requireSuccess,
//           calldata,
//         );
//       const [blockNumber, blockHash, returnData] = res;
//       // TODO: blockNumber refetch

//       // @ts-ignore
//       return returnData.map((call, i) => {
//         const [result, data] = call;
//         return result && data !== '0x'
//           ? calls?.[i][0]?.interface.decodeFunctionResult(
//               calls?.[i][1],
//               data,
//             )
//           : null;
//       });
//     },
//     {
//       revalidateOnFocus: false,
//       revalidateOnReconnect: false,
//       ...config,
//     },
//   );

//   if (process.env.NODE_ENV === 'development') {
//     if (swrResult.error) {
//       console.error(swrResult.error);
//     }
//   }

//   return swrResult;
// }
