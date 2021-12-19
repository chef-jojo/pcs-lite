import { Currency, ETHER, Token } from '@pancakeswap/sdk';
import { BinanceIcon } from '@pcs/icons';
import React, { useMemo } from 'react';
import { WrappedTokenInfo } from '~/config/list';
import useHttpLocations from '../../hooks/useHttpLocations';
import getTokenLogoURL from '../../utils/getTokenLogoURL';
import Logo from './Logo';

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
}: {
  currency?: Currency;
  size?: string;
  style?: React.CSSProperties;
}) {
  const uriLocations = useHttpLocations(
    currency instanceof WrappedTokenInfo
      ? currency.logoURI
      : undefined,
  );

  const srcs: string[] = useMemo(() => {
    if (currency === ETHER) return [];

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address)];
      }
      return [getTokenLogoURL(currency.address)];
    }
    return [];
  }, [currency, uriLocations]);

  if (currency === ETHER) {
    return <BinanceIcon width={size} style={style} />;
  }

  return (
    <Logo
      width={size}
      height={size}
      srcs={srcs}
      alt={`${currency?.symbol ?? 'token'} logo`}
      style={style}
    />
  );
}
