import { ChainId } from '@pancakeswap/sdk';
import { ethers } from 'ethers';
import { CallStruct } from '~/config/abi/types/Multicall';
import { getMulticallContract } from '~/utils/contract-helper';

export interface Call {
  address: string; // Address of the contract
  name: string; // Function name on the contract (example: balanceOf)
  params?: any[]; // Function params
}

export interface MulticallOptions {
  requireSuccess?: boolean;
}

export type MultiCallResponse<T> = T | null;

export const multicall = async <T = any>(
  abi: any[],
  calls: Call[],
  options: MulticallOptions = { requireSuccess: true },
  chainId = ChainId.MAINNET,
): Promise<MultiCallResponse<T>> => {
  const { requireSuccess } = options;
  const multi = getMulticallContract(chainId);
  const itf = new ethers.utils.Interface(abi);

  const calldata = calls.map((call) => ({
    target: call.address.toLowerCase(),
    callData: itf.encodeFunctionData(call.name, call.params),
  })) as CallStruct[];
  const returnData = await multi.tryAggregate(
    requireSuccess!,
    calldata,
  );
  // @ts-ignore
  const res = returnData.map((call, i) => {
    const [result, data] = call;
    try {
      return result && data !== '0x'
        ? itf.decodeFunctionResult(calls[i].name, data)
        : null;
    } catch (error) {
      console.error(error);
    }
  });

  return res as any;
};
