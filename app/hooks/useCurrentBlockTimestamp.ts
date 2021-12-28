import useSWR from 'swr';
import { useMulticallContract } from './use-contract';
import { useActiveWeb3React } from './use-web3';

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp() {
  const { chainId } = useActiveWeb3React();
  const multicallContract = useMulticallContract();
  return useSWR(
    multicallContract && chainId
      ? [chainId, 'getCurrentBlockTimestamp']
      : null,
    async () => {
      return multicallContract!.getCurrentBlockTimestamp();
    },
  );
}
