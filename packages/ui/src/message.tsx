import React, { ComponentProps, ReactNode, useContext } from 'react';
import { styled, css } from '../stitches.config';
import {
  ErrorIcon,
  WarningIcon,
  CheckmarkCircleFillIcon,
} from '@pcs/icons';
import { Text } from './text';
import { Box } from './box';

type Variants = ComponentProps<typeof MessageContainer>['variant'];

type MessageProps = {
  variant: Variants;
  icon?: ReactNode;
};

const MessageContext = React.createContext<MessageProps>({
  variant: 'success',
});

const Icons = {
  warning: WarningIcon,
  danger: ErrorIcon,
  success: CheckmarkCircleFillIcon,
} as const;

const MessageContainer = styled('div', {
  display: 'flex',
  backgroundColor: 'gray',
  padding: 16,
  borderRadius: 16,
  border: 'solid 1px',
  textAlign: 'left',

  variants: {
    variant: {
      warning: {
        background: '#FFB23719',
        borderColor: '$warning',
        color: '#D67E0A',
      },
      danger: {
        background: '#ED4B9E19',
        borderColor: '$failure',
        color: '$failure',
      },
      success: {
        background: 'rgba(49, 208, 170, 0.1)',
        borderColor: '$success',
        color: '#129E7D',
      },
    },
  },
});

const StyledMessageText = styled(Text, {
  fontSize: '14px',
  variants: {
    variant: {
      warning: {
        color: '#D67E0A',
      },
      danger: {
        color: '$failure',
      },
      success: {
        color: '#129E7D',
      },
    },
  },
});

export const MessageText: React.FC<ComponentProps<typeof Text>> = ({
  children,
  ...props
}) => {
  const ctx = useContext(MessageContext);
  return (
    <StyledMessageText variant={ctx.variant} {...props}>
      {children}
    </StyledMessageText>
  );
};

export const Message: React.FC<MessageProps> = ({
  children,
  variant,
  icon,
  ...props
}) => {
  const Icon = Icons[variant as keyof typeof Icons];
  return (
    <MessageContext.Provider value={{ variant }}>
      <MessageContainer variant={variant} {...props}>
        <Box css={{ mr: '12px' }}>
          {icon ?? <Icon width="24px" />}
        </Box>
        {children}
      </MessageContainer>
    </MessageContext.Provider>
  );
};
