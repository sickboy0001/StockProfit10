// src/components/domain/Stock/StockChartViewHistory.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  fetchRecentViewedStockCodes,
  RecentViewedStockInfo,
} from "@/app/actions/stock";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"; // ★ Collapsibleコンポーネントをインポート
import { ChevronDown, ChevronUp } from "lucide-react"; // ★ アイコンをインポート

interface StockChartViewHistoryProps {
  userId: string | undefined;
  onSelectStock: (stockCode: string) => void;
}

const StockChartViewHistory: React.FC<StockChartViewHistoryProps> = ({
  userId,
  onSelectStock,
}) => {
  const [recentStockCodes, setRecentStockCodes] = useState<
    RecentViewedStockInfo[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Collapsibleの開閉状態を管理

  useEffect(() => {
    if (userId && isOpen) {
      setIsLoadingHistory(true);
      setHistoryError(null);
      fetchRecentViewedStockCodes(userId, 20) // 取得件数は必要に応じて調整
        .then((response) => {
          if (response.success && response.data) {
            setRecentStockCodes(response.data);
          } else {
            setHistoryError(response.error || "Failed to load history");
            setRecentStockCodes([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching stock history:", err);
          setHistoryError(
            "An unexpected error occurred while fetching history."
          );
          setRecentStockCodes([]);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else {
      // userIdがない場合は履歴をクリアし、ローディング状態を解除
      setRecentStockCodes([]);
      setHistoryError(null);
      setIsLoadingHistory(false);
    }
  }, [userId, isOpen]);

  // ユーザーIDがない場合は何も表示しない
  if (!userId) {
    return null;
  }

  const renderContent = () => {
    if (isLoadingHistory) {
      return (
        <p className="text-xs text-gray-500 mt-1 self-start">履歴読込中...</p>
      );
    }

    if (historyError) {
      return (
        <p className="text-xs text-red-500 mt-1 self-start">{historyError}</p>
      );
    }

    if (recentStockCodes.length > 0) {
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1 md:mt-0">
          {recentStockCodes.map((recentItem) => (
            <span
              key={`history-${recentItem.stock_code}`} // よりユニークなキー
              className="text-blue-600 hover:underline cursor-pointer"
              onClick={() => onSelectStock(recentItem.stock_code)}
              role="button" // クリック可能であることを示す
              tabIndex={0} // フォーカス可能にする
              onKeyDown={(e) => {
                // Enterキーでも選択可能にする
                if (e.key === "Enter") {
                  onSelectStock(recentItem.stock_code);
                }
              }}
            >
              {recentItem.stock_code}:{recentItem.company_name}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div
        className="flex flex-col justify-end"
        style={{ minHeight: "2.5rem" }} // Labelの高さに合わせるための最小高さを維持
      >
        <p className="text-xs text-gray-500 self-start pt-1">
          {" "}
          {/* Labelとの間隔調整 */}
          閲覧履歴はありません。
        </p>
      </div>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Label className="cursor-pointer">最近見た銘柄</Label>
            {isOpen ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )}{" "}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-2">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
          {renderContent()}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default StockChartViewHistory;
