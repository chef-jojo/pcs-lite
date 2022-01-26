import dynamic from 'next/dynamic';

const TestChainLink1 = dynamic(
  () => import('~/components/TestChainLink'),
  {
    ssr: false,
  },
);

function TestChainLink() {
  return <TestChainLink1 />;
}

export default TestChainLink;
