import { BigNumber } from 'ethers';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { $userDeadLine } from '~/state/user';
import useCurrentBlockTimestamp from './useCurrentBlockTimestamp';

// combines the block timestamp with the user setting to give the deadline that should be used for any submitted transaction
export default function useTransactionDeadline():
  | BigNumber
  | undefined {
  const [ttl] = useAtom($userDeadLine);
  const { data: blockTimestamp } = useCurrentBlockTimestamp();
  return useMemo(() => {
    if (blockTimestamp && ttl)
      // @ts-ignore FIXME: blockTimestamp should be object instead of big number
      return blockTimestamp.add(ttl);
    return undefined;
  }, [blockTimestamp, ttl]);
}
