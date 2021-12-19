import { styled } from '../stitches.config';

export const Text = styled('span', {
  // Reset
  lineHeight: '1',
  margin: '0',
  fontWeight: 400,
  fontVariantNumeric: 'tabular-nums',
  display: 'block',
  color: '$text',

  variants: {
    size: {
      xs: {
        fontSize: '$1',
        lineHeight: '120%',
      },
      sm: {
        fontSize: '$2',
        lineHeight: '120%',
      },
      body: {
        fontSize: '$3',
        lineHeight: '120%',
      },
      h4: {
        fontSize: '$4',
        lineHeight: '120%',
      },
      h3: {
        fontSize: '$5',
        lineHeight: '110%',
      },
      h2m: {
        fontSize: '$6',
        lineHeight: '110%',
      },
      h2: {
        fontSize: '$7',
        lineHeight: '110%',
      },
      h1: {
        fontSize: '$8',
        lineHeight: '110%',
      },
    },
    bold: {
      true: {
        fontWeight: 600,
      },
    },
  },
  defaultVariants: {
    size: '3',
  },
} as const);
