import {
  Currency,
  currencyEquals,
  Token,
  TokenAmount,
} from '@pancakeswap/sdk';
import { Box, Flex, styled, Text } from '@pcs/ui';
import { TokenInfo } from '@uniswap/token-lists';
import { useMemo, useState } from 'react';
import useDebounce from '~/hooks/use-debounce';
import {
  useAllTokens,
  useTokenBalances,
  useTokenBalanceSWR,
  useTokenSWR,
} from '~/hooks/use-token';
import { isAddress } from '~/utils/is-address';
import CurrencyLogo from './logo/CurrencyLogo';

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
  selectedCurrency,
  otherCurrency,
}: {
  selectedCurrency: Currency;
  otherCurrency: Currency;
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
    <Box css={{ overflow: 'scroll', height: '390px' }}>
      {filteredSortedTokens.map((token) => {
        return (
          <CurrencyListItem
            onSelect={onSelect}
            key={token.address}
            selectedCurrency={selectedCurrency}
            otherCurrency={otherCurrency}
            token={token}
          />
        );
      })}
    </Box>
  );
}

const StyledItem = styled('div', {
  padding: '4px 20px',
  height: 56,
  display: 'grid',
  alignItems: 'center',
  gridTemplateColumns: 'auto minmax(auto, 1fr) minmax(0, 72px)',
  gap: '$2',
  variants: {
    selected: {
      true: {
        opacity: 0.5,
      },
    },
    disabled: {
      true: {
        pointerEvents: 'none',
        opacity: 0.5,
      },
      false: {
        cursor: 'pointer',
        '&:hover': {
          bc: '$background',
        },
      },
    },
  },
});

function CurrencyListItem({
  token,
  onSelect,
  selectedCurrency,
  otherCurrency,
}: {
  token: Token;
  selectedCurrency: Currency;
  otherCurrency: Currency;
  onSelect: (currency: Currency) => void;
}) {
  const { data: balance } = useTokenBalanceSWR(token);
  const isSelected = Boolean(
    selectedCurrency && currencyEquals(selectedCurrency, token),
  );
  const otherSelected = Boolean(
    otherCurrency && currencyEquals(otherCurrency, token),
  );

  return (
    <StyledItem
      onClick={() => onSelect(token)}
      disabled={otherSelected}
      selected={isSelected}
    >
      <CurrencyLogo currency={token} />
      <Box css={{ textAlign: 'left' }}>
        <Text>{token.symbol}</Text>
        <Text>{token.name}</Text>
      </Box>
      <Flex css={{ justifySelf: 'flex-end' }}>
        <Text>{balance?.toSignificant(6)}</Text>
      </Flex>
    </StyledItem>
  );
}
