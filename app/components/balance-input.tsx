import { Currency, ETHER } from '@pancakeswap/sdk';
import {
  Button,
  Flex,
  Input as UIInput,
  Modal,
  ModalContent,
  ModalTrigger,
  NumberInput,
  NumberInputProps,
  styled,
  Text,
} from '@pcs/ui';
import { useAtom } from 'jotai';
import { FC, useCallback, useState } from 'react';
import { InputCurrencyAtom } from '~/components/swap/hooks/use-swap-info';
import {
  useCurrency,
  useCurrencyBalance,
} from '~/hooks/use-currency';
import { useActiveWeb3React } from '~/hooks/use-web3';
import { isCurrencyToken } from '~/utils/is-token';
import { CurrencySearch } from './token-list';

const Input = styled(UIInput, {
  appearance: 'none',
  borderWidth: '0',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  margin: '0',
  outline: 'none',
  width: '100%',
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',
  background: 'transparent',
  borderRadius: 0,
  boxShadow: 'none',
  paddingLeft: 0,
  paddingRight: 0,
  textAlign: 'right',
  '&::placeholder': {
    color: '$textSubtle',
  },
  '&:focus': {
    boxShadow: 'none',
  },
});

export const CurrencyBalance: FC<{
  $currencyAddress: InputCurrencyAtom;
  $otherCurrencyAddress: InputCurrencyAtom;
}> = ({ $currencyAddress, $otherCurrencyAddress }) => {
  const [address, setAddress] = useAtom($currencyAddress);
  const [otherAddress] = useAtom($otherCurrencyAddress);
  const currency = useCurrency(address);
  const otherCurrency = useCurrency(otherAddress);
  const { account } = useActiveWeb3React();
  const { data } = useCurrencyBalance(currency);
  const [open, setOpen] = useState(false);

  const onSelect = useCallback(
    (selectedCurrency: Currency) => {
      setAddress(
        isCurrencyToken(selectedCurrency)
          ? selectedCurrency.address
          : selectedCurrency === ETHER
          ? 'BNB'
          : '',
      );
      setOpen(false);
    },
    [setAddress],
  );

  return (
    <Flex align="end" justify="between" css={{ px: '$2' }}>
      {currency && otherCurrency ? (
        <Modal open={open} onOpenChange={setOpen}>
          <ModalTrigger asChild>
            <Button size="xs" variant="text" css={{ color: '$text' }}>
              {currency.symbol}
            </Button>
          </ModalTrigger>
          <ModalContent css={{ width: '100%', maxWidth: '420px' }}>
            <CurrencySearch
              otherCurrency={otherCurrency}
              selectedCurrency={currency}
              onSelect={onSelect}
            />
          </ModalContent>
        </Modal>
      ) : (
        <div>loading...</div>
      )}
      {account && (
        <Text size="xs">
          Balance: {data?.toSignificant(6) ?? 'loading'}
        </Text>
      )}
    </Flex>
  );
};

export const BalanceInput: FC<NumberInputProps> = ({
  children,
  ...props
}) => {
  return (
    <UIInput
      as="div"
      css={{
        p: '8px 16px',
        height: 'auto',
      }}
    >
      <NumberInput asChild {...props}>
        <Input />
      </NumberInput>
      {children}
    </UIInput>
  );
};
