import { Trade } from '@pancakeswap/sdk';
import { SwapIcon } from '@pcs/icons';
import { Box, Button, Flex, Grid, IconButton, Text } from '@pcs/ui';
import { useAtom } from 'jotai';
import type { NextPage } from 'next';
import { useCallback, useState } from 'react';
import {
  BalanceInput,
  CurrencyBalance,
} from '~/components/balance-input';
import {
  $slippage,
  SettingModal,
} from '~/components/settings/settings-modal';
import confirmPriceImpactWithoutFee from '~/components/swap/confirmPriceImpactWithoutFee';
import {
  $inputCurrency,
  $outputCurrency,
  useDerivedSwapInfo,
  useQueryParametersToSwapState,
  useSwapCurrency,
  useUserInputChange,
} from '~/components/swap/hooks/use-swap-info';
import { useSwapCallback } from '~/components/swap/hooks/useSwapCallback';
import TradePrice from '~/components/swap/trade-price';
import { Field } from '~/components/swap/type';
import { INITIAL_ALLOWED_SLIPPAGE } from '~/config/constants';
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

  const { independentField, typedValue } = useSwapCurrency();
  const {
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

  return (
    <Flex
      justify="center"
      css={{
        p: '24px 24px 0px',
        height: '100vh',
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
        <Button onClick={handleSwap}>
          {swapInputError ||
            (priceImpactSeverity > 3 && !isExpertMode
              ? t('Price Impact Too High')
              : priceImpactSeverity > 2
              ? t('Swap Anyway')
              : t('Swap'))}
        </Button>
      </Grid>
    </Flex>
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
