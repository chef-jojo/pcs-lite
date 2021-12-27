import React, { CSSProperties } from 'react';
import { Token } from '@pancakeswap/sdk';
import { Button, Text, styled, CSS } from '@pcs/ui';
import { CheckmarkCircleIcon } from '@pcs/icons';
import { useActiveWeb3React } from '~/hooks/use-web3';
import { useTranslation } from '~/hooks/useTranslation';
import CurrencyLogo from '../logo/CurrencyLogo';
import { AutoColumn } from '../layout/Column';
import { AutoRow, RowFixed } from '../layout/Row';
import Logo from '../logo/Logo';
import {
  useAllTokens,
  useCombinedInactiveList,
  useIsUserAddedToken,
} from '~/hooks/useTokenList';

const TokenSection = styled('div', {
  padding: '4px 20px',
  height: 56,
  display: 'grid',
  gridTemplateColumns: 'auto minmax(auto, 1fr) auto',
  gridGap: 16,
  alignItems: 'center',
  width: '100%',
});

const NameOverflow = styled('div', {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 140,
  fontSize: 12,
});

function useIsTokenActive(token: Token | undefined | null): boolean {
  const activeTokens = useAllTokens();

  if (!activeTokens || !token) {
    return false;
  }

  return !!activeTokens[token.address];
}

export function ImportRow({
  token,
  style,
  dim,
  showImportView,
  setImportToken,
}: {
  token: Token;
  style?: CSSProperties;
  dim?: boolean;
  showImportView: () => void;
  setImportToken: (token: Token) => void;
}) {
  // globals
  const { chainId } = useActiveWeb3React();

  const { t } = useTranslation();

  // check if token comes from list
  const inactiveTokenList = useCombinedInactiveList();
  const list =
    chainId && inactiveTokenList?.[chainId]?.[token.address]?.list;

  // check if already active on list or local storage tokens
  const isAdded = useIsUserAddedToken(token);
  const isActive = useIsTokenActive(token);

  return (
    <TokenSection style={style}>
      <CurrencyLogo
        currency={token}
        size="24px"
        css={{ opacity: dim ? '0.6' : '1', mr: '$2' }}
      />
      <AutoColumn css={{ gap: '$1', opacity: dim ? '0.6' : '1' }}>
        <AutoRow>
          <Text>{token.symbol}</Text>
          <Text css={{ ml: '8px', color: '$textDisabled' }}>
            <NameOverflow title={token.name}>
              {token.name}
            </NameOverflow>
          </Text>
        </AutoRow>
        {list && list.logoURI && (
          <RowFixed>
            <Text size="sm" css={{ mr: '$1', color: '$textSubtle' }}>
              {t('via')} {list.name}
            </Text>
            <Logo srcs={[list.logoURI]} css={{ size: '12px' }} />
          </RowFixed>
        )}
      </AutoColumn>
      {!isActive && !isAdded ? (
        <Button
          css={{ width: 'fit-content' }}
          onClick={() => {
            if (setImportToken) {
              setImportToken(token);
            }
            showImportView();
          }}
        >
          {t('Import')}
        </Button>
      ) : (
        <RowFixed style={{ minWidth: 'fit-content' }}>
          <CheckmarkCircleIcon />
          <Text css={{ color: '$success' }}>Active</Text>
        </RowFixed>
      )}
    </TokenSection>
  );
}
