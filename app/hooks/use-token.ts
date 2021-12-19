import { ChainId, JSBI, Token, TokenAmount } from '@pancakeswap/sdk';
import { TokenList } from '@uniswap/token-lists';
import { useMemo } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import DEFAULT_TOKEN_LIST from '~/config/default-token-list.json';
import {
  DEFAULT_LIST_OF_LISTS,
  listToTokenMap,
  LIST_BY_URL,
  TokenAddressMap,
} from '~/config/list';
import { getContract } from '~/utils/contract-helper';
import { isAddress } from '~/utils/is-address';
import { Call, multicall } from '~/utils/multicall';
import ERC20_ABI from '../config/abi/erc20.json';
import { useActiveWeb3React } from './use-web3';
import { getTokens } from '~/config/constants/tokens';
import { Web3Provider } from '@ethersproject/providers';
import { getRpcProvider } from '~/utils/rpc';

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

function useTokenListSWR() {
  const { data } = useSWR('token-list', getTokenList);
  return data;
}

const DEFAULT_TOKEN_MAP = listToTokenMap(DEFAULT_TOKEN_LIST);

const getTokenList = async () => {
  let listByUrl: Record<string, TokenList> = {};
  for (const url in LIST_BY_URL) {
    const result = await fetch(url);
    const json = (await result.json()) as TokenList;
    listByUrl[url] = json;
  }
  return listByUrl;
};

const EMPTY_LIST: TokenAddressMap = {
  [ChainId.MAINNET]: {},
  [ChainId.TESTNET]: {},
};

function tokensFromMap(
  tokenMap: typeof DEFAULT_TOKEN_MAP,
  chainId = ChainId.MAINNET,
) {
  return Object.keys(tokenMap[chainId] || {}).reduce<{
    [address: string]: Token;
  }>((newMap, address) => {
    newMap[address] = tokenMap[chainId][address].token;
    return newMap;
  }, {});
}

function sortByListPriority(urlA: string, urlB: string) {
  const first = DEFAULT_LIST_OF_LISTS.includes(urlA)
    ? DEFAULT_LIST_OF_LISTS.indexOf(urlA)
    : Number.MAX_SAFE_INTEGER;
  const second = DEFAULT_LIST_OF_LISTS.includes(urlB)
    ? DEFAULT_LIST_OF_LISTS.indexOf(urlB)
    : Number.MAX_SAFE_INTEGER;

  // need reverse order to make sure mapping includes top priority last
  if (first < second) return 1;
  if (first > second) return -1;
  return 0;
}

function useCombinedTokenMapFromUrls(
  urls: string[] | undefined,
): TokenAddressMap {
  const lists = useTokenListSWR();

  return useMemo(() => {
    if (!urls) return EMPTY_LIST;

    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          if (!lists) return allTokens;
          try {
            const newTokens = Object.assign(listToTokenMap(lists));
            return combineMaps(allTokens, newTokens);
          } catch (error) {
            console.error(
              'Could not show token list due to error',
              error,
            );
            return allTokens;
          }
        }, EMPTY_LIST)
    );
  }, [lists, urls]);
}

// const tokensFromMapAtom = atom(tokensFromMap(TOKEN_MAP));

function useTokensFromMap(
  tokenMap: typeof DEFAULT_TOKEN_MAP,
  includeUserAdded?: boolean,
): { [address: string]: Token } {
  const { chainId } = useActiveWeb3React();
  // const userAddedTokens = useUserAddedTokens();

  return useMemo(() => {
    if (!chainId) return {};

    // reduce to just tokens
    const mapWithoutUrls = Object.keys(
      tokenMap[chainId] || {},
    ).reduce<{
      [address: string]: Token;
    }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token;
      return newMap;
    }, {});

    // if (includeUserAdded) {
    //   return (
    //     userAddedTokens
    //       // reduce into all ALL_TOKENS filtered by the current chain
    //       .reduce<{ [address: string]: Token }>(
    //         (tokenMap_, token) => {
    //           tokenMap_[token.address] = token;
    //           return tokenMap_;
    //         },
    //         // must make a copy because reduce modifies the map, and we do not
    //         // want to make a copy in every iteration
    //         { ...mapWithoutUrls },
    //       )
    //   );
    // }

    return mapWithoutUrls;
  }, [chainId, tokenMap]);
}

export function useAllTokens() {
  const { chainId } = useActiveWeb3React();
  const defaultTokensFromList = tokensFromMap(
    DEFAULT_TOKEN_MAP,
    chainId as ChainId,
  );
  const defaultTokens = getTokens(chainId);
  let tokensByAddress: {
    [address: string]: Token;
  } = {};
  for (const key in defaultTokens) {
    const token = defaultTokens[key as keyof typeof defaultTokens];
    tokensByAddress[token.address] = token;
  }
  // TODO: add remote tokens and user added tokens
  return {
    ...defaultTokensFromList,
    ...tokensByAddress,
  };
}

export function useTokenBalances(tokens?: Token[]) {
  const { account, library, chainId } = useActiveWeb3React();
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
