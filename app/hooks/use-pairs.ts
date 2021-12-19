import {
  ChainId,
  Currency,
  Pair,
  Token,
  TokenAmount,
} from '@pancakeswap/sdk';
import { useMemo } from 'react';
import useSWR from 'swr';
import V2PairAbi from '~/config/abi/v2Pair.json';
import { Call, multicall } from '~/utils/multicall';
import { wrappedCurrency } from '../utils/wrapped';
import { useActiveWeb3React } from './use-web3';

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

  const { data: result, error } = useSWR(
    Boolean(pairAddresses.length) && Boolean(tokens)
      ? [chainId, pairAddresses, tokens, 'getReserves']
      : null,
    getPairs,
  );

  return result || [];
}

const getPairs = async (
  chainId: ChainId,
  pairAddress: string[],
  tokens: [Token, Token][],
) => {
  const calls: Call[] = pairAddress.map((address) => {
    return {
      address,
      name: 'getReserves',
    };
  });
  const res = await multicall(
    V2PairAbi,
    calls,
    {
      requireSuccess: false,
    },
    chainId,
  );

  return res.map((data, i) => {
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
  });
};

export function usePair(
  tokenA?: Currency,
  tokenB?: Currency,
): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0];
}
