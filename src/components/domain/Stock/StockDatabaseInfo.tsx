// src/components/domain/Stock/StockDatabaseInfo.tsx
"use client";

import React, { useEffect, useState } from "react";
import { fetchStockDetailsFromDB } from "@/app/actions/stock";
import { StockDetails } from "@/types/stock";
import StockCompanyDetail from "./StockCompanyDetail";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import PortfolioButton from "./PortfolioButton";

interface StockDatabaseInfoProps {
  stockCode: string;
  userId?: string; // userIdをオプショナルなpropとして受け取る
}

const StockDatabaseInfo: React.FC<StockDatabaseInfoProps> = ({
  stockCode,
  userId,
}) => {
  const [stockInfo, setStockInfo] = useState<StockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompanyDetailOpen, setIsCompanyDetailOpen] = useState(false); // ★ 詳細情報の開閉状態
  useEffect(() => {
    if (!stockCode) {
      setStockInfo(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const loadStockInfo = async () => {
      setIsLoading(true);
      setError(null);
      setStockInfo(null); // 既存情報をクリア
      const response = await fetchStockDetailsFromDB(stockCode);
      if (response.data) {
        setStockInfo(response.data);
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    };

    loadStockInfo();
  }, [stockCode]);

  if (isLoading) {
    return (
      <div className="p-4 my-4 border rounded-md text-center animate-pulse">
        銘柄情報を読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 my-4 border border-red-300 bg-red-50 rounded-md text-red-700">
        エラー: {error}
      </div>
    );
  }

  if (!stockInfo) {
    // stockCode があるが情報がない場合 (エラーなし) は、ロード前か該当なし
    return stockCode ? (
      <div className="p-4 my-4 border rounded-md text-gray-500">
        銘柄情報を表示できません。
      </div>
    ) : null;
  }

  // Yahoo!ファイナンスのURLを生成するヘルパー関数
  const getYahooFinanceUrl = (code: string) => {
    return `https://finance.yahoo.co.jp/quote/${code}.T`; // 例: 9235.T
  };
  return (
    <div>
      <div className="p-3 my-1 bg-blue-50 rounded-lg shadow-xl text-gray-800">
        <Collapsible
          open={isCompanyDetailOpen}
          onOpenChange={setIsCompanyDetailOpen}
          className="w-full"
        >
          {/* トップライン: 企業名、コード、市場、業種、ポートフォリオボタン、CollapsibleTrigger */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
            <div className="flex items-baseline flex-wrap">
              {/* 銘柄名とコード */}
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                {stockInfo.name}
              </h2>
              <span className="ml-3 text-lg font-medium text-gray-400">
                ({stockInfo.code})
              </span>
              {/* 市場と業種 */}
              {(stockInfo.market || stockInfo.industry) && (
                <div className="ml-0 md:ml-4 flex items-center text-sm text-gray-500 space-x-2 mt-1 md:mt-0 flex-wrap">
                  {stockInfo.market && (
                    <span className="bg-green-400 text-gray-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                      {stockInfo.market}
                    </span>
                  )}
                  {stockInfo.industry && (
                    <span className="bg-green-400 text-gray-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                      {stockInfo.industry}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center space-x-2 md:space-x-4 mt-2 md:mt-0">
              {/* CollapsibleTriggerをここに配置 */}
              {/* テキスト色とホバー時の背景色を調整 */}
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 focus:outline-none rounded-md hover:bg-blue-100 transition duration-150 ease-in-out"
                >
                  <span>企業追加情報</span>
                  {isCompanyDetailOpen ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </button>
              </CollapsibleTrigger>
              {/* Yahoo!ファイナンスへのリンク */}
              {/* ボーダー、テキスト、ホバー時の背景色を調整 */}
              <a
                href={getYahooFinanceUrl(stockInfo.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 border border-blue-200 text-xs font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                title="Yahoo!ファイナンスで詳細を見る"
              >
                <svg
                  className="-ml-0.5 mr-1.5 h-3.5 w-3.5" // サイズ調整
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
                Yahoo!
              </a>
              {/* ポートフォリオに追加ボタン (アクセントカラーは維持) */}
              <PortfolioButton
                stockCode={stockCode}
                stockName={stockInfo.name}
                userId={userId}
              />{" "}
            </div>
          </div>
          {/* CollapsibleContent は StockCompanyDetail コンポーネントがレンダリング */}
          <CollapsibleContent>
            <StockCompanyDetail
              stockCode={stockCode}
              isOpen={isCompanyDetailOpen}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default StockDatabaseInfo;
