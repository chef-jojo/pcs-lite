import { ComponentProps, useState } from 'react';
import {
  Button,
  Text,
  Box,
  styled,
  Grid,
  Modal,
  ModalClose,
  ModalTitle,
  ModalContent,
  ModalTrigger,
} from '@pcs/ui';
import useAuth from '~/hooks/useAuth';
import { useTranslation } from '~/hooks/useTranslation';
import { MetamaskIcon } from '@pcs/icons';
import { ConnectorNames } from '~/config/connectors';

// import WalletCard, { MoreWalletCard } from './WalletCard';
// import config, { walletLocalStorageKey } from './config';
// import { Config, Login } from './types';

// interface Props {
//   login: Login;
//   onDismiss?: () => void;
//   displayCount?: number;
//   t: (key: string) => string;
// }

const WalletWrapper = styled(Box, {
  borderBottom: '1px solid $cardBorder',
});

const WalletCard: React.FC = ({ login, walletConfig, onDismiss }) => {
  const { title, icon: Icon } = walletConfig;

  return (
    <Button
      variant="tertiary"
      onClick={() => {
        // const isIOS =
        //   /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        //   !window.MSStream;

        // Since iOS does not support Trust Wallet we fall back to WalletConnect
        // if (walletConfig.title === 'Trust Wallet' && isIOS) {
        //   login(ConnectorNames.WalletConnect);
        // } else {
        // }
        login(walletConfig.connectorId);
        onDismiss();
      }}
      id={`wallet-connect-${title.toLocaleLowerCase()}`}
    >
      <Icon width="40px" mb="8px" />
      <Text>{title}</Text>
    </Button>
  );
};

const config = [
  {
    title: 'Metamask',
    icon: MetamaskIcon,
    connectorId: ConnectorNames.Injected,
    priority: 1,
  },
];

const ConnectModal: React.FC = ({
  login,
  onDismiss = () => null,
  displayCount = 3,
  t,
}) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <ModalContent>
      {/* <ModalHeader
        background={getThemeValue('colors.gradients.bubblegum')(
          theme,
        )}
      > */}
      {/* <ModalTitle>
          <Heading>{t('Connect Wallet')}</Heading>
        </ModalTitle>
        <ModalCloseButton onDismiss={onDismiss} />
      </ModalHeader> */}
      {/* <ModalBody width={['320px', null, '340px']}> */}
      <WalletWrapper>
        <Grid
          css={{
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          {config.map((wallet) => (
            <Box key={wallet.title}>
              <WalletCard
                walletConfig={wallet}
                login={login}
                onDismiss={onDismiss}
              />
            </Box>
          ))}
          {/* {!showMore && (
            <MoreWalletCard t={t} onClick={() => setShowMore(true)} />
          )} */}
        </Grid>
      </WalletWrapper>
      <Box>
        <Text>{t('Haven’t got a crypto wallet yet?')}</Text>
        <Button
          as="a"
          href="https://docs.pancakeswap.finance/get-started/connection-guide"
          variant="subtle"
        >
          {t('Learn How to Connect')}
        </Button>
      </Box>
      {/* </ModalBody> */}
    </ModalContent>
  );
};

const ConnectWalletButton = (
  props: ComponentProps<typeof Button>,
) => {
  const { t } = useTranslation();
  const { login, logout } = useAuth();
  // const { onPresentConnectModal } = useWalletModal(login, logout, t);
  const [show, setShow] = useState(false);

  return (
    <Modal open={show} onOpenChange={setShow}>
      <ModalTrigger asChild>
        <Button {...props}>{t('Connect Wallet')}</Button>
      </ModalTrigger>
      <ConnectModal login={login} t={t} />
    </Modal>
  );
};

export default ConnectWalletButton;
