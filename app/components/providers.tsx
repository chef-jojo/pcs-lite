import { Web3ReactProvider } from '@web3-react/core';
import { FC } from 'react';
import { SWRConfig } from 'swr';
import {
  useEagerConnect,
  useInactiveListener,
} from '~/hooks/use-web3';
import {
  loggerMiddleware,
  unstable_useSWRContractBatchUpdater,
} from '~/hooks/useSWRContract';
import getLibrary from '~/utils/get-library';

export const Providers: FC = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <SWRConfig
        value={{
          use:
            process.env.NODE_ENV === 'development'
              ? [loggerMiddleware]
              : [],
        }}
      >
        <Connect />
        {children}
      </SWRConfig>
    </Web3ReactProvider>
  );
};

function Connect() {
  useEagerConnect();
  useInactiveListener();
  unstable_useSWRContractBatchUpdater();
  return null;
}
