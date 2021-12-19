import { ChainId } from '@pancakeswap/sdk';
import { createConfig } from './create-config';

export function defineChainIdConfig<
  A extends unknown,
  T extends {
    [ChainId.MAINNET]: A;
    [ChainId.TESTNET]: A;
  },
>(config: T) {
  return createConfig(config, {
    defaultKey: ChainId.MAINNET,
  });
}
