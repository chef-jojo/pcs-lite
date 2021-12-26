import { Token } from '@pancakeswap/sdk';
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists';

const PANCAKE_EXTENDED =
  'https://tokens.pancakeswap.finance/pancakeswap-extended.json';
const PANCAKE_TOP100 =
  'https://tokens.pancakeswap.finance/pancakeswap-top-100.json';

export const UNSUPPORTED_LIST_URLS: string[] = [];

// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS: string[] = [
  PANCAKE_TOP100,
  PANCAKE_EXTENDED,
  ...UNSUPPORTED_LIST_URLS, // need to load unsupported tokens as well
];

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [];

type ListState = {
  readonly current: TokenList | null;
  readonly pendingUpdate: TokenList | null;
  readonly loadingRequestId: string | null;
  readonly error: string | null;
};

const NEW_LIST_STATE: ListState = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null,
};

export const LIST_BY_URL: Record<string, ListState> = {
  ...DEFAULT_LIST_OF_LISTS.concat(...UNSUPPORTED_LIST_URLS).reduce(
    (memo, listUrl) => {
      // @ts-ignore
      memo[listUrl] = NEW_LIST_STATE;
      return memo;
    },
    {},
  ),
};

type TagDetails = Tags[keyof Tags];
export interface TagInfo extends TagDetails {
  id: string;
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: TokenInfo;

  public readonly tags: TagInfo[];

  constructor(tokenInfo: TokenInfo, tags: TagInfo[]) {
    super(
      tokenInfo.chainId,
      tokenInfo.address,
      tokenInfo.decimals,
      tokenInfo.symbol,
      tokenInfo.name,
    );
    this.tokenInfo = tokenInfo;
    this.tags = tags;
  }

  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI;
  }
}

export type TokenAddressMap = Readonly<{
  [chainId: number]: Readonly<{
    [tokenAddress: string]: {
      token: WrappedTokenInfo;
      list: TokenList;
    };
  }>;
}>;

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>;
};

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined'
    ? new WeakMap<TokenList, TokenAddressMap>()
    : null;

export function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list);
  if (result) return result;

  const map = list.tokens.reduce<Mutable<TokenAddressMap>>(
    (tokenMap, tokenInfo) => {
      // @ts-ignore
      const token = new WrappedTokenInfo(tokenInfo, list);
      if (tokenMap[token.chainId]?.[token.address] !== undefined) {
        console.error(`Duplicate token! ${token.address}`);
        return tokenMap;
      }
      if (!tokenMap[token.chainId]) tokenMap[token.chainId] = {};
      tokenMap[token.chainId][token.address] = {
        token,
        list,
      };
      return tokenMap;
    },
    {},
  ) as TokenAddressMap;
  listCache?.set(list, map);
  return map;
}
