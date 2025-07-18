"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
// shadcn/ui のコンポーネントのインポートを想定
// 実際のプロジェクトでは、これらをインストールし、components/ui に配置しているはずです

import { useAuth } from "@/contexts/AuthContext";
import {
  getPlanDetailsAll,
  PlanDetailsAll,
} from "@/app/actions/Compass/PlanActions";
import { initiateSimulationAction } from "@/app/actions/Compass/SimulationActions";
import PlanDisp from "./PlanDisp";
import { Button } from "@/components/ui/button";

interface GeneratePlanResultProps {
  id: string;
}

export default function GeneratePlanResult(props: GeneratePlanResultProps) {
  const { id } = props;
  const [planData, setPlanData] = useState<PlanDetailsAll | null>(null);
  // const [isStockListExpanded, setIsStockListExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // フォーム送信ハンドラ
  const { user } = useAuth();
  // console.log("called GeneratePlanResult", id);
  useEffect(() => {
    const fetch = async () => {
      const result = await getPlanDetailsAll(Number(id));
      setPlanData(result.data);
    };
    fetch();
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await initiateSimulationAction(Number(id));

      if (result.success && result.simulationResultId) {
        // 成功した場合、新しく作成されたシミュレーション結果ページにリダイレクトします
        router.push(`/Compass/Results/${Number(id)}`);
      } else {
        // 失敗した場合、エラーメッセージを表示します
        setError(result.error || "不明なエラーが発生しました。");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "クライアント側で予期せぬエラーが発生しました。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 銘柄リストを分割して表示を制御
  // const stocks = planData?.stockCodes ?? [];
  // const visibleStocks = stocks.slice(0, 10);
  // const hiddenStocks = stocks.slice(10);
  // const hasHiddenStocks = hiddenStocks.length > 0;

  return (
    <>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-2xl font-bold text-gray-800 text-left">
            シミュレーション結果作成
          </p>
          <p className="text-gray-500 text-left mt-1">
            過去データに基づき、プランのシミュレーション実施画面です。
          </p>
          <PlanDisp id={props.id}></PlanDisp>
          {/* アクションボタン */}
          <Button
            type="submit"
            className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
            disabled={isSubmitting || !planData}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                シミュレーション開始中...
              </span>
            ) : (
              "シミュレーション実施"
            )}
          </Button>
        </form>
        {error && (
          <div className="mt-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded-md text-sm">
            <p>
              <strong>エラー:</strong> {error}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
