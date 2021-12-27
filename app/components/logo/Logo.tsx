/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { HelpIcon } from '@pcs/icons';
import { styled, CSS, Box } from '@pcs/ui';

const BAD_SRCS: { [tokenAddress: string]: true } = {};

export interface LogoProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcs: string[];
  css?: CSS;
}

const Img = styled('img');

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
const Logo: React.FC<LogoProps> = ({ srcs, alt, ...rest }) => {
  const [, refresh] = useState<number>(0);

  const src: string | undefined = srcs.find((s) => !BAD_SRCS[s]);

  if (src) {
    return (
      <Img
        {...rest}
        alt={alt}
        src={src}
        onError={() => {
          if (src) BAD_SRCS[src] = true;
          refresh((i) => i + 1);
        }}
      />
    );
  }

  return (
    <Box {...rest}>
      <HelpIcon width={rest.width} height={rest.height} />
    </Box>
  );
};

export default Logo;
