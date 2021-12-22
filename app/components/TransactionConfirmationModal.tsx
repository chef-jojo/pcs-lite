import { ChainId, Currency, Token } from '@pancakeswap/sdk';
import { ArrowUpIcon, ErrorIcon, MetamaskIcon } from '@pcs/icons';
import {
  Box,
  Button,
  ExternalLink,
  Flex,
  Grid,
  Modal,
  ModalTitle,
  ModalContent,
  Spinner,
  styled,
  Text,
} from '@pcs/ui';
import React, { ComponentProps } from 'react';
import { registerToken } from 'utils/wallet';
import { wrappedCurrency } from 'utils/wrapped';
import { useActiveWeb3React } from '~/hooks/use-web3';
import { useTranslation } from '~/hooks/useTranslation';
import { getBscScanLink } from '~/utils';

const Wrapper = styled('div', {
  width: '100%',
});

const Section = styled(Flex, {
  padding: '24px',
});

const ConfirmedIcon = styled(Flex, {
  padding: '24px 0',
});

function ConfirmationPendingContent({
  pendingText,
}: {
  pendingText: string;
}) {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <ConfirmedIcon>
        <Spinner />
      </ConfirmedIcon>
      <Grid gap="3" justify="center" css={{ textAlign: 'center' }}>
        <Text size="h4">{t('Waiting For Confirmation')}</Text>
        <Grid gap="3" justify="center">
          <Text bold size="sm">
            {pendingText}
          </Text>
        </Grid>
        <Text size="sm" color="textSubtle">
          {t('Confirm this transaction in your wallet')}
        </Text>
      </Grid>
    </Wrapper>
  );
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  currencyToAdd,
}: {
  onDismiss: () => void;
  hash: string | undefined;
  chainId: ChainId;
  currencyToAdd?: Currency | undefined;
}) {
  const { library } = useActiveWeb3React();

  const { t } = useTranslation();

  const token: Token | undefined = wrappedCurrency(
    currencyToAdd,
    chainId,
  );

  return (
    <Wrapper>
      <Section>
        <ConfirmedIcon>
          <ArrowUpIcon
            strokeWidth={0.5}
            width="90px"
            color="primary"
          />
        </ConfirmedIcon>
        <Grid gap="3" justify="center">
          <Text size="h4">{t('Transaction Submitted')}</Text>
          {chainId && hash && (
            <ExternalLink
              size="sm"
              href={getBscScanLink(hash, 'transaction', chainId)}
            >
              {t('View on BscScan')}
            </ExternalLink>
          )}
          {currencyToAdd && library?.provider?.isMetaMask && (
            <Button
              variant="tertiary"
              disabled={!token}
              css={{
                mt: '12px',
                width: 'fit-content',
              }}
              onClick={() => {
                if (token) {
                  registerToken(
                    token.address,
                    token.symbol!,
                    token.decimals,
                  );
                }
              }}
            >
              <Flex>
                {t('Add %asset% to Metamask', {
                  asset: currencyToAdd.symbol,
                })}
                <MetamaskIcon width="16px" ml="6px" />
              </Flex>
            </Button>
          )}
          <Button
            onClick={onDismiss}
            css={{
              mt: '20px',
            }}
          >
            {t('Close')}
          </Button>
        </Grid>
      </Section>
    </Wrapper>
  );
}

export function ConfirmationModalContent({
  bottomContent,
  topContent,
}: {
  topContent: () => React.ReactNode;
  bottomContent: () => React.ReactNode;
}) {
  return (
    <Wrapper>
      <Box>{topContent()}</Box>
      <Box>{bottomContent()}</Box>
    </Wrapper>
  );
}

export function TransactionErrorContent({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Wrapper>
      <Grid justify="center">
        <ErrorIcon color="failure" width="64px" />
        <Text
          color="failure"
          style={{ textAlign: 'center', width: '85%' }}
        >
          {message}
        </Text>
      </Grid>

      <Flex justify="center" css={{ pt: '24px' }}>
        {/* <AlertModalCancel asChild> */}
        <Button onClick={onDismiss}>{t('Dismiss')}</Button>
        {/* </AlertModalCancel> */}
      </Flex>
    </Wrapper>
  );
}

interface ConfirmationModalProps {
  title: string;
  customOnDismiss?: () => void;
  hash: string | undefined;
  content: () => React.ReactNode;
  attemptingTxn: boolean;
  pendingText: string;
  currencyToAdd?: Currency | undefined;
}

const TransactionConfirmationModal: React.FC<
  ConfirmationModalProps &
    Omit<ComponentProps<typeof Modal>, 'children'>
> = ({
  title,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
  ...props
}) => {
  const { chainId } = useActiveWeb3React();

  if (!chainId) return null;

  return (
    <Modal {...props}>
      <ModalContent>
        <ModalTitle>{title}</ModalTitle>
        {attemptingTxn ? (
          <ConfirmationPendingContent pendingText={pendingText} />
        ) : hash ? (
          <TransactionSubmittedContent
            chainId={chainId}
            hash={hash}
            onDismiss={() => props.onOpenChange?.(false)}
            currencyToAdd={currencyToAdd}
          />
        ) : (
          content()
        )}
      </ModalContent>
    </Modal>
  );
};

export default TransactionConfirmationModal;
