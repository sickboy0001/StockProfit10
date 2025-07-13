// src/app/simulation/[id]/results/page.tsx
"use client"; // Client Componentとしてマーク

import React, { useState, useEffect } from "react";
// Supabaseクライアントのインポートは不要になるため削除
// import { createClient } from '@/utils/supabase/client';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useRouter } from "next/navigation";
import PlanResultCondition from "./PlanResultCondition";
import PlanResultTrades from "./PlanResultTrades";
import PlanResultStocks from "./PlanResultStocks";
import { format } from "date-fns";
import {
  getSimulationResultsByAnalysisConditionId,
  SimulationResult,
  TradeSummary,
} from "@/app/actions/Compass/simulationDb";
import PlanResultLog from "./PlanResultLog";

// データ型定義 (Supabaseのテーブルスキーマに合わせて調整)

interface CompassPlanIdProps {
  planId: string; // analysis_condition_id を想定
}

export default function PlanResult(params: CompassPlanIdProps) {
  const { planId } = params;
  const router = useRouter();
  const [selectResult, setSelectResult] = useState<SimulationResult | null>(
    null
  );
  const [simulationResultHeaders, setSimulationResultHeaders] = useState<
    SimulationResult[]
  >([]);
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setError("無効なプランIDです。");
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await getSimulationResultsByAnalysisConditionId(
        Number(planId)
      );
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      if (data === null) {
        setError("データSimulationResultがありません。");
        setLoading(false);
        return;
      }
      setSimulationResultHeaders(data);
      setSelectResult(data[0]);
      setLoading(false);

      // summary_jsonが文字列で返ってくる場合とオブジェクトで返ってくる場合の両方に対応します。
      const summaryData = data[0].summary_json;
      if (summaryData && typeof summaryData === "string") {
        try {
          console.log("summaryData:", JSON.parse(summaryData));
          setSummary(JSON.parse(summaryData));
        } catch (e) {
          console.error("Failed to parse summary_json:", e);
          setSummary(null); // パース失敗時はnullに設定します。
        }
      } else {
        setSummary(summaryData); // オブジェクトまたはnullの場合はそのまま設定します。
      }
      // setAnalysisCondition(planId);
      // setSummary(dummySummary);
      setLoading(false);
    };

    fetch();
  }, [planId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg">データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg">
        エラー: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen font-inter">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
        StockCompass
      </h1>
      <div className="mb-4 p-4 bg-gray-100 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">実行履歴</h3>
        <div className="flex flex-wrap gap-2">
          {simulationResultHeaders.map((result) => (
            <button
              key={result.id}
              onClick={() => setSelectResult(result)}
              className={`p-2 rounded-md cursor-pointer transition-colors text-sm border ${
                selectResult?.id === result.id
                  ? "bg-blue-500 text-white border-blue-600"
                  : "bg-white hover:bg-blue-100 text-gray-800 border-gray-300"
              }`}
            >
              ID: {result.id} - 実行完了:{" "}
              {result.completed_at
                ? format(new Date(result.completed_at), "yyyy/MM/dd HH:mm:ss")
                : "N/A"}
            </button>
          ))}
        </div>
      </div>
      <Card className="mb-8 p-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">サマリー</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-center">
          <SummaryItem
            label="最終損益 (課税後)"
            value={
              summary
                ? `¥${summary.total_net_profit_loss.toLocaleString()}`
                : "-"
            }
            isPositive={summary ? summary.total_net_profit_loss >= 0 : true}
          />
          <SummaryItem
            label="総利益"
            value={summary ? `¥${summary.gross_profit.toLocaleString()}` : "-"}
            isPositive={true}
          />
          <SummaryItem
            label="総損失"
            value={summary ? `¥${summary.gross_loss.toLocaleString()}` : "-"}
            isPositive={false}
          />
          <SummaryItem
            label="総トレード数"
            value={summary ? summary.total_trades.toLocaleString() : "-"}
          />
          <SummaryItem
            label="勝率"
            value={summary ? `${summary.win_rate.toFixed(2)}%` : "-"}
          />
          <SummaryItem
            label="プロフィットファクター"
            value={summary ? summary.profit_factor.toFixed(2) : "-"}
          />
        </div>
      </Card>

      <Tabs
        defaultValue="planInfo"
        className="w-full bg-white shadow-lg rounded-xl p-4"
      >
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1 mb-4">
          <TabsTrigger
            value="planInfo"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-4 py-2 text-gray-700 font-medium"
          >
            プラン情報
          </TabsTrigger>
          <TabsTrigger
            value="trades"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-4 py-2 text-gray-700 font-medium"
          >
            取引一覧
          </TabsTrigger>
          <TabsTrigger
            value="stocks"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-4 py-2 text-gray-700 font-medium"
          >
            銘柄一覧
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-4 py-2 text-gray-700 font-medium"
          >
            ログ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planInfo">
          <PlanResultCondition planId={planId} />
        </TabsContent>

        <TabsContent value="trades">
          <PlanResultTrades
            resultId={selectResult?.id ?? null}
            router={router}
          />
        </TabsContent>

        <TabsContent value="stocks">
          <PlanResultStocks
            resultId={selectResult?.id ?? null}
            router={router}
          />
        </TabsContent>

        <TabsContent value="logs" className="p-4">
          <PlanResultLog resultId={selectResult?.id ?? null}></PlanResultLog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// サマリー表示用のヘルパーコンポーネント
interface SummaryItemProps {
  label: string;
  value: string | number;
  percentage?: string;
  isPositive?: boolean;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
  label,
  value,
  percentage,
  isPositive = true,
}) => (
  <div className="bg-blue-50 p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
    <p className="text-sm font-medium text-blue-700 mb-1">{label}</p>
    <p
      className={`text-xl font-bold ${
        isPositive ? "text-green-700" : "text-red-700"
      }`}
    >
      {value}
      {percentage && <span className="ml-2 text-base">{percentage}</span>}
    </p>
  </div>
);
