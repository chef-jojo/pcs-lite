import { Trade } from '@pancakeswap/sdk';
import { useMemo } from 'react';
import { ROUTER_ADDRESS } from '~/config/constants';
import { useApproveCallback } from '~/hooks/useApproveCallback';
import { computeSlippageAdjustedAmounts } from '~/utils/price';
import { Field } from '../type';

export function useApproveCallbackFromTrade(
  trade?: Trade,
  allowedSlippage = 0,
) {
  const amountToApprove = useMemo(
    () =>
      trade
        ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[
            Field.INPUT
          ]
        : undefined,
    [trade, allowedSlippage],
  );

  return useApproveCallback(amountToApprove, ROUTER_ADDRESS);
}
