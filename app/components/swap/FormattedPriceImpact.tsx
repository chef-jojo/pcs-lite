import { Percent } from '@pancakeswap/sdk';
import { Text, styled } from '@pcs/ui';
import React from 'react';
import { warningSeverity } from '~/utils/price';
import { ONE_BIPS } from '~/config/constants';

const ErrorText = styled(Text, {
  color: '$success',
  variants: {
    severity: {
      0: {
        color: '$success',
      },
      1: {
        color: '$text',
      },
      2: {
        color: '$warning',
      },
      3: {
        color: '$failure',
      },
      4: {
        color: '$failure',
      },
    },
  },
});

/**
 * Formatted version of price impact text with warning colors
 */
export default function FormattedPriceImpact({
  priceImpact,
}: {
  priceImpact?: Percent;
}) {
  return (
    <ErrorText size="body" severity={warningSeverity(priceImpact)}>
      {priceImpact
        ? priceImpact.lessThan(ONE_BIPS)
          ? '<0.01%'
          : `${priceImpact.toFixed(2)}%`
        : '-'}
    </ErrorText>
  );
}
