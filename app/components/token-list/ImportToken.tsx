import { Currency, Token } from '@pancakeswap/sdk';
import { ErrorIcon } from '@pcs/icons';
import {
  Button,
  Checkbox,
  ExternalLink,
  Flex,
  Grid,
  Message,
  MessageText,
  Tag,
  Text,
} from '@pcs/ui';
import { useAtom } from 'jotai';
import React, { useState } from 'react';
import { useActiveWeb3React } from '~/hooks/use-web3';
import { useCombinedInactiveList } from '~/hooks/useTokenList';
import { useTranslation } from '~/hooks/useTranslation';
import { $userAddedTokens } from '~/state/user';
import { getBscScanLink } from '~/utils';
import truncateHash from '~/utils/truncateHash';
import { AutoColumn } from '../layout/Column';
import Logo from '../logo/Logo';

interface ImportProps {
  tokens: Token[];
  handleCurrencySelect?: (currency: Currency) => void;
}

export function ImportToken({
  tokens,
  handleCurrencySelect,
}: ImportProps) {
  const { chainId } = useActiveWeb3React();

  const { t } = useTranslation();

  const [confirmed, setConfirmed] = useState(false);

  const [, addToken] = useAtom($userAddedTokens);

  // use for showing import source on inactive tokens
  const inactiveTokenList = useCombinedInactiveList();

  return (
    <AutoColumn gap="4" css={{ padding: '24px' }}>
      <Message variant="warning">
        <MessageText>
          {t(
            'Anyone can create a BEP20 token on BSC with any name, including creating fake versions of existing tokens and tokens that claim to represent projects that do not have a token.',
          )}
          <br />
          <br />
          {t(
            'If you purchase an arbitrary token, you may be unable to sell it back.',
          )}
        </MessageText>
      </Message>

      {tokens.map((token) => {
        const list =
          chainId &&
          inactiveTokenList?.[chainId]?.[token.address]?.list;
        const address = token.address
          ? `${truncateHash(token.address)}`
          : null;
        return (
          <Grid
            key={token.address}
            gap="1"
            css={{ gridTemplateRows: '1fr 1fr 1fr' }}
          >
            {list ? (
              <Tag color="success" outline size="sm">
                {list.logoURI && (
                  <Logo srcs={[list.logoURI]} width="12px" />
                )}
                <span>
                  {t('via')} {list.name}
                </span>
              </Tag>
            ) : (
              <Tag color="failure" outline size="sm">
                <ErrorIcon color="failure" />
                {t('Unknown Source')}
              </Tag>
            )}
            <Flex align="center">
              <Text css={{ mr: '8px' }}>{token.name}</Text>
              <Text>({token.symbol})</Text>
            </Flex>
            {chainId && (
              <Flex
                justify="between"
                css={{
                  width: '100%',
                }}
              >
                <Text css={{ mr: '4px' }}>{address}</Text>
                <ExternalLink
                  href={getBscScanLink(
                    token.address,
                    'address',
                    chainId,
                  )}
                >
                  ({t('View on BscScan')})
                </ExternalLink>
              </Flex>
            )}
          </Grid>
        );
      })}

      <Flex justify="between" align="center">
        <Flex align="center" onClick={() => setConfirmed(!confirmed)}>
          <Checkbox
            size="sm"
            name="confirmed"
            checked={confirmed}
            onChange={() => setConfirmed(!confirmed)}
          />
          <Text css={{ ml: '8px' }} style={{ userSelect: 'none' }}>
            {t('I understand')}
          </Text>
        </Flex>
        <Button
          variant="danger"
          disabled={!confirmed}
          onClick={() => {
            tokens.map((token) =>
              addToken((s) => ({
                ...s,
                [String(chainId)]: {
                  ...s[String(chainId)],
                  [token.address]: token,
                },
              })),
            );
            if (handleCurrencySelect) {
              handleCurrencySelect(tokens[0]);
            }
          }}
          className=".token-dismiss-button"
        >
          {t('Import')}
        </Button>
      </Flex>
    </AutoColumn>
  );
}
