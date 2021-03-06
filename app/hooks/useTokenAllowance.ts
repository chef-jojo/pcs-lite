import { Token, TokenAmount } from '@pancakeswap/sdk';
import { useMemo } from 'react';
import { useTokenContract } from './use-contract';
import {
  immutableMiddleware,
  useSWRContract,
} from './useSWRContract';

function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string,
): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false);
  const enable = !!contract && !!owner && !!spender && !!token;

  const { data } = useSWRContract(
    enable ? [contract, 'allowance', [owner, spender]] : null,
    {
      use: [immutableMiddleware],
    },
  );

  return useMemo(
    () =>
      token && data
        ? new TokenAmount(token, data.toString())
        : undefined,
    [token, data],
  );
}

export default useTokenAllowance;
