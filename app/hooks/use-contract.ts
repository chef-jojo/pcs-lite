import { useMemo } from 'react';
import { Contract } from '@ethersproject/contracts';
import { useActiveWeb3React } from './use-web3';
import {
  JsonRpcSigner,
  Web3Provider,
} from '@ethersproject/providers';
import { getContract } from '~/utils/contract-helper';

import ERC20_ABI from '../config/abi/erc20.json';
import ERC20_BYTES32_ABI from '../config/abi/erc20_bytes32.json';
import ENS_PUBLIC_RESOLVER_ABI from '../config/abi/ens-public-resolver.json';
import ENS_ABI from '../config/abi/ens-registrar.json';
import multiCallAbi from '../config/abi/Multicall.json';
import { getMulticallAddress } from '~/utils/address-helpers';
import { getRpcProvider } from '~/utils/rpc';
import { Erc20, Erc20Bytes32, Multicall } from '~/config/abi/types';

// returns null on errors
function useContract<T extends Contract = Contract>(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
) {
  const { library, chainId, account } = useActiveWeb3React();

  return useMemo(() => {
    // ssr removed library
    if (!address || !ABI) return null;
    try {
      return getContract<T>(
        ABI,
        address,
        withSignerIfPossible && account && library
          ? getProviderOrSigner(library, account)
          : getRpcProvider(chainId),
      );
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account, chainId]);
}

export function useTokenContract(
  tokenAddress?: string,
  withSignerIfPossible?: boolean,
) {
  return useContract<Erc20>(
    tokenAddress,
    ERC20_ABI,
    withSignerIfPossible,
  );
}

export function useBytes32TokenContract(
  tokenAddress?: string,
  withSignerIfPossible?: boolean,
) {
  return useContract<Erc20Bytes32>(
    tokenAddress,
    ERC20_BYTES32_ABI,
    withSignerIfPossible,
  );
}

// account is optional
function getProviderOrSigner(
  library: Web3Provider,
  account?: string,
): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library;
}

function getSigner(
  library: Web3Provider,
  account: string,
): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked();
}

export function useMulticallContract() {
  const { chainId } = useActiveWeb3React();
  return useContract<Multicall>(
    getMulticallAddress(chainId),
    multiCallAbi,
    false,
  );
}
