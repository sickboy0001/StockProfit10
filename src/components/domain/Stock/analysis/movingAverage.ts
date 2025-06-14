// src/components/domain/Stock/analysis/movingAverage.ts
import { DailyQuote, ChartData } from "@/types/stock";

interface ChartDataWithDynamicMA extends ChartData {
  [key: `ma${number}`]: number | undefined;
}

/**
 * 指定された期間の移動平均線を計算します。
 * @param data 日次株価データの配列
 * @param period 移動平均線の期間 (例: 20, 60)
 * @returns 移動平均線が追加された株価データの配列
 */
export const calculateMovingAverage = (
  data: DailyQuote[],
  period: number
): ChartData[] => {
  if (data.length < period) {
    return data.map((d) => ({ ...d }));
  }

  const result: ChartData[] = [];
  for (let i = 0; i < data.length; i++) {
    // Use the local interface that allows dynamic 'maX' properties
    const currentData: ChartDataWithDynamicMA = { ...data[i] };
    if (i >= period - 1) {
      if (data.slice(i - period + 1, i + 1).every((q) => q.close !== null)) {
        const sum = data
          .slice(i - period + 1, i + 1)
          .reduce((acc, quote) => acc + (quote.close ?? 0), 0); // null の場合は 0 として加算
        currentData[`ma${period}`] = parseFloat((sum / period).toFixed(2));
      } else {
        currentData[`ma${period}`] = undefined; // 期間内にnullがあればSMAもundefined
      }
    }
    result.push(currentData);
  }
  return result;
};

/**
 * 複数の移動平均線をまとめて計算します。
 * @param data 日次株価データの配列
 * @param periods 計算する移動平均線の期間の配列 (例: [20, 60])
 * @returns 移動平均線とMACDが追加された株価データの配列
 */
export const calculateAllMovingAverages = (
  data: DailyQuote[],
  periods: number[]
): ChartData[] => {
  let processedData: ChartData[] = data.map((d) => ({ ...d })); // DailyQuoteをChartDataに変換

  for (const period of periods) {
    processedData = calculateMovingAverage(processedData, period);
  }

  // MACDの計算
  const shortPeriod = 12;
  const longPeriod = 26;
  const signalPeriod = 9;

  const closePrices = data
    .map((d) => d.close)
    .filter((price) => price !== null) as number[];

  if (closePrices.length >= longPeriod) {
    // 最長のEMA期間以上のデータがある場合のみMACDを計算
    const emaShort = calculateEMA(closePrices, shortPeriod);
    const emaLong = calculateEMA(closePrices, longPeriod);

    const macdLine: (number | undefined)[] = new Array(data.length).fill(
      undefined
    );
    const signalLine: (number | undefined)[] = new Array(data.length).fill(
      undefined
    );
    const macdHistogram: (number | undefined)[] = new Array(data.length).fill(
      undefined
    );

    let dataIndex = 0; // 元のdata配列のインデックス
    for (let i = 0; i < data.length; i++) {
      if (data[i].close !== null) {
        // closeがnullでないデータポイントのみ処理
        if (
          emaShort[dataIndex] !== undefined &&
          emaLong[dataIndex] !== undefined
        ) {
          macdLine[i] = parseFloat(
            (emaShort[dataIndex]! - emaLong[dataIndex]!).toFixed(5)
          );
        }
        dataIndex++;
      }
    }

    const validMacdLines = macdLine.filter(
      (val) => val !== undefined
    ) as number[];
    if (validMacdLines.length >= signalPeriod) {
      // const emaSignalInput = macdLine.map((val) =>
      //   val === undefined ? 0 : val
      // ); // EMA計算のためにundefinedを0で埋める(実際にはフィルタリングされた値を使うべき)
      const calculatedSignalLine = calculateEMA(validMacdLines, signalPeriod);

      let signalIndex = 0;
      for (let i = 0; i < data.length; i++) {
        if (macdLine[i] !== undefined) {
          // MACDラインが存在する箇所にシグナルラインをマッピング
          signalLine[i] =
            calculatedSignalLine[signalIndex] !== undefined
              ? parseFloat(calculatedSignalLine[signalIndex]!.toFixed(5))
              : undefined;
          if (signalLine[i] !== undefined) {
            macdHistogram[i] = parseFloat(
              (macdLine[i]! - signalLine[i]!).toFixed(5)
            );
          }
          signalIndex++;
        }
      }
    }

    processedData = processedData.map((d, i) => ({
      ...d,
      macd: {
        line: macdLine[i],
        signal: signalLine[i],
        histogram: macdHistogram[i],
      },
    }));
  } else {
    // データが不足している場合はMACD情報を空で設定
    processedData = processedData.map((d) => ({
      ...d,
      macd: { line: undefined, signal: undefined, histogram: undefined },
    }));
  }
  return processedData;
};

/**
 * 指数平滑移動平均 (EMA) を計算します。
 * @param data 数値データの配列 (通常は終値の配列)
 * @param period EMAの期間
 * @returns EMAの配列。最初の period-1 個の要素は undefined になります。
 */
const calculateEMA = (
  data: number[],
  period: number
): (number | undefined)[] => {
  if (data.length < period) {
    return new Array(data.length).fill(undefined);
  }

  const k = 2 / (period + 1);
  const emaArray: (number | undefined)[] = new Array(data.length).fill(
    undefined
  );

  // 最初のEMAはSMAで計算
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  emaArray[period - 1] = sum / period;

  // 2番目以降のEMAを計算
  for (let i = period; i < data.length; i++) {
    emaArray[i] = data[i] * k + emaArray[i - 1]! * (1 - k);
  }
  return emaArray;
};
