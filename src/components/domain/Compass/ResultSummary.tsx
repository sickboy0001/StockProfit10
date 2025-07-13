"use client";

import { useCallback, useEffect, useState } from "react";
import { getSimulationResultAction } from "@/app/actions/Compass/SimulationActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import {
  SimulationResult,
  TradeSummary,
} from "@/app/actions/Compass/simulationDb";

// サマリー表示用のヘルパーコンポーネント
interface SummaryItemProps {
  label: string;
  value: string | number;
  isPositive?: boolean;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
  label,
  value,
  isPositive,
}) => (
  <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p
      className={`text-2xl font-bold ${
        isPositive === true
          ? "text-green-600"
          : isPositive === false
          ? "text-red-600"
          : "text-gray-800"
      }`}
    >
      {value}
    </p>
  </div>
);

// 結果サマリーを表示するコンポーネント
const ResultSummary = ({ summary }: { summary: TradeSummary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <SummaryItem
        label="最終損益 (課税後)"
        value={`¥${summary.total_net_profit_loss.toLocaleString()}`}
        isPositive={summary.total_net_profit_loss >= 0}
      />
      <SummaryItem
        label="総利益"
        value={`¥${summary.gross_profit.toLocaleString()}`}
        isPositive={true}
      />
      <SummaryItem
        label="総損失"
        value={`¥${summary.gross_loss.toLocaleString()}`}
        isPositive={false}
      />
      <SummaryItem label="総トレード数" value={summary.total_trades} />
      <SummaryItem label="勝率" value={`${summary.win_rate.toFixed(2)}%`} />
      <SummaryItem
        label="プロフィットファクター"
        value={summary.profit_factor.toFixed(2)}
      />
    </div>
  );
};

export default function SimulationResultPage({
  params,
}: {
  params: { id: string };
}) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const simulationId = Number(params.id);

  const fetchResult = useCallback(async () => {
    if (isNaN(simulationId)) {
      setError("無効なIDです。");
      setIsLoading(false);
      return;
    }
    const { data, error: fetchError } = await getSimulationResultAction(
      simulationId
    );
    if (fetchError) setError(fetchError);
    else setResult(data);
    setIsLoading(false);
  }, [simulationId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // 5秒ごとにポーリング（自動更新）
  useEffect(() => {
    if (result?.status === "pending" || result?.status === "running") {
      const timer = setTimeout(() => fetchResult(), 5000);
      return () => clearTimeout(timer);
    }
  }, [result, fetchResult]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            {error || "結果が見つかりません。"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const planName = result.sptch_analysis_conditions?.name || "無題のプラン";

  return (
    <div className="font-sans flex justify-center items-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-3xl shadow-xl rounded-lg border border-gray-200">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold text-gray-800">
            シミュレーション結果
          </CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            プラン「{planName}」のシミュレーション結果です。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {result.status === "completed" && result.summary_json && (
            <>
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">完了</AlertTitle>
                <AlertDescription className="text-green-700">
                  シミュレーションは正常に完了しました。
                </AlertDescription>
              </Alert>
              <ResultSummary summary={result.summary_json} />
            </>
          )}
          {(result.status === "pending" || result.status === "running") && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-blue-800">実行中...</h3>
              <p className="text-blue-700 mt-2">
                この処理には数分かかる場合があります。ページは5秒ごとに自動更新されます。
              </p>
            </div>
          )}
          {result.status === "failed" && (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>シミュレーション失敗</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 p-2 bg-red-100 rounded text-sm whitespace-pre-wrap">
                  {result.error_message || "不明なエラー"}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
