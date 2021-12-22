import React from 'react';
import { styled } from '../stitches.config';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Box } from './box';
import { Text } from './text';

type TooltipProps = React.ComponentProps<
  typeof TooltipPrimitive.Root
> &
  React.ComponentProps<typeof TooltipPrimitive.Content> & {
    children: React.ReactElement;
    content: React.ReactNode;
    multiline?: boolean;
  };

const Content = styled(TooltipPrimitive.Content, {
  padding: '$3',
  fontSize: 16,
  lineHeight: '130%',
  borderRadius: '$default',
  maxWidth: 320,
  backgroundColor: '$background',
  boxShadow: '$tooltip',
});

export function Tooltip({
  children,
  content,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      delayDuration={100}
    >
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>

      <Content side="top" align="center" sideOffset={5} {...props}>
        <Text
          as="p"
          css={{
            color: '$inverseText',
          }}
        >
          {content}
        </Text>
        <Box css={{ color: '$inverseBackgroundAlt' }}>
          <TooltipPrimitive.Arrow
            offset={5}
            width={11}
            height={5}
            style={{
              fill: 'currentColor',
            }}
          />
        </Box>
      </Content>
    </TooltipPrimitive.Root>
  );
}
