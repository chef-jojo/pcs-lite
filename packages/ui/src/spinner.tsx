import React from 'react';
import { Box } from './box';
import { PanIcon, SmallPancakeIcon } from '@pcs/icons';
import { styled, keyframes } from '../stitches.config';

export const rotateKfs = keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

export const floatKfs = keyframes({
  '0%': {
    transform: 'translateY(0)',
  },
  '50%': {
    transform: 'translateY(10px)',
  },
  '100%': {
    transform: 'translateY(0)',
  },
});

const Container = styled('div', {
  position: 'relative',
});

const RotatingPancakeIcon = styled(Box, {
  position: 'absolute',
  top: 0,
  left: 0,
  transform: 'translate3d(0, 0, 0)',
  animation: `${rotateKfs} 2s linear infinite`,
});

const FloatingPanIcon = styled(Box, {
  animation: `${floatKfs} 6s ease-in-out infinite`,
  transform: 'translate3d(0, 0, 0)',
});

export const Spinner: React.FC<{ size?: number }> = ({
  size = 128,
}) => {
  return (
    <Container>
      <RotatingPancakeIcon
        as={SmallPancakeIcon}
        css={{
          size: `${size * 0.5}px`,
        }}
      />
      <FloatingPanIcon
        as={PanIcon}
        css={{
          size,
        }}
      />
    </Container>
  );
};
