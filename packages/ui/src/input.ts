import { styled } from '../stitches.config';

export const Input = styled('input', {
  // Reset
  appearance: 'none',
  borderWidth: '0',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  margin: '0',
  outline: 'none',
  width: '100%',
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',
  '&::before': {
    boxSizing: 'border-box',
  },
  '&::after': {
    boxSizing: 'border-box',
  },

  // Custom
  fontSize: '$4',
  backgroundColor: '$input',
  boxShadow: '$inset',
  color: '$text',
  fontVariantNumeric: 'tabular-nums',
  border: '1px solid $inputSecondary',
  borderRadius: '$default',
  padding: '0 16px',

  '&:focus': {
    boxShadow: '$focus',
  },
  '&::placeholder': {
    color: '$textSubtle',
  },
  '&:disabled': {
    boxShadow: 'none',
    pointerEvents: 'none',
    backgroundColor: '$backgroundDisabled',
    color: '$textDisabled',
    cursor: 'not-allowed',
  },

  variants: {
    size: {
      sm: {
        height: '32px',
      },
      md: {
        height: '40px',
      },
      lg: {
        height: '48px',
      },
    },
    state: {
      success: {
        boxShadow: '$success',
      },
      warning: {
        boxShadow: '$warning',
      },
    },
    cursor: {
      default: {
        cursor: 'default',
        '&:focus': {
          cursor: 'text',
        },
      },
      text: {
        cursor: 'text',
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});
