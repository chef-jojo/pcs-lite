import { ChainId } from '@pancakeswap/sdk';
import { Contract, ethers } from 'ethers';
import MultiCallAbi from '~/config/abi/Multicall.json';
import { Multicall } from '~/config/abi/types';
import { getMulticallAddress } from './address-helpers';
import { getRpcProvider } from './rpc';

export const getContract = <T extends Contract = Contract>(
  abi: any,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return new ethers.Contract(address, abi, signer) as T;
};

export const getMulticallContract = (
  chainId = ChainId.MAINNET,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return getContract<Multicall>(
    MultiCallAbi,
    getMulticallAddress(chainId),
    signer ?? getRpcProvider(chainId),
  );
};
