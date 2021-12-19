import { styled, keyframes, css } from '../stitches.config';

const promotedGradient = keyframes({
  '0%': {
    backgroundPosition: '50% 0%',
  },
  '50%': {
    backgroundPosition: '50% 100%',
  },
  '100%': {
    backgroundPosition: '50% 0%',
  },
});

export const cardStyles = css({
  overflow: 'hidden',
  position: 'relative',
  background: '$backgroundAlt',
  boxShadow: '$level1',
  borderRadius: '$card',
  color: '$text',

  variants: {
    disabled: {
      true: {
        color: '$textDisabled',
      },
    },
    state: {
      active: {
        boxShadow: '$active',
        animation: `${promotedGradient} 3s ease infinite`,
        backgroundSize: '400% 400%',
      },
      success: {
        boxShadow: '$success',
      },
      warning: {
        boxShadow: '$warning',
      },
    },
  },
});

export const Card = styled('div', cardStyles);
