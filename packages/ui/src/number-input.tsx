import React from 'react';
import { ComponentProps } from '@stitches/react';
import { Slot } from '@radix-ui/react-slot';
import { Input } from './input';

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export interface NumberInputProps
  extends ComponentProps<typeof Input> {
  prependSymbol?: string;
  onValueChange?: (value: string) => void;
  asChild?: boolean;
}

export function NumberInput({
  prependSymbol,
  value,
  onValueChange,
  asChild,
  ...props
}: NumberInputProps) {
  const enforcer = (nextUserInput: string) => {
    if (
      nextUserInput === '' ||
      inputRegex.test(escapeRegExp(nextUserInput))
    ) {
      onValueChange?.(nextUserInput);
    }
  };

  let Comp = asChild ? Slot : Input;

  return (
    <Comp
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      type="text"
      spellCheck={false}
      placeholder="0.0"
      value={prependSymbol && value ? prependSymbol + value : value}
      onChange={(event) => {
        if (prependSymbol) {
          const value = event.target.value;

          // cut off prepended symbol
          const formattedValue = value
            .toString()
            .includes(prependSymbol)
            ? value.toString().slice(1, value.toString().length + 1)
            : value;

          // replace commas with periods, because uniswap exclusively uses period as the decimal separator
          enforcer(formattedValue.replace(/,/g, '.'));
        } else {
          enforcer(event.target.value.replace(/,/g, '.'));
        }
      }}
      {...props}
    />
  );
}
