import { ChainId, JSBI, Token, TokenAmount } from '@pancakeswap/sdk';
import { useMemo } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { getContract } from '~/utils/contract-helper';
import { isAddress } from '~/utils/is-address';
import { Call, multicall } from '~/utils/multicall';
import { getRpcProvider } from '~/utils/rpc';
import ERC20_ABI from '../config/abi/erc20.json';
import { useActiveWeb3React } from './use-web3';
import { useAllTokens } from './useTokenList';

const getToken = async (chainId: ChainId, tokenAddress: string) => {
  const tokenContract = getContract(
    ERC20_ABI,
    tokenAddress,
    getRpcProvider(chainId),
  );
  const [name, symbol, decimals] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.decimals(),
  ]);
  return new Token(chainId, tokenAddress, decimals, symbol, name);
};

const getTokenBalance = async (
  tokenAddress: string,
  account: string,
  chainId: ChainId,
) => {
  const tokenContract = getContract(
    ERC20_ABI,
    tokenAddress,
    getRpcProvider(chainId),
  );
  const balance = await tokenContract.balanceOf(account);
  return balance;
};

export function useTokenSWR(tokenAddress?: string) {
  const { chainId, library } = useActiveWeb3React();
  const allTokens = useAllTokens();
  const address = isAddress(tokenAddress);
  const tokenFromList = address && allTokens[address];
  const result = useSWRImmutable(
    address || !tokenFromList ? [chainId, address, 'token'] : null,
    getToken,
  );

  return tokenFromList ? { data: tokenFromList } : result;
}

export function useTokenBalanceSWR(token?: Token) {
  const { account, chainId } = useActiveWeb3React();
  const address = isAddress(token?.address);
  const { data: bigNumberData, ...result } = useSWR(
    address && account ? [address, account, chainId] : null,
    getTokenBalance,
  );

  let data: TokenAmount | undefined;

  if (bigNumberData && token) {
    data = new TokenAmount(
      token,
      JSBI.BigInt(bigNumberData.toString()),
    );
  }

  return {
    data,
    ...result,
  };
}

export function useTokenBalances(tokens?: Token[]) {
  const { account, chainId } = useActiveWeb3React();
  const validatedTokens: Token[] = useMemo(
    () =>
      tokens?.filter(
        (t?: Token): t is Token => isAddress(t?.address) !== false,
      ) ?? [],
    [tokens],
  );

  const res = useSWR(
    account && validatedTokens ? [account, validatedTokens] : null,
    async (_account, _validatedTokens) => {
      const calls: Call[] = _validatedTokens.map((token) => ({
        address: token.address,
        name: 'balanceOf',
        params: [_account],
      }));
      const res = await multicall(
        ERC20_ABI,
        calls,
        undefined,
        chainId,
      );
      return _validatedTokens.reduce<{
        [tokenAddress: string]: TokenAmount | undefined;
      }>((memo, token, i) => {
        const value = res[i]?.balance;
        const amount = value
          ? JSBI.BigInt(value.toString())
          : undefined;
        if (amount) {
          memo[token.address] = new TokenAmount(token, amount);
        }
        return memo;
      }, {});
    },
  );
  return res;
}
