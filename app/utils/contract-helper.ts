import { ChainId } from '@pancakeswap/sdk';
import { ethers } from 'ethers';
import MultiCallAbi from '~/config/abi/Multicall.json';
import { getMulticallAddress } from './address-helpers';
import { getRpcProvider } from './rpc';

export const getContract = (
  abi: any,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return new ethers.Contract(address, abi, signer);
};

export const getMulticallContract = (
  chainId = ChainId.MAINNET,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return getContract(
    MultiCallAbi,
    getMulticallAddress(chainId),
    signer ?? getRpcProvider(chainId),
  );
};
