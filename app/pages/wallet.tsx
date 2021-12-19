import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useEffect, useState } from 'react';
import { connectorsByName } from '~/config/connectors';
import { useEagerConnect, useInactiveListener } from '~/hooks/use-web3';

export default function Wallet() {
  const web3 = useWeb3React<Web3Provider>();

  const { connector, error, activate, active, account } = web3;

  const triedEager = useEagerConnect();
  const [activatingConnector, setActivatingConnector] =
    useState<any>();

  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  useInactiveListener(!triedEager || !!activatingConnector);

  return (
    <div>
      <h1>Wallet</h1>
      {Object.keys(connectorsByName).map((name) => {
        const currentConnector =
          connectorsByName[name as keyof typeof connectorsByName];
        const activating = currentConnector === activatingConnector;
        const connected = currentConnector === connector;
        const disabled =
          !triedEager ||
          !!activatingConnector ||
          connected ||
          !!error;

        console.log({
          triedEager,
          activatingConnector,
          connected,
          error,
        });

        return (
          <button
            style={{
              height: '3rem',
              borderRadius: '1rem',
              borderColor: activating
                ? 'orange'
                : connected
                ? 'green'
                : 'unset',
              cursor: disabled ? 'unset' : 'pointer',
              position: 'relative',
            }}
            disabled={disabled}
            key={name}
            onClick={() => {
              setActivatingConnector(currentConnector);
              activate(
                connectorsByName[
                  name as keyof typeof connectorsByName
                ],
              );
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                color: 'black',
                margin: '0 0 0 1rem',
              }}
            >
              {activating && <div>activating</div>}
              {connected && (
                <span role="img" aria-label="check">
                  ✅
                </span>
              )}
            </div>
            {name}
          </button>
        );
      })}
    </div>
  );
}
