import { Currency, Token } from '@pancakeswap/sdk';

export const isCurrencyToken = (
  currency: Currency,
): currency is Token => currency instanceof Token;
