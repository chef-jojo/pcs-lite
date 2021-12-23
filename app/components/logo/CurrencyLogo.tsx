import { Currency, ETHER, Token } from '@pancakeswap/sdk';
import { BinanceIcon } from '@pcs/icons';
import React, { useMemo } from 'react';
import { WrappedTokenInfo } from '~/config/list';
import useHttpLocations from '../../hooks/useHttpLocations';
import getTokenLogoURL from '../../utils/getTokenLogoURL';
import Logo from './Logo';
import { CSS } from '@pcs/ui';

export default function CurrencyLogo({
  currency,
  size = '24px',
  css,
}: {
  currency?: Currency;
  size?: string;
  css?: CSS;
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
    return <BinanceIcon width={size} css={css} />;
  }

  return (
    <Logo
      width={size}
      height={size}
      srcs={srcs}
      alt={`${currency?.symbol ?? 'token'} logo`}
      css={css}
    />
  );
}
