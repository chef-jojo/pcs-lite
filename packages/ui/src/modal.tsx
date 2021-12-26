import React, { ComponentProps } from 'react';
import { styled, CSS } from '../stitches.config';
import * as ModalPrimitive from '@radix-ui/react-dialog';
import { CloseIcon, ArrowLeftIcon } from '@pcs/icons';
import { overlayStyles } from './overlay';
import { cardStyles } from './card';
import { IconButton } from './icon-button';
import { Text } from './text';

type DialogProps = React.ComponentProps<
  typeof ModalPrimitive.Root
> & {
  children: React.ReactNode;
};

const StyledOverlay = styled(ModalPrimitive.Overlay, overlayStyles, {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export function Modal({ children, ...props }: DialogProps) {
  return (
    <ModalPrimitive.Root {...props}>
      <StyledOverlay />
      {children}
    </ModalPrimitive.Root>
  );
}

const StyledContent = styled(ModalPrimitive.Content, cardStyles, {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: 200,
  maxHeight: '85vh',
  // padding: '$4',
  marginTop: '-5vh',
  // animation: `${fadeIn} 125ms linear, ${moveDown} 125ms cubic-bezier(0.22, 1, 0.36, 1)`,

  // Among other things, prevents text alignment inconsistencies when dialog can't be centered in the viewport evenly.
  // Affects animated and non-animated dialogs alike.
  willChange: 'transform',

  '&:focus': {
    outline: 'none',
  },
});

const StyledCloseButton = styled(ModalPrimitive.Close, {
  // position: 'absolute',
  // top: '$2',
  // right: '$2',
});

type DialogContentPrimitiveProps = React.ComponentProps<
  typeof ModalPrimitive.Content
>;
type DialogContentProps = DialogContentPrimitiveProps & { css?: CSS };

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof StyledContent>,
  DialogContentProps
>(({ children, ...props }, forwardedRef) => (
  <StyledContent {...props} ref={forwardedRef}>
    {children}
  </StyledContent>
));

const StyledModalHeader = styled('div', {
  alignItems: 'center',
  display: 'flex',
  padding: '12px 24px',
  background: 'transparent',
  borderBottom: '1px solid $cardBorder',
});

export const ModalHeader = React.forwardRef<
  React.ElementRef<typeof StyledModalHeader>,
  ComponentProps<typeof StyledModalHeader> & {
    children: React.ReactNode;
    onBack?: () => void;
  }
>(({ children, onBack, ...props }, forwardedRef) => {
  return (
    <StyledModalHeader ref={forwardedRef} {...props}>
      {onBack && (
        <IconButton variant="text" onClick={onBack}>
          <ArrowLeftIcon />
        </IconButton>
      )}
      <ModalTitle asChild>
        <Text css={{ flex: 1, textAlign: 'left' }} size="h3">
          {children}
        </Text>
      </ModalTitle>
      <StyledCloseButton asChild>
        <IconButton variant="text">
          <CloseIcon />
        </IconButton>
      </StyledCloseButton>
    </StyledModalHeader>
  );
});

export const ModalTrigger = ModalPrimitive.Trigger;
export const ModalClose = ModalPrimitive.Close;
export const ModalTitle = ModalPrimitive.Title;
export const ModalDescription = ModalPrimitive.Description;
export const ModalPortal = ModalPrimitive.Portal;
