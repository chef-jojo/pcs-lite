import { ChainId } from '@pancakeswap/sdk';
import { useAtom } from 'jotai';
import { $userGasPrice, GAS_PRICE_GWEI } from '~/state/user';
import { useActiveWeb3React } from './use-web3';

export function useGasPrice(): string {
  const { chainId } = useActiveWeb3React();

  const [userGas] = useAtom($userGasPrice);
  return chainId === ChainId.MAINNET
    ? userGas
    : GAS_PRICE_GWEI.testnet;
}
