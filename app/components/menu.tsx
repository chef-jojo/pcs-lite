import { Flex, Text, Box, Button } from '@pcs/ui';
import { useActiveWeb3React } from '~/hooks/use-web3';
import useAuth from '~/hooks/useAuth';
import ConnectWalletButton from './ConnectWalletButton';

export function Menu() {
  const { account, chainId } = useActiveWeb3React();
  const { logout } = useAuth();
  return (
    <Flex justify="between" align="center">
      <Text>ChainId: {chainId}</Text>
      {account ? (
        <Flex align="center">
          <Text>{account}</Text>
          <Button onClick={logout}>Logout</Button>
        </Flex>
      ) : (
        <ConnectWalletButton />
      )}
    </Flex>
  );
}
