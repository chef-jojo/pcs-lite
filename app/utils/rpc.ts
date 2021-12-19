import { ChainId } from '@pancakeswap/sdk';
import { ethers } from 'ethers';
import {
  REACT_APP_NODE_PRODUCTION,
  REACT_APP_TESTNET_NODE,
} from '~/config/env';

export let rpcProvider: ethers.providers.JsonRpcProvider;
export const lastChainId = ChainId.MAINNET;

const RPC_URL = {
  [ChainId.MAINNET]: REACT_APP_NODE_PRODUCTION,
  [ChainId.TESTNET]: REACT_APP_TESTNET_NODE,
};

export const getRpcProvider = (chainId = ChainId.MAINNET) => {
  if (chainId !== lastChainId || !rpcProvider) {
    rpcProvider = new ethers.providers.JsonRpcProvider(
      RPC_URL[chainId],
    );
    return rpcProvider;
  }
  return rpcProvider;
};
