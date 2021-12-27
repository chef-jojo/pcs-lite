import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { styled } from '../stitches.config';
import { CheckmarkIcon } from '@pcs/icons';
import React, { ComponentProps } from 'react';

const StyledCheckbox = styled(CheckboxPrimitive.Root, {
  all: 'unset',
  cursor: 'pointer',
  position: 'relative',
  display: 'inline-block',
  verticalAlign: 'middle',
  transition: 'background-color 0.2s ease-in-out',
  border: 0,
  borderRadius: 8,
  backgroundColor: '$input',
  boxShadow: '$inset',
  width: '24px',
  height: '24px',
  '&:hover:not(:disabled):not(:checked)': {
    boxShadow: '$focus',
  },
  '&:focus': {
    outline: 'none',
    boxShadow: '$focus',
  },
  '&:disabled': {
    cursor: 'default',
    opacity: 0.6,
  },
  '&:checked, &[data-state=checked]': {
    backgroundColor: '$success',
  },

  variants: {
    size: {
      sm: {
        width: '24px',
        height: '24px',
      },
      md: {
        width: '32px',
        height: '32px',
      },
    },
  },
});

const StyledIndicator = styled(CheckboxPrimitive.Indicator, {
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const Checkbox = (
  props: ComponentProps<typeof StyledCheckbox>,
) => {
  return (
    <StyledCheckbox {...props}>
      <StyledIndicator>
        <CheckmarkIcon />
      </StyledIndicator>
    </StyledCheckbox>
  );
};
