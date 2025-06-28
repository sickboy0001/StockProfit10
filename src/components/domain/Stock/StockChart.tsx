// src/components/domain/Stock/StockChart.tsx
"use client";

import React, { useState } from "react";
import { format } from "date-fns"; // 日付フォーマット用
// import EntryRecordViswHistory from "./EntryRecordViswHistory";
import StockChartForm from "./StockChartSeletCode"; // ★ 新しいフォームコンポーネントをインポート
import StockDatabaseInfo from "./StockDatabaseInfo";
import StockChartView from "./StockChartView";
import { useAuth } from "@/contexts/AuthContext";

interface StockChartProps {
  initialStockCode?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

const StockChart: React.FC<StockChartProps> = ({
  initialStockCode = "2802", // デフォルト銘柄 (味の素)
  initialStartDate = format(
    new Date(new Date().setFullYear(new Date().getFullYear() - 3)),
    "yyyy-MM-dd"
  ), // 3年前
  initialEndDate = format(new Date(), "yyyy-MM-dd"), // 今日
}) => {
  const [stockCode, setStockCode] = useState(initialStockCode);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [currentStockCode, setCurrentStockCode] = useState(initialStockCode);
  const [currentStartDate, setCurrentStartDate] = useState(initialStartDate);
  const [currentEndDate, setCurrentEndDate] = useState(initialEndDate);

  // // const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const { user } = useAuth();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called", stockCode);
    setCurrentStockCode(stockCode);
    setCurrentStartDate(startDate);
    setCurrentEndDate(endDate);
  };

  // if (isError) {
  //   return <div className="text-red-500">Error: {error?.message}</div>;
  // }
  const isLoading = false;
  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">株価チャート</h2>
      <StockChartForm
        userId={user?.id}
        stockCode={stockCode}
        startDate={startDate}
        endDate={endDate}
        onStockCodeChange={setStockCode}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      <StockDatabaseInfo stockCode={currentStockCode} userId={user?.id} />

      <StockChartView
        stockCode={currentStockCode}
        startDate={currentStartDate}
        endDate={currentEndDate}
      ></StockChartView>
    </div>
  );
};

export default StockChart;
