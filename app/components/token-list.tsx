import {
  Currency,
  CurrencyAmount,
  Token,
  TokenAmount,
} from '@pancakeswap/sdk';
import { TokenInfo } from '@uniswap/token-lists';
import { useMemo, useState } from 'react';
import { Box, Flex } from '@pcs/ui';
import {
  useAllTokens,
  useTokenBalances,
  useTokenBalanceSWR,
  useTokenSWR,
} from '~/hooks/use-token';
import useDebounce from '~/hooks/use-debounce';
import { useActiveWeb3React } from '~/hooks/use-web3';
import { isAddress } from '~/utils/is-address';

/**
 * Create a filter function to apply to a token for whether it matches a particular search query
 * @param search the search query to apply to the token
 */
export function createTokenFilterFunction<
  T extends Token | TokenInfo,
>(search: string): (tokens: T) => boolean {
  const searchingAddress = isAddress(search);

  if (searchingAddress) {
    const lower = searchingAddress.toLowerCase();
    return (t: T) => lower === t.address.toLowerCase();
  }

  const lowerSearchParts = search
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 0);

  if (lowerSearchParts.length === 0) return () => true;

  const matchesSearch = (s: string): boolean => {
    const sParts = s
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0);

    return lowerSearchParts.every(
      (p) =>
        p.length === 0 ||
        sParts.some((sp) => sp.startsWith(p) || sp.endsWith(p)),
    );
  };

  return ({ name, symbol }: T): boolean =>
    Boolean(
      (symbol && matchesSearch(symbol)) ||
        (name && matchesSearch(name)),
    );
}

// compare two token amounts with highest one coming first
function balanceComparator(
  balanceA?: TokenAmount,
  balanceB?: TokenAmount,
) {
  if (balanceA && balanceB) {
    return balanceA.greaterThan(balanceB)
      ? -1
      : balanceA.equalTo(balanceB)
      ? 0
      : 1;
  }
  if (balanceA && balanceA.greaterThan('0')) {
    return -1;
  }
  if (balanceB && balanceB.greaterThan('0')) {
    return 1;
  }
  return 0;
}

export function filterTokens<T extends Token | TokenInfo>(
  tokens: T[],
  search: string,
): T[] {
  return tokens.filter(createTokenFilterFunction(search));
}

function getTokenComparator(balances: {
  [tokenAddress: string]: TokenAmount | undefined;
}): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    // -1 = a is first
    // 1 = b is first

    // sort by balances
    const balanceA = balances[tokenA.address];
    const balanceB = balances[tokenB.address];

    const balanceComp = balanceComparator(balanceA, balanceB);
    if (balanceComp !== 0) return balanceComp;

    if (tokenA.symbol && tokenB.symbol) {
      // sort by symbol
      return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase()
        ? -1
        : 1;
    } else {
      return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0;
    }
  };
}
export function useAllTokenBalances(): {
  [tokenAddress: string]: TokenAmount | undefined;
} {
  const allTokens = useAllTokens();
  const allTokensArray = useMemo(
    () => Object.values(allTokens ?? {}),
    [allTokens],
  );
  const { data } = useTokenBalances(allTokensArray);
  return data ?? {};
}

export function useTokenComparator(
  inverted: boolean,
): (tokenA: Token, tokenB: Token) => number {
  const balances = useAllTokenBalances();
  const comparator = useMemo(
    () => getTokenComparator(balances ?? {}),
    [balances],
  );
  return useMemo(() => {
    if (inverted) {
      return (tokenA: Token, tokenB: Token) =>
        comparator(tokenA, tokenB) * -1;
    } else {
      return comparator;
    }
  }, [inverted, comparator]);
}

export function useSortedTokensByQuery(
  tokens: Token[] | undefined,
  searchQuery: string,
): Token[] {
  return useMemo(() => {
    if (!tokens) {
      return [];
    }

    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((s) => s.length > 0);

    if (symbolMatch.length > 1) {
      return tokens;
    }

    const exactMatches: Token[] = [];
    const symbolSubstrings: Token[] = [];
    const rest: Token[] = [];

    // sort tokens by exact match -> substring on symbol match -> rest
    tokens.map((token) => {
      if (token.symbol?.toLowerCase() === symbolMatch[0]) {
        return exactMatches.push(token);
      }
      if (
        token.symbol
          ?.toLowerCase()
          .startsWith(searchQuery.toLowerCase().trim())
      ) {
        return symbolSubstrings.push(token);
      }
      return rest.push(token);
    });

    return [...exactMatches, ...symbolSubstrings, ...rest];
  }, [tokens, searchQuery]);
}

export function CurrencyList({
  onSelect,
}: {
  onSelect: (currency: Currency) => void;
}) {
  const allTokens = useAllTokens();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  // if they input an address, use it
  const searchToken = useTokenSWR(debouncedQuery);
  // const searchTokenIsAdded = useIsUserAddedToken(searchToken);

  const showETH: boolean = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim();
    return s === '' || s === 'b' || s === 'bn' || s === 'bnb';
  }, [debouncedQuery]);

  const tokenComparator = useTokenComparator(false);

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(
    sortedTokens,
    debouncedQuery,
  );

  return (
    <div>
      {filteredSortedTokens.map((token) => {
        return (
          <CurrencyListItem
            onSelect={onSelect}
            key={token.address}
            token={token}
          />
        );
      })}
    </div>
  );
}

function CurrencyListItem({
  token,
  onSelect,
}: {
  token: Token;
  onSelect: (currency: Currency) => void;
}) {
  const { data: balance } = useTokenBalanceSWR(token);
  return (
    <Flex justify="between" onClick={() => onSelect(token)}>
      <Box>
        <Box>{token.symbol}</Box>
      </Box>
      {balance?.toSignificant(6)}
    </Flex>
  );
}
