//http://192.168.2.100:3000/Execute/Settings/45
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // リダイレクトのために useRouter をインポート

import PlanDisp from "../Compass/PlanDisp"; // 既存の PlanDisp コンポーネントをインポート
import {
  getPlanDetailsAll, // フォームの事前入力のためにプラン詳細を取得
  // PlanDetailsAll,
} from "@/app/actions/Compass/PlanActions";
// import { registerPlanExecution } from "@/app/actions/Compass/ExecutionActions"; // 登録のための Server Action

// shadcn/ui コンポーネントをインポート (assuming they are in '@/components/ui')
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  registerPlanExecutionSetting,
  getExecutionSettingByPlanId,
} from "@/app/actions/Execute/ExecutionDb";

interface ExecuteProps {
  planId: string;
}

const ExecuteSettings = (props: ExecuteProps) => {
  const { planId } = props;
  const router = useRouter();

  // プラン詳細を保持するためのステート (フォームの日付事前入力用)
  // const [planData, setPlanData] = useState<PlanDetailsAll | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 実行設定フォームのステート管理
  const [executionName, setExecutionName] = useState<string>("");
  const [executionStartDate, setExecutionStartDate] = useState<string>("");
  const [executionEndDate, setExecutionEndDate] = useState<string>("");
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(false);
  const [sendMailTo, setSendMailTo] = useState<string>("");

  // プラン詳細を取得し、フォームの日付を事前入力
  useEffect(() => {
    const initializeForm = async () => {
      const numericPlanId = Number(planId);
      if (isNaN(numericPlanId)) {
        setError("無効なプランIDです。");
        return;
      }

      // 1. 既存の実行設定を取得試行
      const { data: existingSetting, error: fetchError } =
        await getExecutionSettingByPlanId(numericPlanId);

      if (fetchError) {
        setError(fetchError);
        // エラーが発生しても、フォールバックして新規作成の準備を続行
      }

      if (existingSetting) {
        // 2. 既存設定があればフォームにセット
        setExecutionName(existingSetting.name);
        setExecutionStartDate(existingSetting.start_date);
        setExecutionEndDate(existingSetting.end_date);
        setIsAutoEnabled(existingSetting.is_auto_enabled);
        setSendMailTo(existingSetting.send_mail_to || "");
      } else {
        // 3. 既存設定がなければ、新規作成のデフォルト値をセット
        // 日付の初期値を設定: 今日から7日間
        const today = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);

        // YYYY-MM-DD 形式にフォーマット
        const formatDate = (date: Date) => date.toISOString().split("T")[0];

        setExecutionStartDate(formatDate(today));
        setExecutionEndDate(formatDate(sevenDaysLater));

        // プラン詳細を取得してプラン名を設定
        const result = await getPlanDetailsAll(numericPlanId);
        setExecutionName(
          result.data?.plan?.name || `実行設定 - プランID: ${planId}`
        );
      }
    };
    initializeForm();
  }, [planId]); // planId が変更されたら再取得

  const handleRegisterExecution = async () => {
    // 基本的なクライアントサイドバリデーション
    if (!executionName.trim()) {
      setError("実行設定名を入力してください。");
      return;
    }
    if (!executionStartDate) {
      setError("開始日を入力してください。");
      return;
    }
    if (!executionEndDate) {
      setError("終了日を入力してください。");
      return;
    }
    if (new Date(executionStartDate) > new Date(executionEndDate)) {
      setError("開始日は終了日より前に設定してください。");
      return;
    }

    setIsSubmitting(true);
    setError(null); // 以前のエラーをクリア

    try {
      const result = await registerPlanExecutionSetting(
        Number(planId),
        executionName,
        executionStartDate,
        executionEndDate,
        isAutoEnabled,
        sendMailTo
      );

      if (result.success && result.executeId) {
        alert(`実行設定が登録されました。実行ID: ${result.executeId}`);
        // 例えば、新しい実行設定の詳細ページにリダイレクト
        router.push(`/Execute/Maintenance`);
      } else {
        setError(result.error || "実行設定の登録に失敗しました。");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">プラン実行設定</h1>

      {/* --- 新しい実行設定フォームのセクション --- */}
      <div className="w-full max-w-2xl shadow-xl rounded-lg border border-gray-200 p-6 bg-white space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">
          新しい実行設定の作成
        </h2>

        <div className="space-y-4">
          {/* 実行設定名 */}
          <div>
            <Label htmlFor="executionName" className="text-gray-700 mb-1">
              実行設定名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="executionName"
              type="text"
              value={executionName}
              onChange={(e) => setExecutionName(e.target.value)}
              placeholder="例: 2024年Q3自動実行プラン"
              className="mt-1"
            />
          </div>

          {/* 実行期間 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="executionStartDate"
                className="text-gray-700 mb-1"
              >
                開始日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="executionStartDate"
                type="date"
                value={executionStartDate}
                onChange={(e) => setExecutionStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="executionEndDate" className="text-gray-700 mb-1">
                終了日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="executionEndDate"
                type="date"
                value={executionEndDate}
                onChange={(e) => setExecutionEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* 自動実行有効化 */}
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="isAutoEnabled"
              checked={isAutoEnabled}
              onCheckedChange={(checked) => setIsAutoEnabled(!!checked)}
            />
            <Label htmlFor="isAutoEnabled" className="text-gray-800">
              自動実行を有効にする
            </Label>
          </div>

          {/* メール送信先 */}
          <div>
            <Label htmlFor="sendMailTo" className="text-gray-700 mb-1">
              結果通知メール送信先 (複数指定はカンマ区切り)
            </Label>
            <Textarea
              id="sendMailTo"
              value={sendMailTo}
              onChange={(e) => setSendMailTo(e.target.value)}
              placeholder="例: user1@example.com, user2@example.com"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        {/* PlanDisp を変更せずにプラン詳細を表示 */}
        <div className="w-full max-w-2xl mb-8">
          {/* PlanDisp に periodVisible プロパティは不要です */}
          <PlanDisp id={planId} periodVisible={false}></PlanDisp>
        </div>

        {/* 登録ボタン */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleRegisterExecution}
            disabled={isSubmitting} // 送信中は無効化
            className="px-6 py-3 text-lg"
          >
            {isSubmitting ? "登録中..." : "このプランで実行設定を登録"}
          </Button>
        </div>

        {/* エラーメッセージ表示 */}
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
      </div>
    </div>
  );
};

export default ExecuteSettings;
