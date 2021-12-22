import { TransactionResponse } from '@ethersproject/providers';
import { ChainId } from '@pancakeswap/sdk';
import { atom, useAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { useCallback, useMemo } from 'react';
import { useActiveWeb3React } from '~/hooks/use-web3';

type TransactionSummary = {
  summary?: string;
  claim?: { recipient: string };
  approval?: { tokenAddress: string; spender: string };
};

interface TransactionDetails {
  hash: string;
  approval?: { tokenAddress: string; spender: string };
  summary?: string;
  claim?: { recipient: string };
  receipt?: SerializableTransactionReceipt;
  lastCheckedBlockNumber?: number;
  addedTime: number;
  confirmedTime?: number;
  from: string;
}

export interface SerializableTransactionReceipt {
  to: string;
  from: string;
  contractAddress: string;
  transactionIndex: number;
  blockHash: string;
  transactionHash: string;
  blockNumber: number;
  status?: number;
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000;
}

const $transactionHistory = atomFamily((chainId: ChainId) =>
  atom<{
    [txHash: string]: TransactionDetails;
  }>({}),
);

export function useHasPendingApproval(
  tokenAddress: string | undefined,
  spender: string | undefined,
): boolean {
  const { chainId } = useActiveWeb3React();
  const [allTransactions] = useAtom(
    $transactionHistory(chainId as ChainId),
  );
  return useMemo(
    () =>
      typeof tokenAddress === 'string' &&
      typeof spender === 'string' &&
      Object.keys(allTransactions).some((hash) => {
        const tx = allTransactions[hash];
        if (!tx) return false;
        if (tx.receipt) {
          return false;
        }
        const { approval } = tx;
        if (!approval) return false;
        return (
          approval.spender === spender &&
          approval.tokenAddress === tokenAddress &&
          isTransactionRecent(tx)
        );
      }),
    [allTransactions, spender, tokenAddress],
  );
}

export function useTransactionAdder() {
  const { chainId, account } = useActiveWeb3React();
  const [, setAllTransactions] = useAtom(
    $transactionHistory(chainId as ChainId),
  );
  return useCallback(
    (
      response: TransactionResponse,
      { approval, claim, summary }: TransactionSummary,
    ) => {
      if (!account) return;
      if (!chainId) return;

      const { hash } = response;
      if (!hash) {
        throw Error('No transaction hash found.');
      }
      setAllTransactions((txs) => {
        return {
          ...txs,
          [hash]: {
            hash,
            approval,
            summary,
            claim,
            from: account,
            addedTime: new Date().getTime(),
          },
        };
      });
    },
    [account, chainId, setAllTransactions],
  );
}
