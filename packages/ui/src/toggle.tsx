import * as Switch from '@radix-ui/react-switch';
import React, { ComponentProps } from 'react';
import { InputHTMLAttributes, ReactNode } from 'react';
import { styled } from '../stitches.config';

const StyledThumb = styled(Switch.Thumb, {
  display: 'block',
  width: 21,
  height: 21,
  backgroundColor: '$backgroundAlt',
  borderRadius: '9999px',
  transition: 'transform 200ms ease-in',
  transform: 'translateX(2px)',
  willChange: 'transform',
});

const StyledSwitch = styled(
  Switch.Root,
  {
    all: 'unset',
    borderRadius: '9999px',
    position: 'relative',
    boxShadow: '$inset',
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    [`&:focus ${StyledThumb}`]: {
      boxShadow: '$focus',
    },
    [`&:hover ${StyledThumb}:not(:disabled):not(:checked)`]: {
      boxShadow: '$focus',
    },

    variants: {
      scale: {
        sm: {
          width: '32px',
          height: '20px',
          [`& ${StyledThumb}`]: {
            width: '16px',
            height: '16px',
            '&[data-state="checked"]': {
              transform: 'translateX(18px)',
            },
          },
        },
        md: {
          width: '56px',
          height: '32px',
          [`& ${StyledThumb}`]: {
            width: '26px',
            height: '26px',
            '&[data-state="checked"]': {
              transform: 'translateX(30px)',
            },
          },
        },
        lg: {
          width: '72px',
          height: '40px',
          [`& ${StyledThumb}`]: {
            width: '32px',
            height: '32px',
            '&[data-state="checked"]': {
              transform: 'translateX(36px)',
            },
          },
        },
      },
      variant: {
        default: {
          backgroundColor: '$input',
          '&[data-state="checked"]': { backgroundColor: '$success' },
        },
        icon: {
          backgroundColor: '$textDisabled',
          '&[data-state="checked"]': {
            backgroundColor: '$textDisabled',
          },
        },
      },
    },
  },
  {
    defaultVariants: {
      variant: 'default',
      scale: 'lg',
    },
  },
);

export interface ToggleProp
  extends ComponentProps<typeof StyledSwitch> {}

export function Toggle(props: ToggleProp) {
  return (
    <StyledSwitch {...props}>
      <StyledThumb />
    </StyledSwitch>
  );
}
