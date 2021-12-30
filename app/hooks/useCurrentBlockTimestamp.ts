import { useMulticallContract } from './use-contract';
import { useActiveWeb3React } from './use-web3';
import { useSWRContract } from './useSWRContract';

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp() {
  const { chainId } = useActiveWeb3React();
  const multicallContract = useMulticallContract();
  return useSWRContract(
    multicallContract && chainId
      ? [multicallContract, 'getCurrentBlockTimestamp']
      : null,
  );
}
