import { Currency, Pair, TokenAmount } from '@pancakeswap/sdk';
import { useMemo } from 'react';
import V2PairAbi from '~/config/abi/v2Pair.json';
import { Call } from '~/utils/multicall';
import { wrappedCurrency } from '../utils/wrapped';
import { useActiveWeb3React } from './use-web3';
import { useMultiCall } from './useSWRContract';

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePairs(
  currencies: [Currency | undefined, Currency | undefined][],
): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React();

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId),
      ]),
    [chainId, currencies],
  );

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB)
          ? Pair.getAddress(tokenA, tokenB)
          : undefined;
      }),
    [tokens],
  );

  const calls: Call[] = pairAddresses
    .filter(Boolean)
    .map((address) => {
      return {
        address: address as string,
        name: 'getReserves',
      };
    });

  const multiCallresult = useMultiCall(V2PairAbi, calls);

  const result =
    // @ts-ignore
    multiCallresult?.data?.map((data, i) => {
      if (!data) {
        return [PairState.NOT_EXISTS, null];
      }
      const tokenA = tokens[i][0];
      const tokenB = tokens[i][1];
      if (!tokenA || !tokenB) {
        return [PairState.NOT_EXISTS, null];
      }
      const { reserve0, reserve1 } = data;
      const [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
        ),
      ];
    }) ?? calls.map(() => [PairState.LOADING, null]);

  return result;
}

export function usePair(
  tokenA?: Currency,
  tokenB?: Currency,
): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0];
}
