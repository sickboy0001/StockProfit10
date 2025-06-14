// src/components/domain/Stock/PageStockDataViewer.tsx
"use client";
import React from "react";
import StockChart from "./StockChart";
import { useSearchParams } from "next/navigation";

export default function PageChartTest() {
  const searchParams = useSearchParams();
  const stockCode = searchParams.get("stockCode") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  return (
    <div className="container mx-auto p-4">
      <StockChart
        initialStockCode={stockCode}
        initialStartDate={startDate}
        initialEndDate={endDate}
      ></StockChart>
    </div>
  );
}
