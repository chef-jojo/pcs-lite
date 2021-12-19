import { BigNumber } from 'ethers';
import useSWR from 'swr';
import { multicall } from '~/utils/multicall';
import { useMulticallContract } from './use-contract';
import { useActiveWeb3React } from './use-web3';

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp() {
  const { chainId } = useActiveWeb3React();
  const multicallContract = useMulticallContract();
  return useSWR(
    multicallContract && chainId
      ? [chainId, multicallContract, 'getCurrentBlockTimestamp']
      : null,
    async () => {
      return multicallContract!.getCurrentBlockTimestamp();
    },
  );
}
