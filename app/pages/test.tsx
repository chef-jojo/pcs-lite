import { Currency } from '@pancakeswap/sdk';
import { useSWRConfig } from 'swr';
import { getTokens } from '~/config/constants/tokens';
import { useCurrencyBalance } from '~/hooks/use-currency';
import { useCakeBusdPrice } from '~/hooks/use-price';

const cake = getTokens().cake;
function Test() {
  const { cache } = useSWRConfig();

  return (
    <>
      {Array.from({ length: 1 }).map((_, i) => (
        <CurrencyBalance key={i} currency={cake} />
      ))}
    </>
  );
}

function CurrencyBalance({ currency }: { currency: Currency }) {
  const { data } = useCurrencyBalance(currency);
  const usd = useCakeBusdPrice();
  return (
    <div>
      {currency.symbol}
      {data?.toSignificant(6)}
      usd {usd?.toSignificant(6)}
    </div>
  );
}

export default Test;
