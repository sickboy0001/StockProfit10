"use server";

import { createClient } from "@/util/supabase/server";

interface RegisterExecutionResult {
  success: boolean;
  executeId?: number;
  error?: string;
}

/**
 * 新しいプラン実行設定をデータベースに登録します。
 * @param planId 関連付けられる分析条件ID
 * @param name 実行設定の名前
 * @param startDate 実行期間の開始日
 * @param endDate 実行期間の終了日
 * @param isAutoEnabled 自動実行が有効かどうか
 * @param sendMailTo 結果通知メールの送信先（カンマ区切り、任意）
 * @returns 登録成功の場合はexecuteId、失敗の場合はエラーを含むオブジェクト
 */
export async function registerPlanExecutionSetting(
  planId: number,
  name: string,
  startDate: string, // YYYY-MM-DD 形式を想定
  endDate: string, // YYYY-MM-DD 形式を想定
  isAutoEnabled: boolean,
  sendMailTo: string | null // 空文字列の場合は Supabase に NULL として登録されます
): Promise<RegisterExecutionResult> {
  // 入力値の基本的なバリデーション
  if (!planId || isNaN(planId)) {
    return { success: false, error: "プランIDが無効です。" };
  }
  if (!name || name.trim() === "") {
    return { success: false, error: "実行設定名が必要です。" };
  }
  if (!startDate || !endDate) {
    return { success: false, error: "実行期間の開始日と終了日が必要です。" };
  }
  if (new Date(startDate) > new Date(endDate)) {
    return {
      success: false,
      error: "開始日は終了日より前に設定してください。",
    };
  }

  const supabase = await createClient(); // Supabase クライアントの初期化

  try {
    // 関連する analysis_condition_id が存在するかどうかを確認 (オプション)
    // 外部キー制約があれば不要かもしれませんが、念のため。
    const { data: planCheck, error: planCheckError } = await supabase
      .from("sptch_analysis_conditions")
      .select("id")
      .eq("id", planId)
      .single();

    if (planCheckError || !planCheck) {
      // エラーの種類に応じてメッセージを調整
      if (planCheckError && planCheckError.code === "PGRST116") {
        // 例えば、行が見つからないエラーコード
        return { success: false, error: "指定されたプランIDは存在しません。" };
      }
      return {
        success: false,
        error: `プランIDの確認に失敗しました: ${planCheckError?.message || "不明なエラー"}`,
      };
    }

    console.log("registerPlanExecutionSetting:start");
    // sptce_plan_execution_settings テーブルに挿入または更新 (Upsert)
    const { data, error } = await supabase
      .from("sptce_plan_execution_settings")
      .upsert(
        {
          analysis_condition_id: planId,
          name: name,
          start_date: startDate,
          end_date: endDate,
          is_auto_enabled: isAutoEnabled,
          is_active: true, // 既存のレコードもアクティブに設定
          send_mail_to: sendMailTo === "" ? null : sendMailTo,
        },
        {
          onConflict: "analysis_condition_id", // planId (analysis_condition_id) が重複した場合
        }
      )
      .select("id") // 挿入または更新された行の id を取得
      .single();

    if (error) {
      console.error("Supabase 登録/更新エラー:", error);
      return {
        success: false,
        error: `実行設定の登録/更新に失敗しました: ${error.message}`,
      };
    }

    if (data) {
      return { success: true, executeId: data.id };
    } else {
      // この分岐は通常起こらないはずですが、念のため
      return {
        success: false,
        error: "実行設定の登録/更新後、IDが取得できませんでした。",
      };
    }
  } catch (err) {
    console.error("registerPlanExecutionSetting の予期せぬエラー:", err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "サーバー側で予期せぬエラーが発生しました。",
    };
  }
}
