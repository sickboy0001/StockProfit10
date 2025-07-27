"use client";

// import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useState } from "react";
// shadcn/ui のコンポーネントのインポートを想定
// 実際のプロジェクトでは、これらをインストールし、components/ui に配置しているはずです
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPlanDetailsAll,
  PlanDetailsAll,
} from "@/app/actions/Compass/PlanActions";
// import { initiateSimulationAction } from "@/app/actions/Compass/SimulationActions";
import SignDisp from "@/components/domain/Compass/SignDisp";

interface GeneratePlanResultProps {
  id: string;
  periodVisible?: boolean;
}

export default function PlanDisp(props: GeneratePlanResultProps) {
  const { id, periodVisible = true } = props;
  const [planData, setPlanData] = useState<PlanDetailsAll | null>(null);
  const [isStockListExpanded, setIsStockListExpanded] = useState(false);
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const router = useRouter();
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

  // 銘柄リストを分割して表示を制御
  const stocks = planData?.stockCodes ?? [];
  const visibleStocks = stocks.slice(0, 10);
  const hiddenStocks = stocks.slice(10);
  const hasHiddenStocks = hiddenStocks.length > 0;

  return (
    <>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl shadow-xl rounded-lg border border-gray-200">
          <div className="p-6 space-y-8">
            {periodVisible ? (
              <div className="grid grid-cols-[max-content_1fr] gap-4 items-center">
                <h3 className="text-xl font-semibold text-gray-800 pr-4">
                  期間:
                </h3>
                <p className="text-center text-gray-800 bg-gray-100 py-1 rounded-md font-medium whitespace-nowrap">
                  {planData?.simulationPeriod?.start_date ?? "未設定"} ～{" "}
                  {planData?.simulationPeriod?.end_date ?? "未設定"}
                </p>
              </div>
            ) : (
              <div></div>
            )}

            {/* 銘柄選択 */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                銘柄選択
              </h3>
              <div className="flex items-end space-x-2">
                <div className="flex-grow">
                  <div className="mt-1 space-y-2 rounded-md border p-2 bg-gray-50 max-h-48 overflow-y-auto">
                    {visibleStocks.map((stock) => (
                      <div
                        key={stock.code}
                        className="flex items-center text-sm p-1"
                      >
                        <span className="font-mono bg-gray-200 text-gray-700 rounded px-2 py-1 text-xs mr-2">
                          {stock.code}
                        </span>
                        <span className="text-gray-800">{stock.name}</span>
                      </div>
                    ))}
                    {hasHiddenStocks && (
                      <Collapsible
                        open={isStockListExpanded}
                        onOpenChange={setIsStockListExpanded}
                        className="w-full"
                      >
                        <CollapsibleContent className="space-y-1 animate-in slide-in-from-top-2">
                          {hiddenStocks.map((stock) => (
                            <div
                              key={stock.code}
                              className="flex items-center text-sm p-1"
                            >
                              <span className="font-mono bg-gray-200 text-gray-700 rounded px-2 py-1 text-xs mr-2">
                                {stock.code}
                              </span>
                              <span className="text-gray-800">
                                {stock.name}
                              </span>
                            </div>
                          ))}
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center justify-center w-full text-sm text-blue-600 hover:text-blue-800 p-1 mt-1 rounded-md hover:bg-gray-100 transition-colors">
                            {isStockListExpanded
                              ? "閉じる"
                              : `残り${hiddenStocks.length}件を表示`}
                            <ChevronDown
                              className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                                isStockListExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 取引前提・条件フィルタリング */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                取引前提・条件フィルタリング
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700">購入金額上限 (円)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.tradeParameter?.max_purchase_amount?.toLocaleString(
                      "ja-JP"
                    ) ?? "未設定"}
                    {planData?.tradeParameter?.max_purchase_amount != null && (
                      <span className="ml-1 text-sm text-gray-600">円</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">購入金額下限 (円)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.tradeParameter?.min_purchase_amount?.toLocaleString(
                      "ja-JP"
                    ) ?? "未設定"}
                    {planData?.tradeParameter?.min_purchase_amount != null && (
                      <span className="ml-1 text-sm text-gray-600">円</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">出来高下限 (株)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.tradeParameter?.min_volume?.toLocaleString(
                      "ja-JP"
                    ) ?? "未設定"}
                    {planData?.tradeParameter?.min_volume != null && (
                      <span className="ml-1 text-sm text-gray-600">株</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">取引単位 (株)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.tradeParameter?.trade_unit?.toLocaleString(
                      "ja-JP"
                    ) ?? "未設定"}
                    {planData?.tradeParameter?.trade_unit != null && (
                      <span className="ml-1 text-sm text-gray-600">株</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 取引タイプ選択 */}

            <div className="grid grid-cols-[max-content_1fr] gap-4 items-center">
              <h3 className="text-xl font-semibold text-gray-800 pr-4">
                取引タイプ:
              </h3>
              <p className="text-center text-gray-800 bg-gray-100 py-1 rounded-md font-medium whitespace-nowrap">
                {planData?.signal?.transaction_type}{" "}
              </p>
            </div>

            {/* 入口サイン条件 (複数対応 & グループ対応) */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                入口サイン条件
              </h3>
              <SignDisp
                conditionsJson={planData?.entrySignal?.conditions_json || null}
                signalType="entry"
              />
            </div>

            {/* 出口サイン条件 (複数対応 & グループ対応 - New Section) */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                出口サイン条件
              </h3>
              <SignDisp
                conditionsJson={planData?.exitSignal?.conditions_json || null}
                signalType="exit"
              />
            </div>

            {/* 手数料・税率 */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                手数料・税率
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700">購入時手数料率 (%)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.feeTax?.buy_fee_rate != null
                      ? planData.feeTax.buy_fee_rate * 100
                      : "未設定"}
                    {planData?.feeTax?.buy_fee_rate != null && (
                      <span className="ml-1 text-sm text-gray-600">%</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">売却時手数料率 (%)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.feeTax?.sell_fee_rate != null
                      ? planData.feeTax.sell_fee_rate * 100
                      : "未設定"}
                    {planData?.feeTax?.sell_fee_rate != null && (
                      <span className="ml-1 text-sm text-gray-600">%</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">税率 (%)</Label>
                  <p className="mt-1 rounded-md bg-gray-100 p-2 text-base font-medium text-gray-900">
                    {planData?.feeTax?.tax_rate != null
                      ? planData.feeTax.tax_rate * 100
                      : "未設定"}
                    {planData?.feeTax?.tax_rate != null && (
                      <span className="ml-1 text-sm text-gray-600">%</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
