// app/actions/planActions.ts
"use server";

import { createClient } from "@/util/supabase/server"; // Supabaseサーバーサイドクライアントのインポート

// プランデータの型定義 (PostgreSQL関数の戻り値に合わせる)
export interface DisplayPlan {
  id: number; // BIGINTはTypeScriptではnumberとして扱われることが多い
  user_id: string; // UUID
  user_name: string;
  plan_name: string;
  plan_memo: string | null;
  deleted_at: string | null; // is_activeの代わりにdeleted_atを使用
  created_at: string;
  updated_at: string;
  stock_selection_name: string | null;
  simulation_period_name: string | null;
  simulation_start_date: string | null;
  simulation_end_date: string | null;
  trade_parameter_name: string | null;
  signal_name: string | null;
  transaction_type: string | null;
  entry_signal_name: string | null;
  exit_signal_name: string | null;
  fee_tax_name: string | null;
  // 利益率はシミュレーション結果から来るため、ここでは含めないか、別途取得する
  profit_rate?: string; // Placeholder for display
}

/**
 * 分析計画（プラン）の一覧を取得します。
 * @param showDeleted 削除済みプランも表示するかどうか
 * @param userId オプション: 特定のユーザーIDでフィルタリング
 * @returns プランのリスト
 */
export async function getPlansForDisplay(
  userId: string | null = null
): Promise<DisplayPlan[]> {
  const supabase = await createClient(); // サーバーサイドクライアントを初期化

  const { data, error } = await supabase.rpc(
    "get_analysis_conditions_for_display",
    {
      p_user_id: userId,
    }
  );

  if (error) {
    console.error("Error fetching plans from server action:", error);
    throw new Error(`プランの取得に失敗しました: ${error.message}`);
  }
  return data;
}
