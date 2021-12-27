import {
  DEFAULT_LIST_OF_LISTS,
  listToTokenMap,
  TokenAddressMap,
  UNSUPPORTED_LIST_URLS,
} from '~/config/list';
import { useActiveWeb3React } from './use-web3';
import DEFAULT_TOKEN_LIST from '~/config/default-token-list.json';
import {
  ChainId,
  Currency,
  currencyEquals,
  Token,
} from '@pancakeswap/sdk';
import { getTokens } from '~/config/constants/tokens';
import { useAtom } from 'jotai';
import {
  $listActiveListUrls,
  $listByUrls,
  $listUrls,
} from '~/state/list';
import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import resolveENSContentHash from '~/utils/ENS/resolveENSContentHash';
import { getRpcProvider } from '~/utils/rpc';
import { getTokenList } from '~/utils/get-token-list';
import { TokenList } from '@uniswap/token-lists';
import { $userAddedTokenByChain } from '~/state/user';
import { filterTokens } from '~/components/token-list';

const DEFAULT_TOKEN_MAP = listToTokenMap(DEFAULT_TOKEN_LIST);

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

export function useTokenListSWR() {
  const { chainId, library } = useActiveWeb3React();
  const [list] = useAtom($listUrls);

  const ensResolver = useCallback(
    (ensName: string) => {
      if (chainId !== ChainId.MAINNET) {
        throw new Error('Could not construct mainnet ENS resolver');
      }
      return resolveENSContentHash(
        ensName,
        library || getRpcProvider(chainId),
      );
    },
    [chainId, library],
  );

  return useSWR(
    Boolean(list.length) ? [list, 'token-list'] : null,
    async () => {
      let listByUrls: Record<string, TokenList> = {};
      for (const url of list) {
        const tokenList = await getTokenList(url, ensResolver);
        listByUrls[url] = tokenList;
      }

      return listByUrls;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60 * 1000 * 10,
    },
  );
}

const EMPTY_LIST: TokenAddressMap = {
  [ChainId.MAINNET]: {},
  [ChainId.TESTNET]: {},
};

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

function combineMaps(
  map1: TokenAddressMap,
  map2: TokenAddressMap,
): TokenAddressMap {
  return {
    [ChainId.MAINNET]: {
      ...map1[ChainId.MAINNET],
      ...map2[ChainId.MAINNET],
    },
    [ChainId.TESTNET]: {
      ...map1[ChainId.TESTNET],
      ...map2[ChainId.TESTNET],
    },
  };
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  const [activeListUrls] = useAtom($listActiveListUrls);
  return activeListUrls?.filter(
    (url) => !UNSUPPORTED_LIST_URLS.includes(url),
  );
}

export function useInactiveListUrls(): string[] {
  const [lists] = useAtom($listByUrls);
  const allActiveListUrls = useActiveListUrls();
  return Object.keys(lists).filter(
    (url) =>
      !allActiveListUrls?.includes(url) &&
      !UNSUPPORTED_LIST_URLS.includes(url),
  );
}

export function useCombinedInactiveList(): TokenAddressMap {
  const allInactiveListUrls: string[] = useInactiveListUrls();
  return useCombinedTokenMapFromUrls(allInactiveListUrls);
}

function useCombinedTokenMapFromUrls(
  urls: string[] | undefined,
): TokenAddressMap {
  const { data: lists, error } = useTokenListSWR();

  return useMemo(() => {
    if (!urls || error) return EMPTY_LIST;

    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          if (!lists) return allTokens;
          try {
            const newTokens = Object.assign(
              listToTokenMap(lists[currentUrl]),
            );
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
  }, [error, lists, urls]);
}

function useTokensFromMap(
  tokenMap: typeof DEFAULT_TOKEN_MAP,
  includeUserAdded?: boolean,
): { [address: string]: Token } {
  const { chainId = 56 } = useActiveWeb3React();
  const [userAddedTokens] = useAtom($userAddedTokenByChain);

  const tokensByAddress = useMemo(() => {
    let _tokensByAddress: {
      [address: string]: Token;
    } = {};
    const defaultTokens = getTokens(chainId);

    for (const key in defaultTokens) {
      const token = defaultTokens[key as keyof typeof defaultTokens];
      _tokensByAddress[token.address] = token;
    }
    return _tokensByAddress;
  }, [chainId]);

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
    }, tokensByAddress);

    if (includeUserAdded) {
      return (
        userAddedTokens
          // reduce into all ALL_TOKENS filtered by the current chain
          .reduce<{ [address: string]: Token }>(
            (tokenMap_, token) => {
              tokenMap_[token.address] = token;
              return tokenMap_;
            },
            // must make a copy because reduce modifies the map, and we do not
            // want to make a copy in every iteration
            { ...mapWithoutUrls },
          )
      );
    }

    return mapWithoutUrls;
  }, [
    chainId,
    includeUserAdded,
    tokenMap,
    tokensByAddress,
    userAddedTokens,
  ]);
}

// Get all tokens for the current chain by default tokens, user added tokens and user added urls
export function useAllTokens() {
  const [activeListUrls] = useAtom($listActiveListUrls);

  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls);

  return useTokensFromMap(
    combineMaps(DEFAULT_TOKEN_MAP, activeTokens),
    true,
  );
}

export function useIsUserAddedToken(
  currency: Currency | undefined | null,
): boolean {
  const [userAddedTokens] = useAtom($userAddedTokenByChain);

  if (!currency) {
    return false;
  }

  return !!userAddedTokens.find((token) =>
    currencyEquals(currency, token),
  );
}

export function useAllInactiveTokens(): { [address: string]: Token } {
  // get inactive tokens
  const inactiveTokensMap = useCombinedInactiveList();
  const inactiveTokens = useTokensFromMap(inactiveTokensMap, false);

  // filter out any token that are on active list
  const activeTokensAddresses = Object.keys(useAllTokens());
  const filteredInactive = activeTokensAddresses
    ? Object.keys(inactiveTokens).reduce<{
        [address: string]: Token;
      }>((newMap, address) => {
        if (!activeTokensAddresses.includes(address)) {
          newMap[address] = inactiveTokens[address];
        }
        return newMap;
      }, {})
    : inactiveTokens;

  return filteredInactive;
}

export function useFoundOnInactiveList(
  searchQuery: string,
): Token[] | undefined {
  const { chainId } = useActiveWeb3React();
  const inactiveTokens = useAllInactiveTokens();

  return useMemo(() => {
    if (!chainId || searchQuery === '') {
      return undefined;
    }
    const tokens = filterTokens(
      Object.values(inactiveTokens),
      searchQuery,
    );
    return tokens;
  }, [chainId, inactiveTokens, searchQuery]);
}
