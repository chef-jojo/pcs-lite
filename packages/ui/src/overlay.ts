import { styled, css } from '../stitches.config';

export const overlayStyles = css({
  backgroundColor: '$text',
  opacity: 0.6,
});

export const Overlay = styled('div', overlayStyles);
