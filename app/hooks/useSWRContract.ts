import { BigNumber, Contract, ethers } from 'ethers';
import useSWR from 'swr';
import { Call, MulticallOptions } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';

type MethodArg = string | number | BigNumber;
type MethodArgs = Array<MethodArg | MethodArg[]>;

type OptionalMethodInputs =
  | Array<MethodArg | MethodArg[] | undefined>
  | undefined;

// integrated with address and chainId
export function useMultiCall(
  abi: any[],
  calls?: Call[] | null,
  options: MulticallOptions = { requireSuccess: true },
) {
  const multicallContract = useMulticallContract();
  return useSWRMultiCall(multicallContract, abi, calls, options);
}

export function useSWRContract(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  enabled = true,
) {
  return useSWR(
    enabled ? [methodName, contract, inputs] : null,
    async () => {
      if (!contract) return null;
      if (!inputs) return contract[methodName]();
      return contract[methodName](...inputs);
    },
  );
}

export function useSWRMultiCall(
  multicallContract: Contract | null | undefined,
  abi: any[],
  calls?: Call[] | null,
  options: MulticallOptions = { requireSuccess: true },
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

      return returnData.map((call, i) => {
        const [result, data] = call;
        return result && data !== '0x'
          ? itf.decodeFunctionResult(calls[i].name, data)
          : null;
      });
    },
    {
      // revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  if (process.env.NODE_ENV === 'development') {
    if (swrResult.error) {
      console.error(swrResult.error);
    }
  }

  return swrResult;
}
