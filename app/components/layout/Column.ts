import { Flex, Grid, styled } from '@pcs/ui';

export const Column = styled(Flex, {
  flexDirection: 'column',
  justifyContent: 'flex-start',
});

export const ColumnCenter = styled(Column, {
  width: '100%',
  alignItems: 'center',
});

export const AutoColumn = styled(Grid, {
  gridAutoRows: 'auto',
});
