import React from 'react';
import { styled } from '../stitches.config';
import * as AlertModalPrimitive from '@radix-ui/react-alert-dialog';
import { overlayStyles } from './overlay';
import { cardStyles } from './card';

type AlertModalProps = React.ComponentProps<
  typeof AlertModalPrimitive.Root
> & {
  children: React.ReactNode;
};

const StyledOverlay = styled(
  AlertModalPrimitive.Overlay,
  overlayStyles,
  {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
);

export function AlertModal({ children, ...props }: AlertModalProps) {
  return (
    <AlertModalPrimitive.Root {...props}>
      <StyledOverlay />
      {children}
    </AlertModalPrimitive.Root>
  );
}

export const AlertModalContent = styled(
  AlertModalPrimitive.Content,
  cardStyles,
  {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 200,
    maxHeight: '85vh',
    padding: '$4',
    marginTop: '-5vh',

    '&:focus': {
      outline: 'none',
    },
  },
);

export const AlertModalTrigger = AlertModalPrimitive.Trigger;
export const AlertModalTitle = AlertModalPrimitive.Title;
export const AlertModalDescription = AlertModalPrimitive.Description;
export const AlertModalAction = AlertModalPrimitive.Action;
export const AlertModalCancel = AlertModalPrimitive.Cancel;
