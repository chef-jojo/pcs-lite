import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { BscConnector } from '@binance-chain/bsc-connector';
import { REACT_APP_NODE_PRODUCTION } from './env';

export enum SupportedChainId {
  MAINNET = 56,
  TESTNET = 97,
}

export const POLLING_INTERVAL = 12000;

export enum ConnectorNames {
  Injected = 'injected',
  WalletConnect = 'walletconnect',
  BSC = 'bsc',
}

const supportedChainIds = [
  SupportedChainId.MAINNET,
  SupportedChainId.TESTNET,
];

const RPC_URL = {
  [SupportedChainId.MAINNET]: REACT_APP_NODE_PRODUCTION,
  [SupportedChainId.TESTNET]: REACT_APP_NODE_PRODUCTION,
};

export const injected = new InjectedConnector({
  supportedChainIds: supportedChainIds,
});

export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URL,
  qrcode: true,
});

export const bscConnector = new BscConnector({
  supportedChainIds: supportedChainIds,
});

export const connectorsByName: {
  [connectorName in ConnectorNames]: any;
} = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.WalletConnect]: walletconnect,
  [ConnectorNames.BSC]: bscConnector,
};
