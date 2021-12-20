import { TokenList } from '@uniswap/token-lists';
import { atom } from 'jotai';
import {
  DEFAULT_LIST_OF_LISTS,
  UNSUPPORTED_LIST_URLS,
} from '~/config/list';

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

export const $listActiveListUrls = atom<string[]>([]);
export const $listUrls = atom(DEFAULT_LIST_OF_LISTS);
export const $listByUrls = atom({
  ...DEFAULT_LIST_OF_LISTS.concat(...UNSUPPORTED_LIST_URLS).reduce<
    Record<string, ListState>
  >((memo, listUrl) => {
    memo[listUrl] = NEW_LIST_STATE;
    return memo;
  }, {}),
});
