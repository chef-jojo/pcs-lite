import { styled } from '../stitches.config';
import { Button } from './button';
export const IconButton = styled(
  Button,
  {
    padding: 0,
    width: 'fit-content',
  },
  {
    variants: {
      size: {
        xs: {
          height: '20px',
          width: '20px',
          px: 0,
          fontSize: '$1',
        },
        sm: {
          height: '32px',
          size: '32px',
          px: 0,
          fontSize: '$2',
        },
        md: {
          size: '48px',
          px: 0,
          fontSize: '$3',
        },
      },
      variant: {
        light: {
          backgroundColor: '$input',
          color: '$textSubtle',
          boxShadow: 'none',
        },
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'light',
    },
  },
);
