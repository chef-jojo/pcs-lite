import { Token, TokenAmount } from '@pancakeswap/sdk';
import { useMemo } from 'react';
import { useTokenContract } from './use-contract';
import { useSWRContract } from './useSWRContract';

function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string,
): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false);
  const { data } = useSWRContract(contract, 'allowance', [
    owner,
    spender,
  ]);

  return useMemo(
    () =>
      token && data
        ? new TokenAmount(token, data.toString())
        : undefined,
    [token, data],
  );
}

export default useTokenAllowance;
