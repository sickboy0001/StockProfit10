"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns";
// shadcn/ui のコンポーネントのインポートを想定
// 実際のプロジェクトでは、これらをインストールし、components/ui に配置しているはずです
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenericConditionItem } from "./GenericConditionItem"; // GenericConditionItemをインポート
import { PlanEntryConditionModal } from "./PlanEntryConditionModal";
import { PlanEntryGroupModal } from "./PlanEntryGroupModal";
import { PlanExitConditionModal } from "./PlanExitConditionModal";
import { showCustomToast } from "@/components/organisms/CustomToast";
import { registPlan } from "@/app/actions/Compass/simulation";
import { PortfolioSelectionModal } from "./PortfolioSelectionModal";
import {
  ISimulationRequestParams,
  TransactionDirection,
  SimpleEntryCondition,
  SimpleExitCondition,
  GroupedCondition,
  DisplayableEntryCondition,
  DisplayableExitCondition,
} from "@/types/simulation";
import Link from "next/link";
import { PlanDetailsAll } from "@/app/actions/Compass/PlanActions";
interface FetchedPortfolio {
  id: string;
  name: string;
  stocks: { code: string; name: string }[];
}

interface planMakeProps {
  initialPlan?: PlanDetailsAll; // analysis_condition_id を想定
}

export default function PlanMake(props: planMakeProps) {
  const [portfolioId, setPortfolioId] = useState<string>(""); // ポートフォリオID
  const [stockCodes, setStockCodes] = useState<string[]>([]); // 個別銘柄コード (複数)
  const [startDate, setStartDate] = useState<Date | undefined>(
    props.initialPlan?.simulationPeriod?.start_date
      ? new Date(props.initialPlan.simulationPeriod.start_date)
      : new Date(2023, 0, 1)
  ); // シミュレーション開始日
  const [endDate, setEndDate] = useState<Date | undefined>(
    props.initialPlan?.simulationPeriod?.end_date
      ? new Date(props.initialPlan.simulationPeriod.end_date)
      : new Date()
  ); // シミュレーション終了日

  // 取引タイプ (ロング/ショート) を追加
  const [transactionType, setTransactionType] = useState<TransactionDirection>(
    // DBの"buy"をコンポーネントの"long"に、"sell"を"short"にマッピングする
    props.initialPlan?.signal?.transaction_type === "sell" ? "short" : "long" // "buy" または未定義の場合は "long" をデフォルトとする
  );

  const getInitialEntryState = () => {
    const conditionsJson = props.initialPlan?.entrySignal?.conditions_json;
    if (conditionsJson) {
      try {
        const parsed =
          typeof conditionsJson === "string"
            ? JSON.parse(conditionsJson)
            : conditionsJson;
        return {
          entryConditions: parsed.entryConditions || [],
          globalEntryConditionLogic: parsed.globalEntryConditionLogic || "AND",
        };
      } catch (e) {
        console.error("Failed to parse entry conditions from defplan", e);
      }
    }
    return { entryConditions: [], globalEntryConditionLogic: "AND" };
  };
  const initialEntryState = getInitialEntryState();

  // 入口サイン条件の管理
  const [entryConditions, setEntryConditions] = useState<
    DisplayableEntryCondition[]
  >(initialEntryState.entryConditions); // 追加された入口サイン条件のリスト
  const [globalEntryConditionLogic, setGlobalEntryConditionLogic] = useState<
    "AND" | "OR"
  >(initialEntryState.globalEntryConditionLogic); // 複数のトップレベル入口条件・グループの結合ロジック

  const getInitialExitState = () => {
    const conditionsJson = props.initialPlan?.exitSignal?.conditions_json;
    if (conditionsJson) {
      try {
        const parsed =
          typeof conditionsJson === "string"
            ? JSON.parse(conditionsJson)
            : conditionsJson;

        const allConditions: DisplayableExitCondition[] =
          parsed.exitConditions || [];

        // Default values
        let baseExitDays = 10;
        let baseExitProfitPercent = 10;
        let baseExitStopLossPercent = 10;
        const optionalExitConditions: DisplayableExitCondition[] = [];

        for (const cond of allConditions) {
          if (!("isGroup" in cond)) {
            switch (cond.type) {
              case "fixedDays":
                baseExitDays = cond.days ?? 10;
                break;
              case "profitTarget":
                baseExitProfitPercent = cond.percent ?? 10;
                break;
              case "stopLoss":
                baseExitStopLossPercent = cond.percent ?? 10;
                break;
              default:
                optionalExitConditions.push(cond);
                break;
            }
          } else {
            // It's a group, which is also optional
            optionalExitConditions.push(cond);
          }
        }

        return {
          baseExitDays,
          baseExitProfitPercent,
          baseExitStopLossPercent,
          optionalExitConditions,
        };
      } catch (e) {
        console.error("Failed to parse exit conditions from defplan", e);
      }
    }
    // Return default state if no defplan or parsing fails
    return {
      baseExitDays: 10,
      baseExitProfitPercent: 10,
      baseExitStopLossPercent: 10,
      optionalExitConditions: [],
    };
  };
  const initialExitState = getInitialExitState();

  // 出口サイン条件の管理 (New)
  // 必須の出口条件を個別のStateとして管理
  const [baseExitDays, setBaseExitDays] = useState<number>(
    initialExitState.baseExitDays
  );
  const [baseExitProfitPercent, setBaseExitProfitPercent] = useState<number>(
    initialExitState.baseExitProfitPercent
  );
  const [baseExitStopLossPercent, setBaseExitStopLossPercent] =
    useState<number>(initialExitState.baseExitStopLossPercent);

  // 追加の出口条件（オプション）はリストで管理
  const [optionalExitConditions, setOptionalExitConditions] = useState<
    DisplayableExitCondition[]
  >(initialExitState.optionalExitConditions);
  // 追加出口条件のトップレベル結合ロジックはORに固定されるため、Stateは不要に。
  // const [globalExitConditionLogic, setGlobalExitConditionLogic] = useState<"AND" | "OR">("OR");

  const [maxPurchaseAmount, setMaxPurchaseAmount] = useState<number>(
    props.initialPlan?.tradeParameter?.max_purchase_amount ?? 500000
  ); // 購入金額上限
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(
    props.initialPlan?.tradeParameter?.min_purchase_amount ?? 100000
  ); // 購入金額下限
  const [minVolume, setMinVolume] = useState<number>(
    props.initialPlan?.tradeParameter?.min_volume ?? 100000
  ); // 出来高下限
  const [tradeUnit, setTradeUnit] = useState<number>(
    props.initialPlan?.tradeParameter?.trade_unit ?? 100
  ); // 取引単位
  const [buyFeeRate, setBuyFeeRate] = useState<number>(
    (props.initialPlan?.feeTax?.buy_fee_rate ?? 0.005) * 100
  ); //購入時手数料
  const [sellFeeRate, setSellFeeRate] = useState<number>(
    (props.initialPlan?.feeTax?.sell_fee_rate ?? 0.005) * 100
  ); // 売却時手数料率 (%)

  const [taxRate, setTaxRate] = useState<number>(
    (props.initialPlan?.feeTax?.tax_rate ?? 0.20315) * 100
  ); // 税率 (%)

  // 個別入口条件追加モーダル関連の状態
  const [showAddEntryConditionModal, setShowAddEntryConditionModal] =
    useState<boolean>(false); // 個別条件追加モーダルの表示/非表示
  const [editingEntryConditionId, setEditingEntryConditionId] = useState<
    string | null
  >(null); // 編集中の条件ID, nullなら新規追加

  // 入口グループ作成モーダル関連の状態
  const [showGroupEntryConditionModal, setShowGroupEntryConditionModal] =
    useState<boolean>(false);
  // 個別出口条件追加/編集モーダル関連の状態 (New)
  const [showAddExitConditionModal, setShowAddExitConditionModal] =
    useState<boolean>(false);
  const [editingOptionalExitConditionId, setEditingOptionalExitConditionId] =
    useState<string | null>(null); // 編集中の追加出口条件ID

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // フォーム送信中フラグ
  const [simulationParams, setSimulationParams] =
    useState<ISimulationRequestParams>();

  const [showPortfolioSelectionModal, setShowPortfolioSelectionModal] =
    useState(false); // ポートフォリオ選択モーダルの表示状態

  const { user } = useAuth();

  // 取引タイプ変更時にモーダルの条件タイプをリセット (入口用)
  useEffect(() => {
    // 取引タイプが変わったら、既存の入口条件と追加出口条件をリセットする
    setEntryConditions([]);
    setOptionalExitConditions([]); // オプションの出口条件のみリセット
    setEditingEntryConditionId(null); // 編集中の入口条件をクリア
    setEditingOptionalExitConditionId(null); // 編集中の追加出口条件をクリア
  }, [transactionType]);

  // 個別入口条件追加モーダルを開くハンドラ
  const handleAddEntryConditionClick = () => {
    setEditingEntryConditionId(null); // 新規追加のため、編集IDをクリア
    setShowAddEntryConditionModal(true);
  };

  // 個別入口条件の編集モーダルを開くハンドラ (New)
  const handleEditEntryCondition = (condition: SimpleEntryCondition) => {
    setEditingEntryConditionId(condition.id); // 編集対象のIDを設定
    setShowAddEntryConditionModal(true); // モーダルを開く
  };

  // ポートフォリオ選択モーダルからポートフォリオが選択された時のハンドラ
  const handlePortfolioSelectedFromModal = (portfolio: FetchedPortfolio) => {
    setPortfolioId(portfolio.id);
    setStockCodes(portfolio.stocks.map((s) => s.code)); // 選択されたポートフォリオの銘柄コードを展開
    setShowPortfolioSelectionModal(false); // モーダルを閉じる
  };

  // 個別入口条件の追加または更新ハンドラ (結合)
  const handleAddOrUpdateEntryCondition = (
    newOrUpdatedCondition: SimpleEntryCondition
  ) => {
    if (editingEntryConditionId) {
      // 既存条件を更新
      setEntryConditions((prev) =>
        prev.map((cond) =>
          cond.id === editingEntryConditionId ? newOrUpdatedCondition : cond
        )
      );
    } else {
      // 新規条件を追加
      setEntryConditions((prev) => [...prev, newOrUpdatedCondition]);
    }
    setShowAddEntryConditionModal(false); // モーダルを閉じる
    setEditingEntryConditionId(null); // 編集状態をクリア
  };

  // 個別出口条件追加モーダルを開くハンドラ (New)
  const handleAddOptionalExitConditionClick = () => {
    setEditingOptionalExitConditionId(null); // 新規追加のため、編集IDをクリア
    setShowAddExitConditionModal(true);
  };

  // 個別出口条件の編集モーダルを開くハンドラ (New)
  const handleEditOptionalExitCondition = (condition: SimpleExitCondition) => {
    setEditingOptionalExitConditionId(condition.id); // 編集対象のIDを設定
    setShowAddExitConditionModal(true); // モーダルを開く
  };

  // 個別出口条件の追加または更新ハンドラ (New)
  const handleAddOrUpdateOptionalExitCondition = (
    newOrUpdatedCondition: SimpleExitCondition
  ) => {
    if (editingOptionalExitConditionId) {
      // 既存条件を更新
      setOptionalExitConditions((prev) =>
        prev.map((cond) =>
          cond.id === editingOptionalExitConditionId
            ? newOrUpdatedCondition
            : cond
        )
      );
    } else {
      // 新規条件を追加
      setOptionalExitConditions((prev) => [...prev, newOrUpdatedCondition]);
    }
    setShowAddExitConditionModal(false);
    setEditingOptionalExitConditionId(null); // 編集状態をクリア
  };

  // 入口グループ作成モーダルを開くハンドラ
  const handleOpenEntryGroupModal = () => {
    setShowGroupEntryConditionModal(true);
  };

  // 入口グループ作成モーダルでのグループ追加ハンドラ
  const handleAddEntryGroupCondition = (
    newGroup: GroupedCondition<SimpleEntryCondition>
  ) => {
    // 新しいグループに含まれる条件を既存のリストから削除
    const remainingConditions = entryConditions.filter(
      (cond) => !newGroup.conditions.some((gCond) => gCond.id === cond.id)
    );
    // Type assertion needed because `remainingConditions` and `newGroup` are of different specific types within the union.
    // 残りの条件と新しいグループを追加
    setEntryConditions([...remainingConditions, newGroup]);
    setShowGroupEntryConditionModal(false); // モーダルを閉じる
  };

  // 条件削除ハンドラ (汎用、再帰的に処理)
  // この関数は`optionalExitConditions`にのみ適用されるため、`isFixed`のチェックは不要
  const handleRemoveCondition = <
    T extends DisplayableEntryCondition | DisplayableExitCondition,
  >(
    idToRemove: string,
    conditionList: T[],
    setConditionList: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    const removeRecursive = (conditions: T[]): T[] => {
      const newConditions: T[] = [];
      for (const cond of conditions) {
        if (cond.id === idToRemove) {
          continue; // 削除対象なのでスキップ
        }

        if ("isGroup" in cond && cond.isGroup) {
          // グループ内の条件を再帰的に処理
          // cond.conditions は T[] と互換性がある
          const updatedGroupConditions = removeRecursive(
            cond.conditions as T[]
          ); // Type assertion needed here

          if (updatedGroupConditions.length === 0) {
            continue; // グループが空になったらグループごと削除
          } else {
            // グループ内の条件が減った場合、ラベルを更新
            const newLabel = `グループ (${updatedGroupConditions
              .map((c) => c.label)
              .join(` ${cond.logic} `)})`;
            newConditions.push({
              ...cond,
              conditions: updatedGroupConditions,
              label: newLabel,
            });
          }
        } else {
          newConditions.push(cond);
        }
      }
      return newConditions;
    };

    setConditionList(removeRecursive(conditionList));
  };

  // 入口条件削除のラッパー
  const handleRemoveEntryCondition = (id: string) =>
    handleRemoveCondition(id, entryConditions, setEntryConditions);
  // オプション出口条件削除のラッパー
  const handleRemoveOptionalExitCondition = (id: string) =>
    handleRemoveCondition(
      id,
      optionalExitConditions,
      setOptionalExitConditions
    );

  const setPeriod = (
    period: "lastMonth" | "thisMonth" | "1w" | "2w" | "4w"
  ) => {
    const today = new Date();
    let newStartDate: Date | undefined = startDate;
    let newEndDate: Date | undefined = endDate;

    switch (period) {
      case "lastMonth": {
        const lastMonthDate = subMonths(today, 1);
        newStartDate = startOfMonth(lastMonthDate);
        newEndDate = endOfMonth(lastMonthDate);
        break;
      }
      case "thisMonth":
        newStartDate = startOfMonth(today);
        newEndDate = today;
        break;
      case "1w":
      case "2w":
      case "4w": {
        if (!startDate) {
          showCustomToast({
            message: "期間設定エラー",
            submessage: "まず開始日を選択してください。",
            type: "error",
          });
          return;
        }
        const daysToAdd = period === "1w" ? 7 : period === "2w" ? 14 : 28;
        newEndDate = addDays(startDate, daysToAdd);
        break;
      }
    }
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // グループ化するために選択可能なトップレベル入口条件のリストを取得
  const getAvailableEntryConditionsForGrouping = () => {
    return entryConditions;
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      return;
    }

    // クライアントサイドでの簡易バリデーション
    if (!startDate || !endDate) {
      showCustomToast({
        message: "入力エラー",
        submessage: "シミュレーション期間を選択してください。",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }
    if (stockCodes.length === 0) {
      showCustomToast({
        message: "入力エラー",
        submessage:
          "銘柄コードを入力するか、ポートフォリオから選択してください。",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      showCustomToast({
        message: "入力エラー",
        submessage: "開始日は終了日より前の日付を選択してください。",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    // 入口サイン条件が設定されていない場合のバリデーション
    if (entryConditions.length === 0) {
      showCustomToast({
        message: "入力エラー",
        submessage: "入口サイン条件を少なくとも1つ追加してください。",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    // 基本的な数値入力のバリデーション
    const baseNumberInputs = {
      maxPurchaseAmount,
      minVolume,
      tradeUnit,
      buyFeeRate,
      sellFeeRate,
      taxRate,
      baseExitDays,
      baseExitProfitPercent,
      baseExitStopLossPercent,
    };
    let hasError = false;
    for (const [key, value] of Object.entries(baseNumberInputs)) {
      if (isNaN(value as number) || (value as number) < 0) {
        showCustomToast({
          message: "入力エラー",
          submessage: `${key} は有効な数値を入力してください。`,
          type: "error",
        });
        hasError = true;
        break;
      }
    }
    if (hasError) {
      setIsSubmitting(false);
      return;
    }

    // Helper to flatten conditions for backend submission
    const formatConditionForBackend = (
      condition: DisplayableEntryCondition | DisplayableExitCondition
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any => {
      if ("isGroup" in condition && condition.isGroup) {
        return {
          type: "group",
          logic: condition.logic,
          conditions: condition.conditions.map(formatConditionForBackend),
        };
      } else {
        // idとlabelはバックエンドに送信しないため、未使用でもESLintエラーを抑制
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, label, ...rest } = condition;
        return rest;
      }
    };

    try {
      // 必須出口条件をオブジェクトとして構築
      const fixedExitConditionsBackend: SimpleExitCondition[] = [
        {
          id: "fixed_exit_days_backend",
          type: "fixedDays",
          days: baseExitDays,
          label: `固定: ${baseExitDays}日経過で決済`,
        },
        {
          id: "fixed_exit_profit_backend",
          type: "profitTarget",
          percent: baseExitProfitPercent,
          label: `固定: ${baseExitProfitPercent}%利益で決済`,
        },
        {
          id: "fixed_exit_stop_loss_backend",
          type: "stopLoss",
          percent: baseExitStopLossPercent,
          label: `固定: ${baseExitStopLossPercent}%損切りで決済`,
        },
      ];

      // 全ての出口条件を結合 (必須条件は常にORロジックで結合される想定)
      // バックエンド側でこのリストが評価される
      const allExitConditionsForBackend = [
        ...fixedExitConditionsBackend,
        ...optionalExitConditions,
      ];

      // Server Actionの呼び出しのためのパラメータ構築
      const formattedEntryConditions = entryConditions.map(
        formatConditionForBackend
      );
      const formattedExitConditions = allExitConditionsForBackend.map(
        formatConditionForBackend
      ); // New

      const simulationParams: ISimulationRequestParams = {
        name: "",
        memo: "",
        userId: user?.id,
        stockSelection: {
          name: "",
          memo: "",
          stockCodes: stockCodes,
        },
        simulationPeriod: {
          name: "",
          memo: "",
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        },
        tradeFilter: {
          name: "",
          memo: "",
          maxPurchaseAmount,
          minPurchaseAmount,
          minVolume,
          tradeUnit,
        },

        signs: {
          name: "",
          memo: "",
          // コンポーネントのstate("long" | "short")をDBの型("long" | "short")に変換
          transactionType: transactionType === "short" ? "short" : "long",
          entry_name: "",
          entry_memo: "",
          entry: {
            entryConditions: formattedEntryConditions,
            globalEntryConditionLogic,
          },
          exit_name: "",
          exit_memo: "",
          exit: {
            exitConditions: formattedExitConditions,
          },
        },
        feeTax: {
          name: "",
          memo: "",
          buyFeeRate: buyFeeRate / 100,
          sellFeeRate: sellFeeRate / 100,
          taxRate: taxRate / 100,
        },
      };
      setSimulationParams(simulationParams);

      const result = await registPlan(simulationParams);

      if (result.error) {
        showCustomToast({
          message: "シミュレーションエラー",
          submessage: result.error,
          type: "error",
        });
      } else if (result.simulationId) {
        showCustomToast({
          message: "シミュレーション成功",
          submessage: `シミュレーションID: ${result.simulationId}`,
          type: "success",
        });
        console.log(`シミュレーションID: ${result.simulationId}`);
      }
    } catch (error) {
      console.error("シミュレーション実行中にエラーが発生しました:", error);
      showCustomToast({
        message: "システムエラー",
        submessage: "シミュレーションの実行中に予期せぬエラーが発生しました。",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 日付変更ハンドラ
  const onStartDateChange = (dateString: string) => {
    if (dateString) {
      setStartDate(new Date(`${dateString}T00:00:00`));
    } else {
      setStartDate(undefined);
    }
  };

  const onEndDateChange = (dateString: string) => {
    if (dateString) {
      setEndDate(new Date(`${dateString}T00:00:00`));
    } else {
      setEndDate(undefined);
    }
  };

  const findConditionToEdit = () => {
    if (!editingEntryConditionId) return null;
    const condition = entryConditions.find(
      (c) => !("isGroup" in c) && c.id === editingEntryConditionId
    );
    return (condition as SimpleEntryCondition) || null;
  };

  const findExitConditionToEdit = () => {
    if (!editingOptionalExitConditionId) return null;
    const condition = optionalExitConditions.find(
      (c) => !("isGroup" in c) && c.id === editingOptionalExitConditionId
    );
    return (condition as SimpleExitCondition) || null;
  };

  return (
    <>
      <div className="font-sans flex justify-center items-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-2xl shadow-xl rounded-lg border border-gray-200">
          <div className="flex justify-between items-center ">
            <Link href="/Compass/Condition/List">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                一覧
              </Button>
            </Link>
          </div>{" "}
          <CardHeader className="bg-white p-6 border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-800 text-left">
              プラン設定
            </CardTitle>
            <CardDescription className="text-gray-500 text-left mt-1">
              過去データに基づき、仮説検証のためのプランを作成します。作成後のプランはシミュレーションを行うことができます。
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
                    <Input
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
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPortfolioSelectionModal(true)}
                    className="whitespace-nowrap"
                  >
                    ポートフォリオから選択
                  </Button>
                </div>
              </div>

              {/* シミュレーション期間 */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  シミュレーション期間
                </h3>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex gap-2">
                    {" "}
                    {/* グループ1: 今月、先月 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriod("thisMonth")}
                    >
                      今月
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriod("lastMonth")}
                    >
                      先月
                    </Button>
                  </div>
                  <div className="border-l border-gray-300 h-8 self-center"></div>
                  <div className="flex gap-2">
                    {" "}
                    {/* グループ2: 1週間、2週間、4週間 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriod("1w")}
                    >
                      1週間
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriod("2w")}
                    >
                      2週間
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriod("4w")}
                    >
                      4週間
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDateForm" className="text-gray-700">
                      開始日
                    </Label>
                    <Input
                      id="startDateForm"
                      type="date"
                      value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDateForm" className="text-gray-700">
                      終了日
                    </Label>
                    <Input
                      id="endDateForm"
                      type="date"
                      value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
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
                    <Input
                      id="max-purchase-amount"
                      type="number"
                      value={maxPurchaseAmount}
                      onChange={(e) =>
                        setMaxPurchaseAmount(Number(e.target.value))
                      }
                      min="0"
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="max-purchase-amount"
                      className="text-gray-700"
                    >
                      購入金額下限 (円)
                    </Label>
                    <Input
                      id="max-purchase-amount"
                      type="number"
                      value={minPurchaseAmount}
                      onChange={(e) =>
                        setMinPurchaseAmount(Number(e.target.value))
                      }
                      min="0"
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-volume" className="text-gray-700">
                      出来高下限 (株)
                    </Label>
                    <Input
                      id="min-volume"
                      type="number"
                      value={minVolume}
                      onChange={(e) => setMinVolume(Number(e.target.value))}
                      min="0"
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trade-unit" className="text-gray-700">
                      取引単位 (株)
                    </Label>
                    <Input
                      id="trade-unit"
                      type="number"
                      value={tradeUnit}
                      onChange={(e) => setTradeUnit(Number(e.target.value))}
                      min="1"
                      className="rounded-md"
                    />
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
                  <Select
                    value={transactionType}
                    onValueChange={(value) =>
                      setTransactionType(value as TransactionDirection)
                    }
                  >
                    <SelectTrigger
                      id="transaction-type-select"
                      className="w-full"
                    >
                      <SelectValue placeholder="取引タイプを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">ロング（買い）</SelectItem>
                      <SelectItem value="short">ショート（空売り）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 入口サイン条件 (複数対応 & グループ対応) */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                  入口サイン条件
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={handleAddEntryConditionClick}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md shadow-sm"
                      size="sm"
                    >
                      条件追加
                    </Button>
                    <Button
                      type="button"
                      onClick={handleOpenEntryGroupModal}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded-md shadow-sm" // Changed to handleOpenEntryGroupModal
                      size="sm"
                      disabled={
                        getAvailableEntryConditionsForGrouping().length < 2
                      } // 2つ以上ないとグループ化できない
                    >
                      グループ作成
                    </Button>
                  </div>
                </h3>

                {entryConditions.length > 0 && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="global-entry-condition-logic"
                      className="text-gray-700"
                    >
                      トップレベル条件結合ロジック
                    </Label>
                    <Select
                      value={globalEntryConditionLogic}
                      onValueChange={(value) =>
                        setGlobalEntryConditionLogic(value as "AND" | "OR")
                      }
                    >
                      <SelectTrigger
                        id="global-entry-condition-logic"
                        className="w-full"
                      >
                        <SelectValue placeholder="結合ロジックを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">
                          すべての条件を満たす (AND)
                        </SelectItem>
                        <SelectItem value="OR">
                          いずれかの条件を満たす (OR)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <ul className="border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
                      {entryConditions.map((cond) => (
                        <GenericConditionItem
                          key={cond.id}
                          condition={cond}
                          onRemove={handleRemoveEntryCondition}
                          // グループ化されていない条件のみ編集可能にする
                          onEdit={handleEditEntryCondition}
                          // onEdit={!('isGroup' in cond && cond.isGroup) ? (cond as SimpleEntryCondition extends DisplayableEntryCondition ? SimpleEntryCondition : never) => handleEditEntryCondition(cond as SimpleEntryCondition) : undefined}
                        />
                      ))}
                    </ul>
                  </div>
                )}
                {entryConditions.length === 0 && (
                  <p className="text-sm text-gray-600">
                    「条件追加」ボタンをクリックして、シミュレーションの入口条件を設定してください。複数の条件をまとめる場合は「グループ作成」ボタンを使用します。
                  </p>
                )}
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
                      <Input
                        id="base-exit-days"
                        type="number"
                        value={baseExitDays}
                        onChange={(e) =>
                          setBaseExitDays(Number(e.target.value))
                        }
                        min="0"
                        className="rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="base-exit-profit-percent"
                        className="text-gray-700"
                      >
                        利益率で決済 (%)
                      </Label>
                      <Input
                        id="base-exit-profit-percent"
                        type="number"
                        value={baseExitProfitPercent}
                        onChange={(e) =>
                          setBaseExitProfitPercent(Number(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        className="rounded-md bg-white"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="base-exit-stop-loss-percent"
                        className="text-gray-700"
                      >
                        損切り率で決済 (%)
                      </Label>
                      <Input
                        id="base-exit-stop-loss-percent"
                        type="number"
                        value={baseExitStopLossPercent}
                        onChange={(e) =>
                          setBaseExitStopLossPercent(Number(e.target.value))
                        }
                        step="0.1"
                        min="0"
                        className="rounded-md bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* その他の追加オプション出口条件 */}
                <div className="space-y-2 mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 flex justify-between items-center">
                    追加出口条件 (オプション)
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={handleAddOptionalExitConditionClick}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md shadow-sm"
                        size="sm"
                      >
                        条件追加
                      </Button>
                    </div>
                  </h4>

                  {optionalExitConditions.length > 0 && (
                    <div className="space-y-2">
                      <ul className="border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
                        {optionalExitConditions.map((cond) => (
                          <GenericConditionItem
                            key={cond.id}
                            condition={cond}
                            onRemove={handleRemoveOptionalExitCondition}
                            // グループ化されていない条件のみ編集可能にする
                            onEdit={handleEditOptionalExitCondition}

                            // onEdit={!('isGroup' in cond && cond.isGroup) ? (cond as SimpleExitCondition extends DisplayableExitCondition ? SimpleExitCondition : never) => handleEditOptionalExitCondition(cond as SimpleExitCondition) : undefined}
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                  {optionalExitConditions.length === 0 && (
                    <p className="text-sm text-gray-600">
                      「条件追加」ボタンをクリックして、追加の出口条件を設定してください。
                    </p>
                  )}
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
                    <Input
                      id="buy-fee-rate"
                      type="number"
                      value={buyFeeRate}
                      onChange={(e) => setBuyFeeRate(Number(e.target.value))}
                      step="0.01"
                      min="0"
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sell-fee-rate" className="text-gray-700">
                      売却時手数料率 (%)
                    </Label>
                    <Input
                      id="sell-fee-rate"
                      type="number"
                      value={sellFeeRate}
                      onChange={(e) => setSellFeeRate(Number(e.target.value))}
                      step="0.01"
                      min="0"
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-rate" className="text-gray-700">
                      税率 (%)
                    </Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      step="0.001"
                      min="0"
                      className="rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
                disabled={isSubmitting}
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
                    プラン作成中...
                  </span>
                ) : (
                  "プラン作成"
                )}
              </Button>
            </form>
            {simulationParams && (
              <div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  送信されるパラメータ (JSON)
                </h4>
                <pre className="text-xs bg-white p-3 rounded-md overflow-x-auto">
                  <code>{JSON.stringify(simulationParams, null, 2)}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PlanEntryConditionModal
        isOpen={showAddEntryConditionModal}
        onClose={() => {
          setShowAddEntryConditionModal(false);
          setEditingEntryConditionId(null);
        }}
        onSubmit={handleAddOrUpdateEntryCondition}
        conditionToEdit={findConditionToEdit()}
        transactionType={transactionType}
      />

      <PlanExitConditionModal
        isOpen={showAddExitConditionModal}
        onClose={() => {
          setShowAddExitConditionModal(false);
          setEditingOptionalExitConditionId(null);
        }}
        onSubmit={handleAddOrUpdateOptionalExitCondition}
        conditionToEdit={findExitConditionToEdit()}
        transactionType={transactionType}
      />

      <PlanEntryGroupModal
        isOpen={showGroupEntryConditionModal}
        onClose={() => setShowGroupEntryConditionModal(false)}
        onSubmit={handleAddEntryGroupCondition}
        availableConditions={getAvailableEntryConditionsForGrouping()}
      />
      <PortfolioSelectionModal
        isOpen={showPortfolioSelectionModal}
        onClose={() => setShowPortfolioSelectionModal(false)}
        onSelectPortfolio={handlePortfolioSelectedFromModal}
        currentSelectedPortfolioId={portfolioId}
      />
    </>
  );
}
