import { Currency, ETHER, Token } from '@pancakeswap/sdk';
import {
  Button,
  Flex,
  Input as UIInput,
  Modal,
  ModalContent,
  ModalTrigger,
  ModalPortal,
  NumberInput,
  NumberInputProps,
  styled,
  Text,
} from '@pcs/ui';
import { useAtom } from 'jotai';
import { FC, useState } from 'react';
import { InputCurrencyAtom } from '~/components/swap/hooks/use-swap-info';
import {
  useCurrency,
  useCurrencyBalance,
} from '~/hooks/use-currency';
import { CurrencyList, CurrencySearch } from './token-list';

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

const isCurrencyToken = (currency: Currency): currency is Token =>
  currency instanceof Token;

function useModal() {
  const [open, setOpen] = useState(false);
  return {
    open,
    onOpenChange: setOpen,
  };
}

export const CurrencyBalance: FC<{
  $currencyAddress: InputCurrencyAtom;
  $otherCurrencyAddress: InputCurrencyAtom;
}> = ({ $currencyAddress, $otherCurrencyAddress }) => {
  const [address, setAddress] = useAtom($currencyAddress);
  const [orderAddress] = useAtom($otherCurrencyAddress);
  const currency = useCurrency(address);
  const otherCurrency = useCurrency(orderAddress);
  const { data, isValidating, error } = useCurrencyBalance(currency);
  const modal = useModal();

  return (
    <Flex align="end" justify="between" css={{ px: '$2' }}>
      {currency && otherCurrency ? (
        <Modal {...modal}>
          <ModalTrigger asChild>
            <Button size="xs" variant="text" css={{ color: '$text' }}>
              {currency.symbol}
            </Button>
          </ModalTrigger>
          <ModalContent>
            <CurrencySearch
              otherCurrency={otherCurrency}
              selectedCurrency={currency}
              onSelect={(selectedCurrency) => {
                setAddress(
                  isCurrencyToken(selectedCurrency)
                    ? selectedCurrency.address
                    : currency === ETHER
                    ? 'BNB'
                    : '',
                );
                modal.onOpenChange(false);
              }}
            />
          </ModalContent>
        </Modal>
      ) : (
        <div>loading...</div>
      )}
      <Text size="xs">
        Balance: {data?.toSignificant(6) ?? 'loading'}
      </Text>
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
