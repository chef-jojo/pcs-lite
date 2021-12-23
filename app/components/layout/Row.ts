import { Flex, styled } from '@pcs/ui';

const Row = styled(
  Flex,
  {},
  {
    defaultVariants: {
      align: 'center',
      justify: 'start',
    },
  },
);

export const RowBetween = styled(
  Row,
  {},
  {
    defaultVariants: {
      justify: 'between',
    },
  },
);

export const RowFlat = styled(
  Row,
  {},
  {
    align: 'end',
  },
);

export const AutoRow = styled(Row, {
  flexWrap: 'wrap',
});

export const RowFixed = styled(Row, {
  width: 'fit-content',
});

export default Row;
