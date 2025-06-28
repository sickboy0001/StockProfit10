// src/components/domain/Stock/StockChartForm.tsx
"use client";

import React, { useRef } from "react"; // Added useEffect, useState

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import {
//   // fetchRecentViewedStockCodes,
//   // RecentViewedStockInfo,
//   searchStocksByName, // ★ 銘柄名検索アクションをインポート
//   // SearchedStockInfo, // ★ 検索結果の型をインポート
// } from "@/app/actions/stock"; // ★ 閲覧履歴取得アクションをインポート
import StockChartViewHistory from "./StockChartViewHistory"; // ★ 新しいコンポーネントをインポート
import StockCodeSearchInput from "@/components/molecules/StockCodeSearchInput";

interface StockChartSelectCodeProps {
  userId?: string; // userIdをオプショナルなpropとして受け取る
  stockCode: string;
  startDate: string;
  endDate: string;
  onStockCodeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const StockChartSelectCode: React.FC<StockChartSelectCodeProps> = ({
  // Renamed component
  userId,
  stockCode,
  startDate,
  endDate,
  onStockCodeChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  isLoading,
}) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null); // 送信ボタンのref

  const currentUserId = userId;

  // StockCodeSearchInput から銘柄が選択されたときのハンドラ
  const handleStockCodeSelectedFromSearch = (selectedCode: string) => {
    onStockCodeChange(selectedCode); // 親コンポーネントのstockCodeを更新
    // 検索選択後、必要であればフォーム送信ボタンにフォーカスを移動
    requestAnimationFrame(() => {
      // 検索選択後、フォーム送信ボタンにフォーカスを移動し、クリックをシミュレート
      submitButtonRef.current?.focus();
      submitButtonRef.current?.click(); // クリックをシミュレートしてフォームを送信
    });
  };
  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <Label htmlFor="stockCodeForm">銘柄コード</Label>
          {/* StockCodeSearchInput コンポーネントを使用 */}
          <StockCodeSearchInput
            value={stockCode}
            onValueChange={onStockCodeChange} // 入力フィールドの変更を親に伝える
            onStockSelected={handleStockCodeSelectedFromSearch} // 検索結果からの選択を親に伝える
            isLoadingForm={isLoading} // 親フォームのローディング状態を子に伝える
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="startDateForm">開始日</Label>
          <Input
            id="startDateForm"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            tabIndex={-1} // タブキーでのフォーカスを無効化
            className="w-40"
          />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="endDateForm">終了日</Label>
          <Input
            id="endDateForm"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            tabIndex={-1} // タブキーでのフォーカスを無効化
            className="w-40"
          />
        </div>
        <Button
          type="submit"
          ref={submitButtonRef} // 送信ボタンにrefを設定
          disabled={isLoading}
        >
          {" "}
          {isLoading ? "読み込み中..." : "チャート表示"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-end pt-1">
        {/* StockChartViewHistoryコンポーネントを配置 */}
        <StockChartViewHistory
          userId={currentUserId}
          onSelectStock={handleStockCodeSelectedFromSearch}
        />
      </div>
    </form>
  );
};

export default StockChartSelectCode;
