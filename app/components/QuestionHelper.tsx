import React, { ComponentProps } from 'react';
import { Box, styled, Tooltip } from '@pcs/ui';
import { HelpIcon } from '@pcs/icons';

interface Props extends ComponentProps<typeof Box> {
  text: string | React.ReactNode;
  // placement?: Placement;
  size?: string;
}

const QuestionWrapper = styled('div', {
  '&:hover, &:focus': {
    opacity: 0.7,
  },
});

const QuestionHelper: React.FC<Props> = ({
  text,
  size = '16px',
  ...props
}) => {
  return (
    <Box {...props}>
      <Tooltip content={text} >
        <QuestionWrapper>
          <HelpIcon color="textSubtle" width={size} />
        </QuestionWrapper>
      </Tooltip>
    </Box>
  );
};

export default QuestionHelper;
