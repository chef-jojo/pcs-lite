import {
  Currency,
  currencyEquals,
  ETHER,
  Token,
  TokenAmount,
} from '@pancakeswap/sdk';
import {
  FixedSizeList as List,
  ListChildComponentProps,
  ListItemKeySelector,
} from 'react-window';
import {
  Box,
  Button,
  Flex,
  Input,
  ModalHeader,
  styled,
  Text,
} from '@pcs/ui';
import { TokenInfo } from '@uniswap/token-lists';
import { atom, useAtom } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useDebounce from '~/hooks/use-debounce';
import {
  useTokenBalances,
  useTokenBalanceSWR,
  useTokenSWR,
} from '~/hooks/use-token';
import {
  useAllInactiveTokens,
  useAllTokens,
  useFoundOnInactiveList,
  useIsUserAddedToken,
} from '~/hooks/useTokenList';
import { useTranslation } from '~/hooks/useTranslation';
import { isAddress } from '~/utils/is-address';
import CurrencyLogo from '../logo/CurrencyLogo';
import { ManageList } from './manage';
import { useCurrencyBalance } from '~/hooks/use-currency';
import { Column } from '../layout/Column';
import { ImportRow } from './ImportRow';
import { isCurrencyToken } from '~/utils/is-token';
import QuestionHelper from '../QuestionHelper';
import { RowBetween } from '../layout/Row';
import { ImportToken } from './ImportToken';

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

enum CurrencyModalView {
  search,
  manage,
  importToken,
  importList,
}

const $currencyModalView = atom(CurrencyModalView.search);

export function CurrencySearch({
  onSelect,
  selectedCurrency,
  otherCurrency,
}: {
  selectedCurrency: Currency;
  otherCurrency: Currency;
  onSelect: (currency: Currency) => void;
}) {
  const [view, setView] = useAtom($currencyModalView);

  // used for import token flow
  const [importToken, setImportToken] = useState<Token | undefined>();

  useEffect(() => {
    setView(CurrencyModalView.search);
  }, [setView]);

  switch (view) {
    case CurrencyModalView.search:
      return (
        <>
          <ModalHeader>Select a token</ModalHeader>
          <Box css={{ py: '24px' }}>
            <CurrencySearchList
              onSelect={onSelect}
              selectedCurrency={selectedCurrency}
              otherCurrency={otherCurrency}
              setImportToken={setImportToken}
            />
          </Box>
        </>
      );

    case CurrencyModalView.manage:
      return (
        <>
          <ModalHeader
            onBack={() => {
              setView(CurrencyModalView.search);
            }}
          >
            Manage tokens
          </ModalHeader>
          <Box css={{ py: '24px' }}>
            <ManageList />
          </Box>
        </>
      );

    case CurrencyModalView.importToken:
      return importToken ? (
        <ImportToken
          tokens={[importToken]}
          handleCurrencySelect={onSelect}
        />
      ) : null;
    default:
      return null;
  }
}

function currencyKey(currency: Currency): string {
  return currency instanceof Token
    ? currency.address
    : currency === ETHER
    ? 'ETHER'
    : '';
}

export function CurrencySearchList({
  onSelect,
  selectedCurrency,
  otherCurrency,
  setImportToken,
}: {
  selectedCurrency: Currency;
  otherCurrency: Currency;
  onSelect: (currency: Currency) => void;
  setImportToken: (token: Token) => void;
}) {
  const allTokens = useAllTokens();
  const setModalView = useUpdateAtom($currencyModalView);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  // if they input an address, use it
  const { data: searchToken } = useTokenSWR(debouncedQuery);
  const searchTokenIsAdded = useIsUserAddedToken(searchToken);

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

  const { t } = useTranslation();
  const [, setView] = useAtom($currencyModalView);

  // if no results on main list, show option to expand into inactive
  const inactiveTokens = useFoundOnInactiveList(debouncedQuery);
  const filteredInactiveTokens: Token[] = useSortedTokensByQuery(
    inactiveTokens,
    debouncedQuery,
  );

  return (
    <>
      <Box css={{ px: '24px', pb: '24px' }}>
        <Input
          size="lg"
          placeholder={t('Search name or paste address')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>
      <Box>
        {searchToken && !searchTokenIsAdded ? (
          <Column css={{ padding: '20px 0', height: '100%' }}>
            <ImportRow
              token={searchToken}
              showImportView={() =>
                setView(CurrencyModalView.importToken)
              }
              setImportToken={setImportToken}
            />
          </Column>
        ) : (
          <CurrencyList
            tokens={
              filteredInactiveTokens
                ? filteredSortedTokens.concat(filteredInactiveTokens)
                : filteredSortedTokens
            }
            onSelect={onSelect}
            breakIndex={
              inactiveTokens && filteredSortedTokens
                ? filteredSortedTokens.length
                : undefined
            }
            otherCurrency={otherCurrency}
            selectedCurrency={selectedCurrency}
            showETH={showETH}
            setImportToken={setImportToken}
          />
        )}
      </Box>
      <Button
        size="sm"
        variant="text"
        onClick={() => setModalView(CurrencyModalView.manage)}
        className="list-token-manage-button"
      >
        {t('Manage Tokens')}
      </Button>
    </>
  );
}

const FixedContentRow = styled('div', {
  padding: '4px 20px',
  height: 56,
  display: 'grid',
  gridGap: 16,
  alignItems: 'center',
});

function CurrencyList({
  tokens,
  showETH = true,
  onSelect,
  selectedCurrency,
  otherCurrency,
  breakIndex,
  setImportToken,
}: {
  tokens: Token[];
  showETH?: boolean;
  selectedCurrency: Currency;
  otherCurrency: Currency;
  onSelect: (currency: Currency) => void;
  breakIndex?: number;
  setImportToken: (token: Token) => void;
}) {
  const itemKey: ListItemKeySelector<(Currency | undefined)[]> =
    useCallback(
      (index, item) =>
        !!item[index] ? currencyKey(item[index]!) : index,
      [],
    );

  const itemData: (Currency | undefined)[] = useMemo(() => {
    let formatted: (Currency | undefined)[] = showETH
      ? [Currency.ETHER, ...tokens]
      : tokens;
    if (breakIndex !== undefined) {
      formatted = [
        ...formatted.slice(0, breakIndex),
        undefined,
        ...formatted.slice(breakIndex, formatted.length),
      ];
    }
    return formatted;
  }, [showETH, tokens, breakIndex]);

  const inactiveTokens = useAllInactiveTokens();
  const { t } = useTranslation();
  const [, setView] = useAtom($currencyModalView);

  const Row = useCallback(
    ({
      data,
      index,
      style,
    }: ListChildComponentProps<(Currency | undefined)[]>) => {
      const currency = data[index];
      const isSelected = Boolean(
        selectedCurrency &&
          currency &&
          currencyEquals(selectedCurrency, currency),
      );
      const otherSelected = Boolean(
        otherCurrency &&
          currency &&
          currencyEquals(otherCurrency, currency),
      );

      const showImport =
        inactiveTokens &&
        currency &&
        isCurrencyToken(currency) &&
        Object.keys(inactiveTokens).includes(currency.address);

      if (index === breakIndex || !data) {
        return (
          <FixedContentRow style={style}>
            <Box
              css={{
                padding: '8px 12px',
                br: '6px',
                bc: '$background',
                border: '1px solid $cardBorder',
              }}
            >
              <RowBetween>
                <Text size="sm">
                  {t('Expanded results from inactive Token Lists')}
                </Text>
                <QuestionHelper
                  text={t(
                    "Tokens from inactive lists. Import specific tokens below or click 'Manage' to activate more lists.",
                  )}
                  css={{ ml: '$1' }}
                />
              </RowBetween>
            </Box>
          </FixedContentRow>
        );
      }

      if (showImport && currency && isCurrencyToken(currency)) {
        return (
          <ImportRow
            style={style}
            token={currency}
            showImportView={() =>
              setView(CurrencyModalView.importToken)
            }
            setImportToken={setImportToken}
            dim
          />
        );
      }

      return (
        <StyledItem
          onClick={() => onSelect(currency!)}
          disabled={otherSelected}
          selected={isSelected}
          style={style}
        >
          <CurrencyListItem currency={currency!} />
        </StyledItem>
      );
    },
    [
      breakIndex,
      inactiveTokens,
      onSelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      setView,
      t,
    ],
  );

  return (
    <List
      height={390}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </List>
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

function CurrencyListItem({ currency }: { currency: Currency }) {
  const { data: balance, isValidating } =
    useCurrencyBalance(currency);

  return (
    <>
      <CurrencyLogo currency={currency} />
      <Box css={{ textAlign: 'left' }}>
        <Text>{currency.symbol}</Text>
        <Text>{currency.name}</Text>
      </Box>
      <Flex
        css={{
          justifySelf: 'flex-end',
        }}
      >
        <Text
          style={{
            opacity: isValidating ? 0.8 : 1,
          }}
        >
          {balance?.toSignificant(6)}
        </Text>
      </Flex>
    </>
  );
}
