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

// returns null on errors
function useContract(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
): Contract | null {
  const { library, chainId, account } = useActiveWeb3React();

  return useMemo(() => {
    if (!address || !ABI || !library) return null;
    try {
      return getContract(
        ABI,
        address,
        withSignerIfPossible && account
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
): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible);
}

export function useBytes32TokenContract(
  tokenAddress?: string,
  withSignerIfPossible?: boolean,
): Contract | null {
  return useContract(
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

export function useMulticallContract(): Contract | null {
  const { chainId } = useActiveWeb3React();
  return useContract(
    getMulticallAddress(chainId),
    multiCallAbi,
    false,
  );
}
