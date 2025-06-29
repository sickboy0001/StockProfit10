"use client";

import React, { useEffect, useState } from "react";
// shadcn/ui のコンポーネントのインポートを想定
// 実際のプロジェクトでは、これらをインストールし、components/ui に配置しているはずです
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPlanDetailsAll,
  PlanDetailsAll,
} from "@/app/actions/Compass/PlanActions";

interface GeneratePlanResultProps {
  id: string;
}

export default function GeneratePlanResult(props: GeneratePlanResultProps) {
  const { id } = props;
  const [planData, setPlanData] = useState<PlanDetailsAll | null>(null);
  // フォーム送信ハンドラ
  const { user } = useAuth();
  console.log("called GeneratePlanResult", id);
  useEffect(() => {
    const fetch = async () => {
      const result = await getPlanDetailsAll(Number(id));
      setPlanData(result.data);
    };
    fetch();
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setIsSubmitting(true);

    // if (!user?.id) {
    //   return;
    // }

    // // クライアントサイドでの簡易バリデーション
    // if (!startDate || !endDate) {
    //   showCustomToast({
    //     message: "入力エラー",
    //     submessage: "シミュレーション期間を選択してください。",
    //     type: "error",
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }
    // if (stockCodes.length === 0) {
    //   showCustomToast({
    //     message: "入力エラー",
    //     submessage:
    //       "銘柄コードを入力するか、ポートフォリオから選択してください。",
    //     type: "error",
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }
    // if (startDate && endDate && startDate > endDate) {
    //   showCustomToast({
    //     message: "入力エラー",
    //     submessage: "開始日は終了日より前の日付を選択してください。",
    //     type: "error",
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }

    // // 入口サイン条件が設定されていない場合のバリデーション
    // if (entryConditions.length === 0) {
    //   showCustomToast({
    //     message: "入力エラー",
    //     submessage: "入口サイン条件を少なくとも1つ追加してください。",
    //     type: "error",
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }

    // // 基本的な数値入力のバリデーション
    // const baseNumberInputs = {
    //   maxPurchaseAmount,
    //   minVolume,
    //   tradeUnit,
    //   buyFeeRate,
    //   sellFeeRate,
    //   taxRate,
    //   baseExitDays,
    //   baseExitProfitPercent,
    //   baseExitStopLossPercent,
    // };
    // let hasError = false;
    // for (const [key, value] of Object.entries(baseNumberInputs)) {
    //   if (isNaN(value as number) || (value as number) < 0) {
    //     showCustomToast({
    //       message: "入力エラー",
    //       submessage: `${key} は有効な数値を入力してください。`,
    //       type: "error",
    //     });
    //     hasError = true;
    //     break;
    //   }
    // }
    // if (hasError) {
    //   setIsSubmitting(false);
    //   return;
    // }

    // // Helper to flatten conditions for backend submission
    // const formatConditionForBackend = (
    //   condition: DisplayableEntryCondition | DisplayableExitCondition
    //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // ): any => {
    //   if ("isGroup" in condition && condition.isGroup) {
    //     return {
    //       type: "group",
    //       logic: condition.logic,
    //       conditions: condition.conditions.map(formatConditionForBackend),
    //     };
    //   } else {
    //     // idとlabelはバックエンドに送信しないため、未使用でもESLintエラーを抑制
    //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    //     const { id, label, ...rest } = condition;
    //     return rest;
    //   }
    // };

    // try {
    //   // 必須出口条件をオブジェクトとして構築
    //   const fixedExitConditionsBackend: SimpleExitCondition[] = [
    //     {
    //       id: "fixed_exit_days_backend",
    //       type: "fixedDays",
    //       days: baseExitDays,
    //       label: `固定: ${baseExitDays}日経過で決済`,
    //     },
    //     {
    //       id: "fixed_exit_profit_backend",
    //       type: "profitTarget",
    //       percent: baseExitProfitPercent,
    //       label: `固定: ${baseExitProfitPercent}%利益で決済`,
    //     },
    //     {
    //       id: "fixed_exit_stop_loss_backend",
    //       type: "stopLoss",
    //       percent: baseExitStopLossPercent,
    //       label: `固定: ${baseExitStopLossPercent}%損切りで決済`,
    //     },
    //   ];

    //   // 全ての出口条件を結合 (必須条件は常にORロジックで結合される想定)
    //   // バックエンド側でこのリストが評価される
    //   const allExitConditionsForBackend = [
    //     ...fixedExitConditionsBackend,
    //     ...optionalExitConditions,
    //   ];

    //   // Server Actionの呼び出しのためのパラメータ構築
    //   const formattedEntryConditions = entryConditions.map(
    //     formatConditionForBackend
    //   );
    //   const formattedExitConditions = allExitConditionsForBackend.map(
    //     formatConditionForBackend
    //   ); // New

    //   const simulationParams: ISimulationRequestParams = {
    //     name: "",
    //     memo: "",
    //     userId: user?.id,
    //     stockSelection: {
    //       name: "",
    //       memo: "",
    //       stockCodes: stockCodes,
    //     },
    //     simulationPeriod: {
    //       name: "",
    //       memo: "",
    //       startDate: format(startDate, "yyyy-MM-dd"),
    //       endDate: format(endDate, "yyyy-MM-dd"),
    //     },
    //     tradeFilter: {
    //       name: "",
    //       memo: "",
    //       maxPurchaseAmount,
    //       minVolume,
    //       tradeUnit,
    //     },

    //     signs: {
    //       name: "",
    //       memo: "",
    //       transactionType: transactionType,
    //       entry_name: "",
    //       entry_memo: "",
    //       entry: {
    //         entryConditions: formattedEntryConditions,
    //         globalEntryConditionLogic,
    //       },
    //       exit_name: "",
    //       exit_memo: "",
    //       exit: {
    //         exitConditions: formattedExitConditions,
    //       },
    //     },
    //     feeTax: {
    //       name: "",
    //       memo: "",
    //       buyFeeRate: buyFeeRate / 100,
    //       sellFeeRate: sellFeeRate / 100,
    //       taxRate: taxRate / 100,
    //     },
    //   };
    //   setSimulationParams(simulationParams);

    //   const result = await registPlan(simulationParams);

    //   if (result.error) {
    //     showCustomToast({
    //       message: "シミュレーションエラー",
    //       submessage: result.error,
    //       type: "error",
    //     });
    //   } else if (result.simulationId) {
    //     showCustomToast({
    //       message: "シミュレーション成功",
    //       submessage: `シミュレーションID: ${result.simulationId}`,
    //       type: "success",
    //     });
    //     console.log(`シミュレーションID: ${result.simulationId}`);
    //   }
    // } catch (error) {
    //   console.error("シミュレーション実行中にエラーが発生しました:", error);
    //   showCustomToast({
    //     message: "システムエラー",
    //     submessage: "シミュレーションの実行中に予期せぬエラーが発生しました。",
    //     type: "error",
    //   });
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  return (
    <>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-2xl shadow-xl rounded-lg border border-gray-200">
          <CardHeader className="bg-white p-6 border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-800 text-left">
              シミュレーション結果作成
            </CardTitle>
            <CardDescription className="text-gray-500 text-left mt-1">
              過去データに基づき、プランのシミュレーション実施画面です。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 銘柄選択 */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  銘柄選択
                </h3>
                <div className="flex items-end space-x-2">
                  <div className="flex-grow">
                    <Label
                      htmlFor="stock-codes"
                      className="text-gray-700 text-sm"
                    >
                      銘柄コード（カンマ区切りで複数選択可能）
                    </Label>
                    {/* <Input
                      id="stock-codes"
                      placeholder="例: 7203, 9984"
                      value={stockCodes.join(", ")}
                      onChange={(e) => {
                        const codes = e.target.value
                          .split(",")
                          .map((code) => code.trim())
                          .filter((code) => code);
                        setStockCodes(codes);
                        // ユーザーが手動で編集した場合、ポートフォリオの選択状態を解除
                        setPortfolioId("");
                      }}
                      type="text"
                      className="rounded-md mt-1"
                    /> */}
                  </div>
                  {/* <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPortfolioSelectionModal(true)}
                    className="whitespace-nowrap"
                  >
                    ポートフォリオから選択
                  </Button> */}
                </div>
              </div>

              {/* シミュレーション期間 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  シミュレーション期間
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label>{planData?.simulationPeriod?.start_date}</label>-
                  <label>{planData?.simulationPeriod?.end_date}</label>
                </div>
              </div>

              {/* 取引前提・条件フィルタリング */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  取引前提・条件フィルタリング
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="max-purchase-amount"
                      className="text-gray-700"
                    >
                      購入金額上限 (円)
                    </Label>
                    <label>
                      {planData?.tradeParameter?.max_purchase_amount}円
                    </label>
                  </div>
                  <div>
                    <Label htmlFor="min-volume" className="text-gray-700">
                      出来高下限 (株)
                    </Label>
                    <label>{planData?.tradeParameter?.min_volume}円</label>
                  </div>
                  <div>
                    <Label htmlFor="trade-unit" className="text-gray-700">
                      取引単位 (株)
                    </Label>
                    <label>{planData?.tradeParameter?.trade_unit}円</label>
                  </div>
                </div>
              </div>

              {/* 取引タイプ選択 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  取引タイプ
                </h3>
                <div>
                  <Label
                    htmlFor="transaction-type-select"
                    className="text-gray-700"
                  >
                    取引方向を選択
                  </Label>
                  <Label>{planData?.signal?.transaction_type}</Label>
                </div>
              </div>

              {/* 入口サイン条件 (複数対応 & グループ対応) */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                  入口サイン条件
                </h3>
              </div>

              {/* 出口サイン条件 (複数対応 & グループ対応 - New Section) */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                  出口サイン条件
                </h3>

                {/* 必須出口条件 */}
                <div className="space-y-4 p-4 border border-purple-300 rounded-md bg-purple-50">
                  <p className="text-md font-semibold text-purple-800">
                    必須条件 (常に適用される基本の決済ルール)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="base-exit-days" className="text-gray-700">
                        経過日数で決済 (日)
                      </Label>
                      {/* <Input
                        id="base-exit-days"
                        type="number"
                        value={baseExitDays}
                        onChange={(e) =>
                          setBaseExitDays(Number(e.target.value))
                        }
                        min="0"
                        className="rounded-md bg-white"
                      /> */}
                    </div>
                    <div>
                      <Label
                        htmlFor="base-exit-profit-percent"
                        className="text-gray-700"
                      >
                        利益率で決済 (%)
                      </Label>
                      {/* <Input
                        id="base-exit-profit-percent"
                        type="number"
                        value={baseExitProfitPercent}
                        onChange={(e) =>
                          setBaseExitProfitPercent(Number(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        className="rounded-md bg-white"
                      /> */}
                    </div>
                    <div>
                      <Label
                        htmlFor="base-exit-stop-loss-percent"
                        className="text-gray-700"
                      >
                        損切り率で決済 (%)
                      </Label>
                      {/* <Input
                        id="base-exit-stop-loss-percent"
                        type="number"
                        value={baseExitStopLossPercent}
                        onChange={(e) =>
                          setBaseExitStopLossPercent(Number(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        className="rounded-md bg-white"
                      /> */}
                    </div>
                  </div>
                </div>

                {/* その他の追加オプション出口条件 */}
                <div className="space-y-2 mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 flex justify-between items-center">
                    追加出口条件 (オプション)
                  </h4>
                </div>
              </div>

              {/* 手数料・税率 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  手数料・税率
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buy-fee-rate" className="text-gray-700">
                      購入時手数料率 (%)
                    </Label>
                    <label>{planData?.feeTax?.buy_fee_rate}%</label>
                  </div>
                  <div>
                    <Label htmlFor="sell-fee-rate" className="text-gray-700">
                      売却時手数料率 (%)
                    </Label>
                    <label>{planData?.feeTax?.sell_fee_rate}%</label>
                  </div>
                  <div>
                    <Label htmlFor="tax-rate" className="text-gray-700">
                      税率 (%)
                    </Label>
                    <label>{planData?.feeTax?.tax_rate}%</label>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                // disabled={isSubmitting}
              >
                {/* {isSubmitting ? (
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
                    プラン作成中...
                  </span>
                ) : (
                  "プラン作成"
                )} */}
                シミュレーション実施
              </Button>
            </form>
            {/* {simulationParams && (
              <div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  送信されるパラメータ (JSON)
                </h4>
                <pre className="text-xs bg-white p-3 rounded-md overflow-x-auto">
                  <code>{JSON.stringify(simulationParams, null, 2)}</code>
                </pre>
              </div>
            )} */}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
