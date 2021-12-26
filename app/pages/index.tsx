import { Trade } from '@pancakeswap/sdk';
import { SwapIcon } from '@pcs/icons';
import { Box, Button, Flex, Grid, IconButton, Text } from '@pcs/ui';
import { useAtom } from 'jotai';
import type { NextPage } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import {
  BalanceInput,
  CurrencyBalance,
} from '~/components/balance-input';
import { CircleLoader } from '~/components/loader/CircleLoader';
import { Menu } from '~/components/menu';
import {
  $slippage,
  SettingModal,
} from '~/components/settings/settings-modal';
import confirmPriceImpactWithoutFee from '~/components/swap/confirmPriceImpactWithoutFee';
import ConfirmSwapModal from '~/components/swap/ConfirmSwapModal';
import {
  $inputCurrency,
  $outputCurrency,
  useDerivedSwapInfo,
  useQueryParametersToSwapState,
  useSwapCurrency,
  useUserInputChange,
} from '~/components/swap/hooks/use-swap-info';
import { useApproveCallbackFromTrade } from '~/components/swap/hooks/useApproveCallbackFromTrade';
import { useSwapCallback } from '~/components/swap/hooks/useSwapCallback';
import TradePrice from '~/components/swap/trade-price';
import { Field } from '~/components/swap/type';
import { useAllTokenBalances } from '~/components/token-list';
import { INITIAL_ALLOWED_SLIPPAGE } from '~/config/constants';
import { ApprovalState } from '~/hooks/useApproveCallback';
import { useTranslation } from '~/hooks/useTranslation';
import { $userIsExpertMode } from '~/state/user';
import {
  computeTradePriceBreakdown,
  warningSeverity,
} from '~/utils/price';

const Home: NextPage = () => {
  useQueryParametersToSwapState();
  const [inputCurrency, setInputCurrency] = useAtom($inputCurrency);
  const [outputCurrency, setOutputCurrency] =
    useAtom($outputCurrency);

  const { independentField, typedValue, recipient } =
    useSwapCurrency();
  const {
    currencies,
    parsedAmount,
    v2Trade: trade,
    inputError: swapInputError,
  } = useDerivedSwapInfo();

  const onInputChange = useUserInputChange(Field.INPUT);
  const onOutputChange = useUserInputChange(Field.OUTPUT);

  let showWrap = false; // TODO: wrap

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]:
          independentField === Field.INPUT
            ? parsedAmount
            : trade?.inputAmount,
        [Field.OUTPUT]:
          independentField === Field.OUTPUT
            ? parsedAmount
            : trade?.outputAmount,
      };

  const [showInverted, setShowInverted] = useState(false);
  const [allowedSlippage] = useAtom($slippage);
  const [isExpertMode] = useAtom($userIsExpertMode);

  const { t } = useTranslation();

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade);
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);

  const { callback: swapCallback, error: swapCallbackError } =
    useSwapCallback(trade, allowedSlippage);

  const dependentField: Field =
    independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  // modal and loading
  const [
    { tradeToConfirm, swapErrorMessage, attemptingTxn, txHash },
    setSwapState,
  ] = useState<{
    tradeToConfirm: Trade | undefined;
    attemptingTxn: boolean;
    swapErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  });

  const handleSwap = useCallback(() => {
    if (
      priceImpactWithoutFee &&
      !confirmPriceImpactWithoutFee(priceImpactWithoutFee, t)
    ) {
      return;
    }
    if (!swapCallback) {
      return;
    }
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    });
    swapCallback()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          swapErrorMessage: undefined,
          txHash: hash,
        });
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        });
      });
  }, [priceImpactWithoutFee, swapCallback, tradeToConfirm, t]);

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(
    trade,
    allowedSlippage,
  );

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] =
    useState<boolean>(false);

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true);
    }
  }, [approval, approvalSubmitted]);

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade,
      swapErrorMessage,
      txHash,
      attemptingTxn,
    });
  }, [attemptingTxn, swapErrorMessage, trade, txHash]);

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    });
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onInputChange('');
    }
  }, [
    attemptingTxn,
    onInputChange,
    swapErrorMessage,
    tradeToConfirm,
    txHash,
  ]);

  const { cache, mutate, ...extraConfig } = useSWRConfig();

  // useSWRBatch([]);

  return (
    <Box
      css={{
        height: '100vh',
      }}
    >
      <Menu />
      <Flex
        justify="center"
        css={{
          height: '100%',
          p: '24px 24px 0px',
          background: '$bubblegum',
        }}
      >
        <Grid
          gap="3"
          css={{
            p: '24px',
            bc: 'white',
            width: '328px',
            border: '1px solid $cardBorder',
            textAlign: 'center',
            borderRadius: '$card',
            height: 'fit-content',
          }}
        >
          <Flex align="center" justify="between">
            <div> </div>
            <Text size="h4" bold>
              Swap
            </Text>
            <SettingModal />
          </Flex>
          <Text size="sm">Trade tokens in an instant</Text>
          <Box
            css={{
              height: '1px',
              width: '100%',
              bc: '$cardBorder',
            }}
          />
          <Grid gap="2">
            <CurrencyBalance
              $currencyAddress={$inputCurrency}
              $otherCurrencyAddress={$outputCurrency}
            />
            <BalanceInput
              value={formattedAmounts[Field.INPUT]}
              onValueChange={onInputChange}
            />
          </Grid>
          <IconButton
            css={{ mx: 'auto' }}
            onClick={() => {
              setInputCurrency(outputCurrency);
              setOutputCurrency(inputCurrency);
            }}
          >
            <SwapIcon />
          </IconButton>
          <Grid gap="2">
            <CurrencyBalance
              $currencyAddress={$outputCurrency}
              $otherCurrencyAddress={$inputCurrency}
            />
            <BalanceInput
              value={formattedAmounts[Field.OUTPUT]}
              onValueChange={onOutputChange}
            />
          </Grid>
          <Grid gap="2" css={{ px: '$3' }}>
            {Boolean(trade) && (
              <Flex align="center" justify="between">
                <Text size="xs" bold css={{ color: '$secondary' }}>
                  Price
                </Text>
                <TradePrice
                  price={trade?.executionPrice}
                  showInverted={showInverted}
                  setShowInverted={setShowInverted}
                />
              </Flex>
            )}
            {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
              <Flex align="center" justify="between">
                <Text size="xs" bold css={{ color: '$secondary' }}>
                  Slippage Tolerance
                </Text>
                <Text bold color="primary">
                  {allowedSlippage / 100}%
                </Text>
              </Flex>
            )}
          </Grid>
          {showApproveFlow ? (
            <Flex>
              <Button
                variant={
                  approval === ApprovalState.APPROVED
                    ? 'success'
                    : 'primary'
                }
                onClick={approveCallback}
                disabled={
                  approval !== ApprovalState.NOT_APPROVED ||
                  approvalSubmitted
                }
                css={{
                  width: '48%',
                }}
              >
                {approval === ApprovalState.PENDING ? (
                  <Flex gap="2" justify="center">
                    {t('Enabling')} <CircleLoader color="white" />
                  </Flex>
                ) : approvalSubmitted &&
                  approval === ApprovalState.APPROVED ? (
                  t('Enabled')
                ) : (
                  t('Enable %asset%', {
                    asset: currencies[Field.INPUT]?.symbol ?? '',
                  })
                )}
              </Button>
              <Button
                variant={
                  swapInputError && priceImpactSeverity > 2
                    ? 'danger'
                    : 'primary'
                }
                onClick={() => {
                  if (isExpertMode) {
                    handleSwap();
                  } else {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapErrorMessage: undefined,
                      txHash: undefined,
                    });
                    setShowConfirmModal(true);
                  }
                }}
                css={{
                  width: '48%',
                }}
                id="swap-button"
                disabled={Boolean(
                  swapInputError ||
                    approval !== ApprovalState.APPROVED ||
                    (priceImpactSeverity > 3 && !isExpertMode),
                )}
              >
                {priceImpactSeverity > 3 && !isExpertMode
                  ? t('Price Impact High')
                  : priceImpactSeverity > 2
                  ? t('Swap Anyway')
                  : t('Swap')}
              </Button>
            </Flex>
          ) : (
            <Button
              onClick={() => {
                if (isExpertMode) {
                  handleSwap();
                } else {
                  setSwapState({
                    tradeToConfirm: trade,
                    attemptingTxn: false,
                    swapErrorMessage: undefined,
                    txHash: undefined,
                  });
                  setShowConfirmModal(true);
                }
              }}
              disabled={Boolean(
                swapInputError ||
                  (priceImpactSeverity > 3 && !isExpertMode) ||
                  !!swapCallbackError,
              )}
            >
              {swapInputError ||
                (priceImpactSeverity > 3 && !isExpertMode
                  ? t('Price Impact Too High')
                  : priceImpactSeverity > 2
                  ? t('Swap Anyway')
                  : t('Swap'))}
            </Button>
          )}
        </Grid>
        <ConfirmSwapModal
          trade={trade}
          originalTrade={tradeToConfirm}
          onAcceptChanges={handleAcceptChanges}
          attemptingTxn={attemptingTxn}
          txHash={txHash}
          recipient={recipient}
          allowedSlippage={allowedSlippage}
          onConfirm={handleSwap}
          swapErrorMessage={swapErrorMessage}
          customOnDismiss={handleConfirmDismiss}
          open={showConfirmModal}
          onOpenChange={setShowConfirmModal}
        />
      </Flex>
    </Box>
  );
};

// const getTokenList = async () => {
//   let listByUrl: Record<string, TokenList> = {};
//   for (const url in LIST_BY_URL) {
//     const result = await fetch(url);
//     const json = (await result.json()) as TokenList;
//     listByUrl[url] = json;
//   }
//   return listByUrl;
// };

// export const getStaticProps: GetStaticProps = async () => {
//   const tokenList = await getTokenList();
//   return {
//     revalidate: 20,
//     props: {
//       tokenList,
//     },
//   };
// };

export default Home;
