import { Token } from '@pancakeswap/sdk';
import { parseUnits } from 'ethers/lib/utils';
import { atom } from 'jotai';
import { DEFAULT_DEADLINE_FROM_NOW } from '~/config/constants';
import { $chainId } from '~/hooks/use-web3';

export enum GAS_PRICE {
  default = '5',
  fast = '6',
  instant = '7',
  testnet = '10',
}
export const GAS_PRICE_GWEI = {
  default: parseUnits(GAS_PRICE.default, 'gwei').toString(),
  fast: parseUnits(GAS_PRICE.fast, 'gwei').toString(),
  instant: parseUnits(GAS_PRICE.instant, 'gwei').toString(),
  testnet: parseUnits(GAS_PRICE.testnet, 'gwei').toString(),
};

export const $userDeadLine = atom(DEFAULT_DEADLINE_FROM_NOW);

export const $userGasPrice = atom(GAS_PRICE_GWEI.default);
export const $userIsExpertMode = atom(false);

const defaultUserAddedTokens: {
  [chainId: string]: { [address: string]: Token };
} = {};

export const $userAddedTokens = atom(defaultUserAddedTokens);
export const $userAddedTokenByChain = atom((get) => {
  const chainId = get($chainId);
  const userAddedTokens = get($userAddedTokens);
  if (!chainId) return [];
  return Object.values(userAddedTokens?.[chainId] ?? {});
});
