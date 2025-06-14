"use client";
import React, { useEffect, useRef } from "react";
import { createChart, ColorType, Time } from "lightweight-charts";

const sampleData = [
  { time: "2023-01-02" as Time, open: 100, high: 105, low: 98, close: 102 },
  { time: "2023-01-03" as Time, open: 102, high: 108, low: 101, close: 107 },
  { time: "2023-01-04" as Time, open: 107, high: 110, low: 105, close: 109 },
  { time: "2023-01-05" as Time, open: 109, high: 112, low: 107, close: 108 },
  { time: "2023-01-06" as Time, open: 108, high: 109, low: 105, close: 106 },
];

export default function MinimalCandleTest() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !chartContainerRef.current ||
      chartContainerRef.current.clientWidth === 0
    ) {
      return;
    }
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: { background: { type: ColorType.Solid, color: "white" } },
      rightPriceScale: { autoScale: true },
    });
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#4CAF50",
      downColor: "#F44336",
    });
    candlestickSeries.setData(sampleData);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, []);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "600px", height: "300px", border: "1px solid black" }}
    />
  );
}
