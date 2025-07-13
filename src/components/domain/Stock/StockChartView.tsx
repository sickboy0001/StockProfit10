// src/components/domain/Stock/StockChart.tsx
"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import {
  createChart,
  ColorType,
  ISeriesApi,
  Time,
  LineStyle,
} from "lightweight-charts"; //npm install lightweight-charts@^4
import { ChartData } from "@/types/stock"; // DailyQuoteとChartDataの型定義は既存のものを使用
import { calculateAllMovingAverages } from "./analysis/movingAverage";
import { useStockQuotes } from "./api/stockApi";
import { format } from "date-fns"; // 日付フォーマット用
import EntryRecordViswHistory from "./EntryRecordViswHistory";
import { showCustomToast } from "@/components/organisms/CustomToast"; // ★ CustomToastをインポート

const diff_disp_month = 6;

interface StockChartProps {
  stockCode?: string;
  startDate?: string;
  endDate?: string;
}

const StockChartView: React.FC<StockChartProps> = ({
  stockCode = "2802", // デフォルト銘柄 (味の素)
  startDate = format(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    "yyyy-MM-dd"
  ), // 1年前
  endDate = format(new Date(), "yyyy-MM-dd"), // 今日
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null); // 出来高シリーズのRef
  // MACDシリーズのRef
  const macdLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const signalLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // // const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // カスタムツールチップのRef
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipContent, setTooltipContent] = useState<ChartData | null>(null);
  // ★ ツールチップの最終的な表示位置を管理するstate
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
    visible: boolean;
  } | null>(null);
  // ★ マウスの生の座標を管理するstate
  const [rawMousePosition, setRawMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const {
    data: quotes,
    isLoading,
    isError,
    error,
    registrationResult,
    isRegistering,
  } = useStockQuotes({
    stockCode: stockCode,
    startDate: startDate,
    endDate: endDate,
  });

  const chartData = useMemo(() => {
    // quotes が配列であり、要素を持つことを確認
    if (!Array.isArray(quotes) || quotes.length === 0) return [];

    // ★★★ 修正箇所 ★★★
    // チャートライブラリに渡す前に、無効なデータ(null)を除外します。
    // これにより "must be a number, got=object, value=null" エラーを防ぎます。
    const cleanedQuotes = quotes.filter(
      (q) =>
        q.open !== null &&
        q.high !== null &&
        q.low !== null &&
        q.close !== null &&
        q.volume !== null // 出来高もチェック
    );

    const calculatedData = calculateAllMovingAverages(cleanedQuotes, [20, 60]);
    return calculatedData;
  }, [quotes]);

  // chartDataをrefで管理して、イベントハンドラ内で最新の値にアクセスできるようにする
  const chartDataRef = useRef<ChartData[]>(chartData);
  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  useEffect(() => {
    // registrationResult の内容が空の場合はトーストを表示しない
    if (
      !registrationResult.actionError &&
      (!registrationResult.errorMessages ||
        registrationResult.errorMessages.length === 0) &&
      (!registrationResult.successMessages ||
        registrationResult.successMessages.length === 0)
    ) {
      return;
    }

    if (registrationResult.actionError) {
      showCustomToast({
        message: "情報更新処理エラー",
        submessage: registrationResult.actionError,
        type: "error",
      });
    } else if (
      registrationResult.errorMessages &&
      registrationResult.errorMessages.length > 0
    ) {
      showCustomToast({
        message: "情報更新時のエラー",
        submessage: registrationResult.errorMessages.join("\n"),
        type: "error",
      });
    } else if (
      registrationResult.successMessages &&
      registrationResult.successMessages.length > 0
    ) {
      showCustomToast({
        message: "情報更新",
        submessage: registrationResult.successMessages.join("\n"),
        type: "success",
      });
    }
  }, [registrationResult]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    // デバッグ: コンテナ要素と createChart 関数自体を確認
    console.log("Chart container element:", container);
    console.log("Chart container clientWidth:", container.clientWidth);
    console.log(
      "Chart container clientHeight:",
      chartContainerRef.current.clientHeight
    );
    console.log("typeof createChart:", typeof createChart);

    // コンテナの幅が0の場合は初期化を試みない
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn(
        "Chart container has zero dimensions. Chart will not be initialized yet."
      );
      return;
    }

    if (typeof createChart !== "function") {
      console.error(
        "createChart is not a function. Check lightweight-charts import or installation."
      );
      return;
    }

    // チャートの初期化
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "#FFFFFF" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#E0E0E0" },
        horzLines: { color: "#E0E0E0" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time) => {
          const date = new Date((time as number) * 1000); // Lightweight ChartsのtimeはUnixタイムスタンプ
          return format(date, "yyyy/MM/dd");
        },
        // rightOffset: 30, // ★ setLogicalRangeで表示範囲を直接制御するため、このオプションは不要になります
      },
      crosshair: {
        mode: 0, // Normal mode
      },
      rightPriceScale: {
        borderColor: "#E0E0E0",
      },
    });

    chartRef.current = chart;

    // ローソク足シリーズ (v5.x.x の可能性を考慮)
    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#4CAF50", // 緑
      downColor: "#F44336", // 赤
      borderVisible: false,
      wickColor: "#757575",
      wickUpColor: "#4CAF50",
      wickDownColor: "#F44336",
    });

    // 20日移動平均線シリーズ
    ma20SeriesRef.current = chart.addLineSeries({
      color: "#2196F3", // 青
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lineStyle: LineStyle.Dotted, // 点線
      lastValueVisible: false,
      priceLineVisible: false,
    }); // 型アサーションが必要な場合

    // 60日移動平均線シリーズ
    ma60SeriesRef.current = chart.addLineSeries({
      color: "#FFC107", // 黄
      lineWidth: 1,
      crosshairMarkerVisible: false,
      lineStyle: LineStyle.Dotted, // 点線
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // 出来高シリーズ (別パネルに表示)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume", // 出来高用のフォーマット
      },
      priceScaleId: "volume", // これを空にすることで新しいパネルに表示
    });

    volumeSeriesRef.current = volumeSeries;
    // 出来高パネルのY軸のマージンを設定
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }, // 例: 上部80%をマージン、下部0%をマージン (出来高は下20%に表示)
    });

    // MACDラインシリーズ (別パネル)
    macdLineSeriesRef.current = chart.addLineSeries({
      color: "rgba(0, 150, 136, 1)", // Teal
      lineWidth: 1,
      priceScaleId: "macd", // 新しいパネルID
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // シグナルラインシリーズ (別パネル)
    signalLineSeriesRef.current = chart.addLineSeries({
      color: "rgba(255, 82, 82, 1)", // Red
      lineWidth: 1,
      priceScaleId: "macd", // MACDと同じパネルID
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // MACDヒストグラムシリーズ (別パネル)
    macdHistogramSeriesRef.current = chart.addHistogramSeries({
      priceScaleId: "macd", // MACDと同じパネルID
      base: 0, // ヒストグラムの基準線
    });
    chart.priceScale("macd").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }, // 出来高パネルと同様にマージン設定
    });

    // ResizeObserverで親要素のサイズ変更を検知し、チャートをリサイズ
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width, height: 400 }); // 高さは固定
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // クロスヘア移動時のイベントリスナー
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.point) {
        const currentChartData = chartDataRef.current; // ★ refから最新のchartDataを取得
        const dataPoint = currentChartData.find(
          (d) =>
            format(new Date(d.date), "yyyy-MM-dd") ===
            format(new Date((param.time as number) * 1000), "yyyy-MM-dd") // formatは安定しているので問題なし
        );
        if (dataPoint) {
          setTooltipContent(dataPoint);
          setRawMousePosition({ x: param.point.x, y: param.point.y });
        } else {
          setTooltipContent(null);
          setRawMousePosition(null);
        }
      } else {
        setTooltipContent(null);
        setRawMousePosition(null);
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      // if (chartContainerRef.current) {
      //   resizeObserver.unobserve(chartContainerRef.current);
      // }
      resizeObserver.unobserve(container);
    };
  }, []);

  // ★ useLayoutEffect を使用して、DOM更新後の同期的な位置計算を保証
  useLayoutEffect(() => {
    if (
      !rawMousePosition ||
      !tooltipContent ||
      !tooltipRef.current ||
      !chartContainerRef.current
    ) {
      // ★ 表示位置情報を隠す
      setTooltipPosition((current) => {
        if (current?.visible) {
          return { ...current, visible: false };
        }
        return current;
      });
      return;
    }

    const chartRect = chartContainerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const { x: mouseX, y: mouseY } = rawMousePosition;
    const margin = 15; // カーソルからのマージン

    let left = mouseX + margin;
    let top = mouseY + margin;

    // 右端からはみ出るかチェックし、はみ出るなら左側に表示
    if (left + tooltipRect.width > chartRect.width) {
      left = mouseX - tooltipRect.width - margin;
    }

    // 下端からはみ出るかチェックし、はみ出るなら上側に表示
    if (top + tooltipRect.height > chartRect.height) {
      top = mouseY - tooltipRect.height - margin;
    }

    // 念のため、左端・上端からはみ出ないように最終調整
    if (left < 0) {
      left = 0;
    }
    if (top < 0) {
      top = 0;
    }

    // ★★★ 改善点 ★★★
    // 計算結果が現在の位置と異なる場合のみ更新 (関数アップデートを使用)
    setTooltipPosition((current) => {
      if (
        !current ||
        current.left !== left ||
        current.top !== top ||
        !current.visible
      ) {
        return { left, top, visible: true };
      }
      return current;
    });
  }, [rawMousePosition, tooltipContent]); // ★ 依存配列はこれでOK

  // データが更新されたときにチャートにセット
  useEffect(() => {
    if (
      !candlestickSeriesRef.current ||
      !ma20SeriesRef.current ||
      !ma60SeriesRef.current ||
      // !volumeSeriesRef.current
      !volumeSeriesRef.current ||
      !macdLineSeriesRef.current ||
      !signalLineSeriesRef.current ||
      !macdHistogramSeriesRef.current
    )
      return;

    // Lightweight Charts用にデータを変換
    const candlestickData = chartData.map((d) => ({
      time: (new Date(d.date).getTime() / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const ma20Data = chartData
      .filter((d) => d.ma20 !== undefined)
      .map((d) => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.ma20!,
      }));

    const ma60Data = chartData
      .filter((d) => d.ma60 !== undefined)
      .map((d) => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.ma60!,
      }));

    const macdLineData = chartData
      .filter((d) => d.macd?.line !== undefined)
      .map((d) => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.macd!.line!,
      }));

    const signalLineData = chartData
      .filter((d) => d.macd?.signal !== undefined)
      .map((d) => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.macd!.signal!,
      }));

    const macdHistogramData = chartData
      .filter((d) => d.macd?.histogram !== undefined)
      .map((d) => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.macd!.histogram!,
        color:
          d.macd!.histogram! >= 0
            ? "rgba(76, 175, 80, 0.5)" // 正の値: 緑
            : "rgba(244, 67, 54, 0.5)", // 負の値: 赤
      }));

    const volumeData = chartData.map((d) => ({
      time: (new Date(d.date).getTime() / 1000) as Time,
      value: typeof d.volume === "number" ? d.volume : 0, // Ensure value is a number, default to 0 if not
      color:
        d.open !== undefined &&
        d.close !== undefined &&
        d.close !== null &&
        d.open !== null
          ? d.close >= d.open
            ? "rgba(76, 175, 80, 0.5)" // 陽線の場合: 緑
            : "rgba(244, 67, 54, 0.5)" // 陰線の場合: 赤
          : "rgba(160, 160, 160, 0.5)", // データがない場合: グレー
    }));

    candlestickSeriesRef.current.setData(candlestickData);
    ma20SeriesRef.current.setData(ma20Data);
    ma60SeriesRef.current.setData(ma60Data);

    // データがロードされたら、チャートを最新のデータ範囲にフィットさせる
    volumeSeriesRef.current.setData(volumeData);
    // MACDデータをシリーズに設定
    macdLineSeriesRef.current.setData(macdLineData);
    signalLineSeriesRef.current.setData(signalLineData);
    macdHistogramSeriesRef.current.setData(macdHistogramData);

    // データがロードされたら、チャートを最新のデータ範囲にフィットさせる
    if (chartRef.current) {
      // データがロードされたら、表示範囲を調整します。
      // 初期表示は直近約6ヶ月とし、右側にスペースを確保します。
      if (candlestickData.length > 0) {
        const timeScale = chartRef.current.timeScale();
        const dataLength = candlestickData.length;

        // 表示したい期間（約6ヶ月）をバーの数に換算します。
        // 1ヶ月あたり約20営業日と仮定します。
        const visibleBars = diff_disp_month * 20;

        // 表示開始のインデックスを計算します。データ数が足りない場合は最初から表示します。
        const fromIndex = Math.max(0, dataLength - visibleBars);

        // 表示終了のインデックスは、最後のバーにオフセットを加えた位置です。
        // このオフセットが右側のスペースになります。
        const toIndex = dataLength - 1 + 10; // 30バー分のスペース

        timeScale.setVisibleLogicalRange({
          from: fromIndex,
          to: toIndex,
        });
      }
    }
  }, [chartData]); // chartDataが変更されたときに実行

  if (isError) {
    return <div className="text-red-500">Error: {error?.message}</div>;
  }

  return (
    <div>
      <div className="p-4 bg-white shadow-lg rounded-lg">
        {/* isRegisteringの状態表示 (任意) */}
        {isRegistering && (
          <div className="text-center py-2 text-blue-500">
            関連情報を更新中...
          </div>
        )}

        {/* registrationResultからのメッセージ表示 */}
        {registrationResult.actionError && (
          <div className="my-2 p-2 bg-orange-100 border border-orange-400 text-orange-700 rounded">
            <strong>情報更新処理エラー:</strong>{" "}
            {registrationResult.actionError}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">データ読み込み中...</div>
        )}
        {!isLoading && (!Array.isArray(quotes) || quotes.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            指定された期間の株価データが見つかりません。
          </div>
        )}

        {/* Lightweight Chartsをレンダリングするコンテナ */}
        <div
          ref={chartContainerRef}
          className="relative"
          style={{ height: "400px", width: "100%" }}
        >
          {/* カスタムツールチップ */}
          {tooltipContent && (
            <div
              ref={tooltipRef}
              className="absolute bg-white p-2 border border-gray-300 shadow-md pointer-events-none whitespace-nowrap" // whitespace-nowrap は引き続き重要です
              style={{
                left: `${tooltipPosition?.left ?? 0}px`,
                top: `${tooltipPosition?.top ?? 0}px`,
                visibility: tooltipPosition?.visible ? "visible" : "hidden",
                zIndex: 10,
              }}
            >
              <p className="font-bold">
                {format(new Date(tooltipContent.date), "yyyy-MM-dd")}
              </p>
              <p>終値: {tooltipContent.close?.toFixed(2)}</p>
              <p>始値: {tooltipContent.open?.toFixed(2)}</p>
              <p>高値: {tooltipContent.high?.toFixed(2)}</p>
              <p>安値: {tooltipContent.low?.toFixed(2)}</p>
              <p>出来高: {tooltipContent.volume}</p>
              {tooltipContent.ma20 && (
                <p>20日移動平均: {tooltipContent.ma20.toFixed(2)}</p>
              )}
              {tooltipContent.ma60 && (
                <p>60日移動平均: {tooltipContent.ma60.toFixed(2)}</p>
              )}
              {/* シミュレーション売買タイミングやシグナルもここに表示可能 */}
              {tooltipContent.macd && (
                <>
                  <p className="mt-1 pt-1 border-t border-gray-200">MACD:</p>
                  <p>ライン: {tooltipContent.macd.line?.toFixed(2)}</p>
                  <p>シグナル: {tooltipContent.macd.signal?.toFixed(2)}</p>
                  <p>
                    ヒストグラム: {tooltipContent.macd.histogram?.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        <EntryRecordViswHistory stockCode={stockCode}></EntryRecordViswHistory>
      </div>
    </div>
  );
};

export default StockChartView;
