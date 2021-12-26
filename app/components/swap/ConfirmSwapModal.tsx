import { currencyEquals, Trade } from '@pancakeswap/sdk';
import React, { ComponentProps, useMemo } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal';
import SwapModalFooter from './SwapModalFooter';
import SwapModalHeader from './SwapModalHeader';

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */
function tradeMeaningfullyDiffers(
  tradeA: Trade,
  tradeB: Trade,
): boolean {
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(
      tradeA.inputAmount.currency,
      tradeB.inputAmount.currency,
    ) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !currencyEquals(
      tradeA.outputAmount.currency,
      tradeB.outputAmount.currency,
    ) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  );
}
interface ConfirmSwapModalProps {
  trade?: Trade;
  originalTrade?: Trade;
  attemptingTxn: boolean;
  txHash?: string;
  recipient: string | null;
  allowedSlippage: number;
  onAcceptChanges: () => void;
  onConfirm: () => void;
  swapErrorMessage?: string;
  customOnDismiss?: () => void;
}

const ConfirmSwapModal: React.FC<any> = ({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  customOnDismiss,
  recipient,
  swapErrorMessage,
  attemptingTxn,
  txHash,
  ...props
}) => {
  const showAcceptChanges = useMemo(
    () =>
      Boolean(
        trade &&
          originalTrade &&
          tradeMeaningfullyDiffers(trade, originalTrade),
      ),
    [originalTrade, trade],
  );

  const { t } = useTranslation();

  // text to show while loading
  const pendingText = t(
    'Swapping %amountA% %symbolA% for %amountB% %symbolB%',
    {
      amountA: trade?.inputAmount?.toSignificant(6) ?? '',
      symbolA: trade?.inputAmount?.currency?.symbol ?? '',
      amountB: trade?.outputAmount?.toSignificant(6) ?? '',
      symbolB: trade?.outputAmount?.currency?.symbol ?? '',
    },
  );

  return (
    <TransactionConfirmationModal
      {...props}
      title={t('Confirm Swap')}
      customOnDismiss={customOnDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      pendingText={pendingText}
      currencyToAdd={trade?.outputAmount.currency}
    >
      {swapErrorMessage ? (
        <TransactionErrorContent
          onDismiss={() => props.onOpenChange?.(false)}
          message={swapErrorMessage}
        />
      ) : (
        <ConfirmationModalContent
          topContent={
            trade && (
              <SwapModalHeader
                trade={trade}
                allowedSlippage={allowedSlippage}
                recipient={recipient}
                showAcceptChanges={showAcceptChanges}
                onAcceptChanges={onAcceptChanges}
              />
            )
          }
          bottomContent={
            trade && (
              <SwapModalFooter
                onConfirm={onConfirm}
                trade={trade}
                disabledConfirm={showAcceptChanges}
                swapErrorMessage={swapErrorMessage}
                allowedSlippage={allowedSlippage}
              />
            )
          }
        />
      )}
    </TransactionConfirmationModal>
  );
};

export default ConfirmSwapModal;
