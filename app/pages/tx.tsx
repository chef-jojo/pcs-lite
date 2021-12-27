import { BigNumber, ethers } from 'ethers';
import { Box, Input, Text } from '@pcs/ui';
import { useEffect, useState } from 'react';
import { useActiveWeb3React } from '~/hooks/use-web3';
import { GetStaticProps, GetStaticPropsResult } from 'next';
import fs from 'fs';
import path from 'path';

function Transaction(props: { abiFiles: string[] }) {
  const [txHash, setTxHash] = useState('');
  const { library } = useActiveWeb3React();

  const [filePath, setFilePath] = useState('');
  const [txDesc, setTxDesc] =
    useState<ethers.utils.TransactionDescription>();

  useEffect(() => {
    if (!filePath || !txHash) return;
    import(`~/config/abi/${filePath}`).then((res) => {
      const inter = new ethers.utils.Interface(res.default);
      library?.getTransaction(txHash).then((tx) => {
        if (!tx) {
          return;
        }

        const decodedInput = inter.parseTransaction({
          data: tx.data,
          value: tx.value,
        });
        setTxDesc(decodedInput);
        console.log(decodedInput, 'decodedInput');
        // Decoded Transaction
        // console.log({
        //   function_name: decodedInput.name,
        //   from: tx.from,
        //   to: decodedInput.args[0],
        //   erc20Value: Number(decodedInput.args[1]),
        // });
      });
    });
  }, [filePath, library, txHash]);

  return (
    <Box>
      <select
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
      >
        {props.abiFiles.map((abiFile) => (
          <option key={abiFile} value={abiFile}>
            {abiFile}
          </option>
        ))}
      </select>
      <Input
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
      />

      {txDesc && (
        <Box>
          <Text>{txDesc.name}</Text>
          <Text>{txDesc.signature}</Text>
          {txDesc.functionFragment.inputs.map((input) => (
            <Text key={input.name}>
              {input.name}:{' '}
              {input.baseType === 'array' ? (
                <>
                  [
                  {txDesc.args[input.name].map(
                    (item: any, i: number) => (
                      <>
                        <Display
                          key={i}
                          type={input.arrayChildren.type}
                          value={item}
                        />
                        ,{' '}
                      </>
                    ),
                  )}
                  ]
                </>
              ) : (
                <Display
                  type={input.type}
                  value={txDesc.args[input.name]}
                />
              )}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

const Display = ({ type, value }: any) => {
  switch (type) {
    case 'uint256':
      return value.toString();
    case 'uint8':
    case 'string':
      return value;
    default:
      return value;
  }
};

export const getStaticProps: GetStaticProps = async () => {
  const dirPath = path.join(process.cwd(), 'config/abi');
  const abiFiles = fs
    .readdirSync(dirPath)
    .map((file) => {
      if (file.includes('.json')) {
        return file;
      }
      return null;
    })
    .filter(Boolean);

  return {
    props: {
      abiFiles,
    },
  };
};

export default Transaction;
