import { useRouter } from 'next/router';
import { isAddress } from '~/utils/is-address';
import { atom, useAtom } from 'jotai';
import { useUpdateAtom, atomWithDefault } from 'jotai/utils';
import { useEffect } from 'react';
import {
  ChainId,
  Currency,
  CurrencyAmount,
  JSBI,
  Token,
  TokenAmount,
  Trade,
} from '@pancakeswap/sdk';
import { Field } from '../type';
import { $chainId, useActiveWeb3React } from '~/hooks/use-web3';
import {
  useCurrency,
  useCurrencyBalance,
} from '~/hooks/use-currency';
import { parseUnits } from 'ethers/lib/utils';
import { useTradeExactIn, useTradeExactOut } from '~/hooks/use-trade';
import { $slippage } from '~/components/settings/settings-modal';
import { computeSlippageAdjustedAmounts } from '~/utils/price';
import { createConfig } from '~/utils/create-config';

const defaultInputOutputCurrency = createConfig(
  {
    [ChainId.MAINNET]: {
      [Field.INPUT]: 'BNB',
      [Field.OUTPUT]: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    },
    [ChainId.TESTNET]: {
      [Field.INPUT]: 'BNB',
      [Field.OUTPUT]: '0xa35062141Fa33BCA92Ce69FeD37D0E8908868AAe',
    },
  },
  {
    defaultKey: ChainId.MAINNET,
  },
);

function parseCurrencyFromURLParameter(urlParam: any): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam);
    if (valid) return valid;
    if (urlParam.toUpperCase() === 'BNB') return 'BNB';
    if (valid === false) return 'BNB';
  }
  return '';
}

export type InputCurrencyAtom = typeof $inputCurrency;

export const $inputCurrency = atomWithDefault((get) => {
  const chainId = get($chainId);
  return defaultInputOutputCurrency[chainId].INPUT;
});

export const $outputCurrency = atomWithDefault((get) => {
  const chainId = get($chainId);
  return defaultInputOutputCurrency[chainId].OUTPUT;
});

export const $typedValue = atom('');
export const $independentField = atom(Field.INPUT);

export function useUserInputChange(field: Field) {
  const setTypedValue = useUpdateAtom($typedValue);
  const setIndependentField = useUpdateAtom($independentField);

  return (value: string) => {
    setIndependentField(field);
    setTypedValue(value);
  };
}

export function useSwapCurrency() {
  const router = useRouter();
  let [inputCurrency] = useAtom($inputCurrency);
  let [outputCurrency] = useAtom($outputCurrency);
  const [typedValue] = useAtom($typedValue);
  const [independentField] = useAtom($independentField);

  const recipient = validatedRecipient(router.query.recipient);

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency,
    },
    typedValue,
    independentField,
    recipient,
    pairDataById: {},
    derivedPairDataById: {},
  };
}

export function useQueryParametersToSwapState() {
  const router = useRouter();
  const [inputCurrency, setInputCurrency] = useAtom($inputCurrency);
  const [outputCurrency, setOutputCurrency] =
    useAtom($outputCurrency);
  const setTypedValue = useUpdateAtom($typedValue);
  const setIndependentField = useUpdateAtom($independentField);

  useEffect(() => {
    const parsed = parseCurrencyFromURLParameter(
      router.query.inputCurrency,
    );
    if (parsed) {
      setInputCurrency(parsed);
    }
  }, [router.query.inputCurrency, setInputCurrency]);

  useEffect(() => {
    const parsed = parseCurrencyFromURLParameter(
      router.query.outputCurrency,
    );
    if (parsed) {
      setOutputCurrency(parsed);
    }
  }, [router.query.outputCurrency, setOutputCurrency]);

  useEffect(() => {
    const parsed = parseTokenAmountURLParameter(
      router.query.exactAmount,
    );
    if (parsed) {
      setTypedValue(parsed);
    }
  }, [router.query.exactAmount, setTypedValue]);

  useEffect(() => {
    const parsed = parseIndependentFieldURLParameter(
      router.query.exactField,
    );
    if (parsed) {
      setIndependentField(parsed);
    }
  }, [router.query.exactField, setIndependentField]);

  useEffect(() => {
    if (inputCurrency === outputCurrency) {
      if (typeof router.query.outputCurrency === 'string') {
        setInputCurrency('');
      } else {
        setOutputCurrency('');
      }
    }
  }, [
    outputCurrency,
    inputCurrency,
    router.query.outputCurrency,
    setInputCurrency,
    setOutputCurrency,
  ]);
}

const ENS_NAME_REGEX =
  /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null;
  const address = isAddress(recipient);
  if (address) return address;
  if (ENS_NAME_REGEX.test(recipient)) return recipient;
  if (ADDRESS_REGEX.test(recipient)) return recipient;
  return null;
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam))
    ? urlParam
    : '';
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' &&
    urlParam.toLowerCase() === 'output'
    ? Field.OUTPUT
    : Field.INPUT;
}

export function tryParseAmount(
  value?: string,
  currency?: Currency,
): CurrencyAmount | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(
      value,
      currency.decimals,
    ).toString();
    if (typedValueParsed !== '0') {
      return currency instanceof Token
        ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed));
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
}

const t = (s: string, o?: any) => s;

export function useDerivedSwapInfo(): {
  currencies: { [field in Field]?: Currency };
  currencyBalances: { [field in Field]?: CurrencyAmount };
  parsedAmount: CurrencyAmount | undefined;
  v2Trade: Trade | undefined;
  inputError?: string;
} {
  const { account } = useActiveWeb3React();

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    recipient,
  } = useSwapCurrency();

  const inputCurrency = useCurrency(inputCurrencyId);
  const outputCurrency = useCurrency(outputCurrencyId);

  const relevantTokenBalances = [
    useCurrencyBalance(inputCurrency)?.data,
    useCurrencyBalance(outputCurrency)?.data,
  ];

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(
    typedValue,
    (isExactIn ? inputCurrency : outputCurrency) ?? undefined,
  );

  const bestTradeExactIn = useTradeExactIn(
    isExactIn ? parsedAmount : undefined,
    outputCurrency ?? undefined,
  );

  const bestTradeExactOut = useTradeExactOut(
    inputCurrency ?? undefined,
    !isExactIn ? parsedAmount : undefined,
  );

  const v2Trade = isExactIn ? bestTradeExactIn : bestTradeExactOut;

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  };

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  };

  let inputError: string | undefined;
  if (!account) {
    inputError = t('Connect Wallet');
  }

  if (!parsedAmount) {
    inputError = inputError ?? t('Enter an amount');
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t('Select a token');
  }

  // const formattedTo = isAddress(to);
  // if (!to || !formattedTo) {
  //   inputError = inputError ?? t('Enter a recipient');
  // } else if (
  //   BAD_RECIPIENT_ADDRESSES.indexOf(formattedTo) !== -1 ||
  //   (bestTradeExactIn &&
  //     involvesAddress(bestTradeExactIn, formattedTo)) ||
  //   (bestTradeExactOut &&
  //     involvesAddress(bestTradeExactOut, formattedTo))
  // ) {
  //   inputError = inputError ?? t('Invalid recipient');
  // }

  const [slippage] = useAtom($slippage);

  const slippageAdjustedAmounts =
    v2Trade &&
    slippage &&
    computeSlippageAdjustedAmounts(v2Trade, slippage * 100);

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    null,
    slippageAdjustedAmounts
      ? slippageAdjustedAmounts[Field.INPUT]
      : null,
  ];

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = t('Insufficient %symbol% balance', {
      symbol: amountIn.currency.symbol,
    });
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    v2Trade: v2Trade ?? undefined,
    inputError,
  };
}
