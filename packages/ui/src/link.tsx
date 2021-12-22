import { ComponentProps } from 'react';
import { styled } from '../stitches.config';
import { textCss } from './text';

export const Link = styled('a', textCss);

export const ExternalLink = (props: ComponentProps<typeof Link>) => {
  const externalProps = {
    target: '_blank',
    rel: 'noreferrer noopener',
  };
  return <Link {...externalProps} {...props} />;
};
