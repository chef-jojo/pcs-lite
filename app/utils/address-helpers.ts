import { ChainId } from '@pancakeswap/sdk';
import { REACT_APP_CHAIN_ID } from '~/config/env';
import addresses, {
  ContractAddress,
} from '~/config/constants/contracts';

export const getAddress = (
  address: ContractAddress,
  chainId = ChainId.MAINNET,
): string => {
  return address[chainId]
    ? address[chainId]
    : address[ChainId.MAINNET];
};

export const getMulticallAddress = (chainId = ChainId.MAINNET) => {
  return getAddress(addresses.multiCall, chainId);
};
