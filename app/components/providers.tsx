import { Web3ReactProvider } from '@web3-react/core';
import { FC } from 'react';
import { useEagerConnect, useInactiveListener } from '~/hooks/use-web3';
import getLibrary from '~/utils/get-library';

export const Providers: FC = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Connect />
      {children}
    </Web3ReactProvider>
  );
};

function Connect() {
  useEagerConnect();
  useInactiveListener();
  return null;
}
