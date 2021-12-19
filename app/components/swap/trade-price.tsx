import React from 'react';
import { Price } from '@pancakeswap/sdk';
import { AutoRenewIcon } from '@pcs/icons';
import { styled, Text } from '@pcs/ui';

interface TradePriceProps {
  price?: Price;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

const StyledBalanceMaxMini = styled('div', {
  height: 22,
  width: 22,
  backgroundColor: '$background',
  border: 'none',
  borderRadius: '50%',
  padding: '0.2rem',
  fontSize: '0.875rem',
  fontWeight: 400,
  marginLeft: '0.4rem',
  cursor: 'pointer',
  color: '$text',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  float: 'right',

  '&:hover': {
    bc: '$dropdown',
  },
  '&:focus': {
    bc: '$dropdown',
    outline: 'none',
  },
});

export default function TradePrice({
  price,
  showInverted,
  setShowInverted,
}: TradePriceProps) {
  const formattedPrice = showInverted
    ? price?.toSignificant(6)
    : price?.invert()?.toSignificant(6);

  const show = Boolean(price?.baseCurrency && price?.quoteCurrency);
  const label = showInverted
    ? `${price?.quoteCurrency?.symbol} per ${price?.baseCurrency?.symbol}`
    : `${price?.baseCurrency?.symbol} per ${price?.quoteCurrency?.symbol}`;

  return (
    <Text
      css={{
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
    >
      {show ? (
        <>
          {formattedPrice ?? '-'} {label}
          <StyledBalanceMaxMini
            onClick={() => setShowInverted(!showInverted)}
          >
            <AutoRenewIcon width="14px" />
          </StyledBalanceMaxMini>
        </>
      ) : (
        '-'
      )}
    </Text>
  );
}
