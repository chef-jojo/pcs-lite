import { Percent } from '@pancakeswap/sdk';
import { SettingIcon } from '@pcs/icons';
import {
  Button,
  Flex,
  Grid,
  IconButton,
  Modal,
  ModalContent,
  ModalTrigger,
  Text,
} from '@pcs/ui';
import { atom, useAtom } from 'jotai';
import { INITIAL_ALLOWED_SLIPPAGE } from '~/config/constants';

const slippages = [0.1, 0.5, 1.0];
const isValid = (slippage: number) =>
  slippage >= 0 && slippage <= 5000;

const DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE = new Percent('50', '10000');
export const $slippage = atom(INITIAL_ALLOWED_SLIPPAGE);

export function SettingModal() {
  const [currentSlippage, setCurrentSlippage] = useAtom($slippage);
  return (
    <Modal>
      <ModalTrigger asChild>
        <IconButton aria-label="Setting">
          <SettingIcon />
        </IconButton>
      </ModalTrigger>
      <ModalContent>
        <Grid gap="4">
          <Text>Slippage Tolerance</Text>
          <Flex gap="2">
            {slippages.map((slippage) => {
              return (
                <Button
                  size="sm"
                  key={slippage}
                  onClick={() => setCurrentSlippage(slippage * 100)}
                  variant={
                    currentSlippage === slippage * 100
                      ? 'primary'
                      : 'tertiary'
                  }
                >
                  {slippage}%
                </Button>
              );
            })}
            <Flex align="center">
              {/* <NumberInput
                css={{ width: '80px' }}
                onValueChange={(v) => {
                  console.log(v);
                }}
              />{' '}
              <Text css={{ color: '$primary', pl: '$2' }}>%</Text> */}
            </Flex>
          </Flex>
        </Grid>
      </ModalContent>
    </Modal>
  );
}
