import {
  Currency,
  CurrencyAmount,
  ETHER,
  JSBI,
  Token,
} from '@pancakeswap/sdk';
import useSWR from 'swr';
import { useTokenBalanceSWR, useTokenSWR } from './use-token';
import { useActiveWeb3React } from './use-web3';

export function useCurrency(
  currencyId: string | undefined,
): Currency | undefined {
  const isBNB = currencyId?.toUpperCase() === 'BNB';
  const { data: token } = useTokenSWR(isBNB ? undefined : currencyId);
  return isBNB ? ETHER : token;
}

const useBNBBalanceSWR = (shouldFetched?: boolean) => {
  const { library, account, chainId } = useActiveWeb3React();
  const { data: bigNumberData, ...result } = useSWR(
    library && account && shouldFetched
      ? [account, chainId, 'bnbBalance']
      : null,
    () => {
      return library?.getBalance(account!);
    },
  );

  let data: CurrencyAmount | undefined;

  if (bigNumberData) {
    data = CurrencyAmount.ether(
      JSBI.BigInt(bigNumberData.toString()),
    );
  }

  return {
    data,
    ...result,
  };
};

export function useCurrencyBalance(currency?: Currency | null) {
  const isBNB = currency === ETHER;
  const bnbBalance = useBNBBalanceSWR(isBNB);
  const token = isBNB
    ? undefined
    : currency instanceof Token
    ? currency
    : undefined;
  const tokenBalance = useTokenBalanceSWR(token);

  return isBNB ? bnbBalance : tokenBalance;
}
