import { BigNumber, Contract } from 'ethers';
import useSWR from 'swr';
type MethodArg = string | number | BigNumber;
type MethodArgs = Array<MethodArg | MethodArg[]>;

type OptionalMethodInputs =
  | Array<MethodArg | MethodArg[] | undefined>
  | undefined;

export function useSWRContract(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
) {
  return useSWR([methodName, contract, inputs], async () => {
    if (!contract) return null;
    if (!inputs) return contract[methodName]();
    return contract[methodName](...inputs);
  });
}
