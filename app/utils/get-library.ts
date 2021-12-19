import { Web3Provider } from '@ethersproject/providers';

const POLLING_INTERVAL = 12000;

export default function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(
    provider,
    typeof provider.chainId === 'number'
      ? provider.chainId
      : typeof provider.chainId === 'string'
      ? parseInt(provider.chainId)
      : 'any',
  );
  library.pollingInterval = POLLING_INTERVAL;
  return library;
}
