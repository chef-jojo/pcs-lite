import React, { useMemo } from 'react';
import { Trade, TradeType } from '@pancakeswap/sdk';
import { Button, styled, Text } from '@pcs/ui';
import { ErrorIcon, ArrowDownIcon } from '@pcs/icons';
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  warningSeverity,
} from '~/utils/price';
import { AutoColumn } from '~/components/layout/Column';
import truncateHash from 'utils/truncateHash';
import { useTranslation } from '~/hooks/useTranslation';
import { Field } from './type';
import { RowBetween, RowFixed } from '../layout/Row';
import CurrencyLogo from '../logo/CurrencyLogo';

const SwapShowAcceptChanges = styled(AutoColumn, {
  bc: 'rgba($warning, 0.2)',
  padding: '0.5rem',
  borderRadius: 12,
  marginTop: 8,
});

export default function SwapModalHeader({
  trade,
  allowedSlippage,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
}: {
  trade: Trade;
  allowedSlippage: number;
  recipient: string | null;
  showAcceptChanges: boolean;
  onAcceptChanges: () => void;
}) {
  const { t } = useTranslation();
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [trade, allowedSlippage],
  );
  const { priceImpactWithoutFee } = useMemo(
    () => computeTradePriceBreakdown(trade),
    [trade],
  );
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);

  const amount =
    trade.tradeType === TradeType.EXACT_INPUT
      ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)
      : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6);
  const symbol =
    trade.tradeType === TradeType.EXACT_INPUT
      ? trade.outputAmount.currency.symbol
      : trade.inputAmount.currency.symbol;

  const tradeInfoText =
    trade.tradeType === TradeType.EXACT_INPUT
      ? t(
          'Output is estimated. You will receive at least %amount% %symbol% or the transaction will revert.',
          {
            amount,
            symbol,
          },
        )
      : t(
          'Input is estimated. You will sell at most %amount% %symbol% or the transaction will revert.',
          {
            amount,
            symbol,
          },
        );

  const [estimatedText, transactionRevertText] = tradeInfoText.split(
    `${amount} ${symbol}`,
  );

  const truncatedRecipient = recipient ? truncateHash(recipient) : '';

  const recipientInfoText = t('Output will be sent to %recipient%', {
    recipient: truncatedRecipient,
  });

  const [recipientSentToText, postSentToText] =
    recipientInfoText.split(truncatedRecipient);

  return (
    <AutoColumn gap="4">
      <RowBetween align="end">
        <RowFixed>
          <CurrencyLogo
            currency={trade.inputAmount.currency}
            size="24px"
            css={{
              mr: '12px',
            }}
          />
          <Text
            // ellipsis
            size="h3"
            css={{
              color:
                showAcceptChanges &&
                trade.tradeType === TradeType.EXACT_OUTPUT
                  ? '$primary'
                  : '$text',
            }}
          >
            {trade.inputAmount.toSignificant(6)}
          </Text>
        </RowFixed>
        <RowFixed>
          <Text
            size="h3"
            css={{
              ml: '10px',
            }}
          >
            {trade.inputAmount.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowFixed>
        <ArrowDownIcon width="16px" ml="4px" />
      </RowFixed>
      <RowBetween align="end">
        <RowFixed>
          <CurrencyLogo
            currency={trade.outputAmount.currency}
            size="24px"
            css={{
              mr: '12px',
            }}
          />
          <Text
            // ellipsis
            size="h3"
            css={{
              color:
                priceImpactSeverity > 2
                  ? 'failure'
                  : showAcceptChanges &&
                    trade.tradeType === TradeType.EXACT_INPUT
                  ? '$primary'
                  : '$text',
            }}
          >
            {trade.outputAmount.toSignificant(6)}
          </Text>
        </RowFixed>
        <RowFixed>
          <Text size="h3" css={{ ml: '10px' }}>
            {trade.outputAmount.currency.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="start">
          <RowBetween>
            <RowFixed>
              <ErrorIcon mr="8px" />
              <Text bold> {t('Price Updated')}</Text>
            </RowFixed>
            <Button onClick={onAcceptChanges}>{t('Accept')}</Button>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}
      <AutoColumn
        justify="start"
        gap="2"
        css={{ padding: '24px 0 0 0px' }}
      >
        <Text
          size="sm"
          css={{
            color: '$textSubtle',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {estimatedText}
          <b>
            {amount} {symbol}
          </b>
          {transactionRevertText}
        </Text>
      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn
          justify="start"
          gap="2"
          css={{ padding: '12px 0 0 0px' }}
        >
          <Text color="textSubtle">
            {recipientSentToText}
            <b title={recipient}>{truncatedRecipient}</b>
            {postSentToText}
          </Text>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  );
}
