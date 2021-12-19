import { parseUnits } from 'ethers/lib/utils';
import { atom } from 'jotai';
import { DEFAULT_DEADLINE_FROM_NOW } from '~/config/constants';

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
