import { format } from 'date-fns';
import { useMultiCall, useSWRContract } from '~/hooks/useSWRContract';
import chainlinkOracleAbi from 'config/abi/chainlinkOracle.json';
import { getChainlinkOracleContract } from '~/utils/contract-helper';
import { getChainlinkOracleAddress } from '~/utils/address-helpers';
import { useEffect, useMemo, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import { ChainlinkOracle } from '~/config/abi/types';
import { theme } from '@pcs/ui';
import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

const chainLinkContract = getChainlinkOracleContract();
const chainlinkAddress = getChainlinkOracleAddress();

export const formatBigNumberToFixed = (
  number: ethers.BigNumber,
  displayDecimals = 18,
  decimals = 18,
) => {
  const formattedString = formatUnits(number, decimals);
  return (+formattedString).toFixed(displayDecimals);
};

function TestChainLink() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi>();
  const areaSeries = useRef<ISeriesApi<'Area'>>();
  const lastRound = useSWRContract([
    chainLinkContract,
    'latestRound',
  ]);

  const calls = useMemo(() => {
    return lastRound.data
      ? Array.from({ length: 100 }).map((_, i) => ({
          address: chainlinkAddress,
          name: 'getRoundData',
          params: [lastRound.data!.sub(i)],
        }))
      : null;
  }, [lastRound.data]);

  const { data, error } = useMultiCall<
    Awaited<ReturnType<ChainlinkOracle['getRoundData']>>[]
  >(chainlinkOracleAbi, calls);

  const computedData = useMemo(() => {
    return (
      data
        ?.map(({ answer, roundId, startedAt }, i) => {
          return {
            answer: parseFloat(formatBigNumberToFixed(answer, 3, 8)),
            roundId: roundId.toString(),
            startedAt: startedAt.toNumber() as UTCTimestamp,
            t: format(startedAt.toNumber() * 1000, 'MM/dd h:mm a s'),
          };
        })
        .reverse() ?? []
    );
  }, [data]);

  useEffect(() => {
    const data = computedData.map((d) => ({
      time: d.startedAt,
      value: d.answer,
    }));
    console.log(computedData, 'data');
    areaSeries.current?.setData(data);
    chartApi?.current?.timeScale().fitContent();
  }, [computedData]);

  useEffect(() => {
    if (!chartRef.current || !chartRef.current.parentElement) return;

    const chart = createChart(chartRef.current, {
      height: 500,
      width: chartRef.current.parentElement.clientWidth - 32,
      layout: {
        backgroundColor: 'transparent',
        textColor: theme.colors.textSubtle.value,
        fontFamily: 'Kanit, sans-serif',
        fontSize: 12,
      },
      // rightPriceScale: {
      //   scaleMargins: {
      //     top: 0.1,
      //     bottom: 0.1,
      //   },
      //   borderVisible: false,
      // },
      timeScale: {
        // borderVisible: false,
        // secondsVisible: true,
        // tickMarkFormatter: (unixTime: number) => {
        //   return format(unixTime * 1000, 'MM/dd h:mm a');
        // },
      },
      watermark: {
        visible: false,
      },
      grid: {
        // horzLines: {
        //   visible: false,
        // },
        // vertLines: {
        //   visible: false,
        // },
      },
      crosshair: {
        // horzLine: {
        //   visible: false,
        //   labelVisible: false,
        // },
        // mode: 1,
        // vertLine: {
        //   visible: true,
        //   labelVisible: false,
        //   style: 3,
        //   width: 1,
        //   color: theme.colors.textSubtle.value,
        //   labelBackgroundColor: theme.colors.primary.value,
        // },
      },
    });

    areaSeries.current = chart.addAreaSeries();

    // areaSeries.current?.setData(data);

    // areaSeries.current?.priceScale().applyOptions({
    //   autoScale: true,
    // });

    chartApi.current = chart;
  }, [computedData]);

  return (
    <div>
      <div ref={chartRef} id="candle-chart" />
    </div>
  );
}

export default TestChainLink;
