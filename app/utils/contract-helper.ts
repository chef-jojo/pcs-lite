import { ChainId } from '@pancakeswap/sdk';
import { Contract, ethers } from 'ethers';
import MultiCallAbi from '~/config/abi/Multicall.json';
import { ChainlinkOracle, Multicall } from '~/config/abi/types';
import {
  getChainlinkOracleAddress,
  getMulticallAddress,
} from './address-helpers';
import { getRpcProvider } from './rpc';
import chainlinkOracleAbi from 'config/abi/chainlinkOracle.json';

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

export const getChainlinkOracleContract = (
  signer?: ethers.Signer | ethers.providers.Provider,
  chainId = ChainId.MAINNET,
) => {
  return getContract(
    chainlinkOracleAbi,
    getChainlinkOracleAddress(),
    signer ?? getRpcProvider(chainId),
  ) as ChainlinkOracle;
};
