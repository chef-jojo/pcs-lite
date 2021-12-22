import React, { useMemo, useState } from 'react';
import { Trade, TradeType } from '@pancakeswap/sdk';
import { Button, Text, styled } from '@pcs/ui';
import { AutoRenewIcon, ErrorIcon } from '@pcs/icons';
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  formatExecutionPrice,
  warningSeverity,
} from '~/utils/price';
import QuestionHelper from 'components/QuestionHelper';
import { AutoRow, RowBetween, RowFixed } from 'components/layout/Row';
import FormattedPriceImpact from './FormattedPriceImpact';
import { useTranslation } from '~/hooks/useTranslation';
import { AutoColumn } from '../layout/Column';
import { Field } from './type';

const StyledBalanceMaxMini = styled('button', {
  height: 22,
  width: 22,
  border: 'none',
  borderRadius: '50%',
  padding: '0.2rem',
  fontSize: '0.875rem',
  fontWeight: 400,
  marginLeft: '0.4rem',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  float: 'right',
  color: '$text',
  backgroundColor: '$background',
  '&:hover': {
    backgroundColor: '$dropdown',
  },
  '&:focus': {
    backgroundColor: '$dropdown',
    outline: 'none',
  },
});

const SwapModalFooterContainer = styled(AutoColumn, {
  marginTop: '24px',
  padding: '$3',
  borderRadius: '$default',
  border: '1px solid $cardBorder',
  backgroundColor: '$background',
});

const SwapCallbackErrorInner = styled('div', {
  borderRadius: '1rem',
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.825rem',
  width: '100%',
  padding: '3rem 1.25rem 1rem 1rem',
  marginTop: '-2rem',
  zIndex: '-1',
  backgroundColor: '$failure33',
  color: '$failure',
  '& p': {
    padding: '0px',
    margin: 0,
    fontWeight: 500,
  },
});

const SwapCallbackErrorInnerAlertTriangle = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  borderRadius: 12,
  minWidth: 48,
  height: 48,
  backgroundColor: '$failure33',
});

export function SwapCallbackError({ error }: { error: string }) {
  return (
    <SwapCallbackErrorInner>
      <SwapCallbackErrorInnerAlertTriangle>
        <ErrorIcon width="24px" />
      </SwapCallbackErrorInnerAlertTriangle>
      <p>{error}</p>
    </SwapCallbackErrorInner>
  );
}

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: Trade;
  allowedSlippage: number;
  onConfirm: () => void;
  swapErrorMessage: string | undefined;
  disabledConfirm: boolean;
}) {
  const { t } = useTranslation();
  const [showInverted, setShowInverted] = useState<boolean>(false);
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [allowedSlippage, trade],
  );
  const { priceImpactWithoutFee, realizedLPFee } = useMemo(
    () => computeTradePriceBreakdown(trade),
    [trade],
  );
  const severity = warningSeverity(priceImpactWithoutFee);

  return (
    <>
      <SwapModalFooterContainer>
        <RowBetween align="center">
          <Text>{t('Price')}</Text>
          <Text
            size="sm"
            css={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px',
            }}
          >
            {formatExecutionPrice(trade, showInverted)}
            <StyledBalanceMaxMini
              onClick={() => setShowInverted(!showInverted)}
            >
              <AutoRenewIcon width="14px" />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <Text size="sm">
              {trade.tradeType === TradeType.EXACT_INPUT
                ? t('Minimum received')
                : t('Maximum sold')}
            </Text>
            <QuestionHelper
              text={t(
                'Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.',
              )}
              css={{
                mt: '4px',
              }}
            />
          </RowFixed>
          <RowFixed>
            <Text size="sm">
              {trade.tradeType === TradeType.EXACT_INPUT
                ? slippageAdjustedAmounts[
                    Field.OUTPUT
                  ]?.toSignificant(4) ?? '-'
                : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(
                    4,
                  ) ?? '-'}
            </Text>
            <Text size="sm" css={{ ml: '4px' }}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? trade.outputAmount.currency.symbol
                : trade.inputAmount.currency.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <Text size="sm">{t('Price Impact')}</Text>
            <QuestionHelper
              text={t(
                'The difference between the market price and your price due to trade size.',
              )}
              css={{
                ml: '4px',
              }}
            />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <Text size="sm">{t('Liquidity Provider Fee')}</Text>
            <QuestionHelper
              text={
                <>
                  <Text css={{ mb: '12px' }}>
                    {t('For each trade a %amount% fee is paid', {
                      amount: '0.25%',
                    })}
                  </Text>
                  <Text>
                    -{' '}
                    {t('%amount% to LP token holders', {
                      amount: '0.17%',
                    })}
                  </Text>
                  <Text>
                    -{' '}
                    {t('%amount% to the Treasury', {
                      amount: '0.03%',
                    })}
                  </Text>
                  <Text>
                    -{' '}
                    {t('%amount% towards CAKE buyback and burn', {
                      amount: '0.05%',
                    })}
                  </Text>
                </>
              }
              css={{ ml: '4px' }}
            />
          </RowFixed>
          <Text size="sm">
            {realizedLPFee
              ? `${realizedLPFee?.toSignificant(6)} ${
                  trade.inputAmount.currency.symbol
                }`
              : '-'}
          </Text>
        </RowBetween>
      </SwapModalFooterContainer>

      <AutoRow>
        <Button
          variant={severity > 2 ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={disabledConfirm}
          css={{
            mt: '12px',
            width: '100%',
          }}
          id="confirm-swap-or-send"
        >
          {severity > 2 ? t('Swap Anyway') : t('Confirm Swap')}
        </Button>

        {swapErrorMessage ? (
          <SwapCallbackError error={swapErrorMessage} />
        ) : null}
      </AutoRow>
    </>
  );
}
