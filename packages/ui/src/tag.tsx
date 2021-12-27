import { styled } from '../stitches.config';

export const Tag = styled('div', {
  alignItems: 'center',
  borderRadius: 16,
  color: '#ffffff',
  display: 'inline-flex',
  fontWeight: 400,
  whiteSpace: 'nowrap',
  gap: '0.5em',

  variants: {
    uppercase: {
      true: {
        textTransform: 'uppercase',
      },
    },
    color: {
      primary: {
        backgroundColor: '$primary',
        color: '$primary',
      },
      secondary: {
        backgroundColor: '$secondary',
        color: '$secondary',
      },
      success: {
        backgroundColor: '$success',
        color: '$success',
      },
      textDisabled: {
        backgroundColor: '$textDisabled',
        color: '$textDisabled',
      },
      textSubtle: {
        backgroundColor: '$textSubtle',
        color: '$textSubtle',
      },
      binance: {
        backgroundColor: '$binance',
        color: '$binance',
      },
      failure: {
        backgroundColor: '$failure',
        color: '$failure',
      },
      warning: {
        backgroundColor: '$warning',
        color: '$warning',
      },
    },
    outline: {
      true: {
        border: '2px solid',
        backgroundColor: 'transparent',
      },
    },
    size: {
      md: {
        height: '28px',
        padding: '0 8px',
        fontSize: '14px',
      },
      sm: {
        height: '24px',
        padding: '0 4px',
        fontSize: '12px',
      },
    },
  },
  compoundVariants: [
    {
      outline: true,
      color: 'primary',
      css: {
        border: '2px solid $primary',
      },
    },
    {
      outline: true,
      color: 'secondary',
      css: {
        border: '2px solid $secondary',
      },
    },
    {
      outline: true,
      color: 'success',
      css: {
        border: '2px solid $success',
      },
    },
    {
      outline: true,
      color: 'textDisabled',
      css: {
        border: '2px solid $textDisabled',
      },
    },
    {
      outline: true,
      color: 'binance',
      css: {
        border: '2px solid $binance',
      },
    },
    {
      outline: true,
      color: 'failure',
      css: {
        border: '2px solid $failure',
      },
    },
    {
      outline: true,
      color: 'warning',
      css: {
        border: '2px solid $warning',
      },
    },
  ],
});
