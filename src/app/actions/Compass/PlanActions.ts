// app/actions/planActions.ts
"use server";

import { createClient } from "@/util/supabase/server";

// プランデータの型定義 (PostgreSQL関数の戻り値に合わせる)
// 注意: この型定義は get_analysis_conditions_for_display RPC関数の戻り値と一致している必要があります。
// is_active や signal_id が必要であれば、DB関数側も修正してください。
export interface DisplayPlan {
  id: number;
  user_id: string;
  user_name: string;
  plan_name: string;
  plan_memo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stock_selection_id: number;
  stock_selection_name: string | null;
  simulation_period_id: number;
  simulation_period_name: string | null;
  simulation_start_date: string | null;
  simulation_end_date: string | null;
  trade_parameter_id: number;
  trade_parameter_name: string | null;
  signal_id: number | null; // シグナル編集に必須
  signal_name: string | null;
  transaction_type: string | null;
  entry_signal_id: number | null; // シグナル編集に必須
  entry_signal_name: string | null;
  exit_signal_id: number | null; // シグナル編集に必須
  exit_signal_name: string | null;
  fee_tax_id: number | null; // シグナル編集に必須
  fee_tax_name: string | null;
  // 利益率はシミュレーション結果から来るため、ここでは含めないか、別途取得する
  profit_rate?: string; // Placeholder for display
}

/**
 * 表示用の分析計画（プラン）の一覧を取得します。
 * @param userId 特定のユーザーIDでフィルタリング
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

/**
 * シグナル名を更新します。
 * @param signalId 更新対象のspt_signalsテーブルのID
 * @param newName 新しいシグナル名
 * @returns 成功/失敗とエラーメッセージ
 */
export async function updateSignalNameAction(
  signalId: number,
  newName: string
): Promise<{ success: boolean; error: string | null }> {
  if (!signalId) {
    return { success: false, error: "シグナルIDが必要です。" };
  }
  if (!newName || newName.trim().length === 0) {
    return { success: false, error: "シグナル名は空にできません。" };
  }
  console.log("updateSignalNameAction called", signalId, newName);
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("sptch_signals") // シグナルが保存されているテーブル名を指定
      .update({
        name: newName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", signalId);

    if (error) {
      console.error("Error updating signal name:", error.message);
      return {
        success: false,
        error: `シグナル名の更新に失敗しました(テーブル名が見つからない可能性あり。): ${error.message}`,
      };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    let message = "シグナル名の更新中に予期せぬエラーが発生しました。";
    if (err instanceof Error) {
      message = err.message;
    }
    console.error("Unexpected error in updateSignalNameAction:", message);
    return { success: false, error: message };
  }
}

// --- 以下、各設定テーブルからIDで単一レコードを取得するアクション ---

/**
 * 汎用的な単一レコード取得関数
 * @param tableName テーブル名
 * @param id 取得対象のID
 * @param errorContext エラーメッセージに表示する文脈
 * @returns データまたはエラーメッセージ
 */
async function getSingleRecordById<T>(
  tableName: string,
  id: number,
  errorContext: string
): Promise<{ data: T | null; error: string | null }> {
  if (!id) {
    return { data: null, error: "IDが必要です。" };
  }
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        data: null,
        error: `${errorContext}の取得に失敗しました: ${error.message}`,
      };
    }
    return { data, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

// --- 型定義 ---

export interface SimulationPeriod {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface TradeParameter {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  max_purchase_amount: number;
  min_volume: number;
  trade_unit: number;
  condition_json: string;
  value_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  transaction_type: "buy" | "sell";
  entry_signal_id: number;
  exit_signal_id: number;
  created_at: string;
  updated_at: string;
}

export interface EntrySignal {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  conditions_json: string;
  value_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ExitSignal {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  conditions_json: string;
  value_hash: string;
  created_at: string;
  updated_at: string;
}

export interface FeeTax {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  buy_fee_rate: number;
  sell_fee_rate: number;
  tax_rate: number;
  value_hash: string;
  created_at: string;
  updated_at: string;
}

// --- アクション関数 ---

/**
 * 特定のシミュレーション期間を取得します。
 * @param id 取得対象のsptch_simulation_periodsテーブルのID
 */
export async function getSimulationPeriodAction(id: number) {
  return getSingleRecordById<SimulationPeriod>(
    "sptch_simulation_periods",
    id,
    "シミュレーション期間"
  );
}

/**
 * 特定の取引パラメータを取得します。
 * @param id 取得対象のsptch_trade_parametersテーブルのID
 */
export async function getTradeParameterAction(id: number) {
  return getSingleRecordById<TradeParameter>(
    "sptch_trade_parameters",
    id,
    "取引パラメータ"
  );
}

/**
 * 特定のシグナル（売買条件セット）を取得します。
 * @param id 取得対象のsptch_signalsテーブルのID
 */
export async function getSignalAction(id: number) {
  return getSingleRecordById<Signal>("sptch_signals", id, "シグナル");
}

/**
 * 特定のエントリーシグナルを取得します。
 * @param id 取得対象のsptch_entry_signalsテーブルのID
 */
export async function getEntrySignalAction(id: number) {
  return getSingleRecordById<EntrySignal>(
    "sptch_entry_signals",
    id,
    "エントリーシグナル"
  );
}

/**
 * 特定のイグジットシグナルを取得します。
 * @param id 取得対象のsptch_exit_signalsテーブルのID
 */
export async function getExitSignalAction(id: number) {
  return getSingleRecordById<ExitSignal>(
    "sptch_exit_signals",
    id,
    "イグジットシグナル"
  );
}

/**
 * 特定の手数料・税金設定を取得します。
 * @param id 取得対象のsptch_fee_taxesテーブルのID
 */
export async function getFeeTaxAction(id: number) {
  return getSingleRecordById<FeeTax>("sptch_fee_taxes", id, "手数料・税金設定");
}

// sptch_analysis_conditions テーブルの型定義
export interface AnalysisCondition {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  stock_selection_header_id: number;
  simulation_period_id: number;
  trade_parameter_id: number;
  signal_id: number;
  fee_tax_id: number;
  value_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * 特定のプラン（分析条件）の詳細を取得します。
 * @param planId 取得対象のsptch_analysis_conditionsテーブルのID
 * @returns プラン詳細データまたはエラーメッセージ
 */
export async function getPlanDetailsAction(planId: number) {
  return getSingleRecordById<AnalysisCondition>(
    "sptch_analysis_conditions",
    planId,
    "プラン詳細"
  );
}

/**
 * プラン名とメモを更新します。
 * @param planId 更新対象のsptch_analysis_conditionsテーブルのID
 * @param name 新しいプラン名
 * @param memo 新しいメモ
 * @returns 成功/失敗とエラーメッセージ
 */
export async function updatePlanDetailsAction(
  planId: number,
  name: string,
  memo: string | null
): Promise<{ success: boolean; error: string | null }> {
  if (!planId) {
    return { success: false, error: "プランIDが必要です。" };
  }
  if (!name || name.trim().length === 0) {
    return { success: false, error: "プラン名は空にできません。" };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("sptch_analysis_conditions")
      .update({
        name: name.trim(),
        memo: memo ? memo.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (error) {
      return {
        success: false,
        error: `プラン詳細の更新に失敗しました: ${error.message}`,
      };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { success: false, error: message };
  }
}

export interface StockInfo {
  code: string;
  name: string;
}

/**
 * プランに関連するすべての詳細情報を一括で取得するための型定義
 */
export interface PlanDetailsAll {
  plan: AnalysisCondition;
  simulationPeriod: SimulationPeriod | null;
  tradeParameter: TradeParameter | null;
  signal: Signal | null;
  entrySignal: EntrySignal | null;
  exitSignal: ExitSignal | null;
  feeTax: FeeTax | null;
  stockCodes: StockInfo[] | null; // ★追加：銘柄コードのリスト
}

/**
 * 指定されたheader_idに紐づく銘柄情報（コードと名称）のリストを取得します。
 * @param headerId sptch_stock_selections_headerのID
 * @returns 銘柄情報の配列、またはエラーメッセージ
 */

export async function getStockInfoByHeaderId(
  headerId: number
): Promise<{ data: StockInfo[] | null; error: string | null }> {
  if (!headerId) {
    return { data: null, error: "ヘッダーIDが必要です。" };
  }
  const supabase = await createClient();
  try {
    // 1. sptch_stock_selections_stocks から銘柄コードのみを取得
    const { data: selectionStocks, error: selectionError } = await supabase
      .from("sptch_stock_selections_stocks")
      .select("stock_code, order_no") // order_noも取得して後で並び替えに利用
      .eq("header_id", headerId)
      .order("order_no", { ascending: true }); // まずは選択順に取得

    if (selectionError) {
      return {
        data: null,
        error: `選択銘柄コードの取得に失敗しました: ${selectionError.message}`,
      };
    }

    if (!selectionStocks || selectionStocks.length === 0) {
      return { data: [], error: null }; // 選択された銘柄がない場合
    }

    const stockCodes = selectionStocks.map((item) => item.stock_code);

    // 2. 取得した銘柄コードのリストを使って spt_stocks から銘柄名を取得
    const { data: stocksData, error: stocksError } = await supabase
      .from("spt_stocks")
      .select("code, name")
      .in("code", stockCodes); // 複数のコードを一括で指定

    if (stocksError) {
      return {
        data: null,
        error: `銘柄詳細情報の取得に失敗しました: ${stocksError.message}`,
      };
    }

    // 3. 取得した銘柄コードと銘柄名を結合し、StockInfo[] の形式に整形
    // 選択順を保持するために、selectionStocksの順序を利用
    const stockMap = new Map<string, string>();
    stocksData.forEach((stock) => {
      stockMap.set(stock.code, stock.name);
    });

    const stockInfoList: StockInfo[] = selectionStocks.map((selection) => ({
      code: selection.stock_code,
      name: stockMap.get(selection.stock_code) || "Unknown Name", // 銘柄名が見つからない場合のフォールバック
    }));

    return { data: stockInfoList, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

/**
 * 指定されたheader_idに紐づく銘柄コードのリストを取得します。
 * @param headerId sptch_stock_selections_headerのID
 * @returns 銘柄コードの配列、またはエラーメッセージ
 */
export async function getStockCodesByHeaderId(
  headerId: number
): Promise<{ data: string[] | null; error: string | null }> {
  if (!headerId) {
    return { data: null, error: "ヘッダーIDが必要です。" };
  }
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("sptch_stock_selections_stocks")
      .select("stock_code")
      .eq("header_id", headerId)
      .order("order_no", { ascending: true }); // 必要に応じて並び順を指定

    if (error) {
      return {
        data: null,
        error: `銘柄コードの取得に失敗しました: ${error.message}`,
      };
    }
    const stockCodes = data.map((item) => item.stock_code);
    return { data: stockCodes, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

/**
 * プランに関連するすべての詳細情報を一括で取得します。
 * @param planId 取得対象のsptch_analysis_conditionsテーブルのID
 * @returns 関連情報すべてを含むオブジェクトまたはエラーメッセージ
 */
export async function getPlanDetailsAll(
  planId: number
): Promise<{ data: PlanDetailsAll | null; error: string | null }> {
  // 1. 基本となるプラン詳細を取得
  const planResult = await getPlanDetailsAction(planId);
  if (planResult.error || !planResult.data) {
    return {
      data: null,
      error: planResult.error || "プランが見つかりません。",
    };
  }
  const plan = planResult.data;

  // 2. 関連情報を並行して取得
  // 2. 関連情報を並行して取得
  const [
    simulationPeriodResult,
    tradeParameterResult,
    signalResult,
    feeTaxResult,
    stockInfoListResult, // ★追加：銘柄コードの取得
  ] = await Promise.all([
    getSimulationPeriodAction(plan.simulation_period_id),
    getTradeParameterAction(plan.trade_parameter_id),
    getSignalAction(plan.signal_id),
    getFeeTaxAction(plan.fee_tax_id),
    getStockInfoByHeaderId(plan.stock_selection_header_id), // ★追加
  ]);

  // エラーチェック
  const primaryErrors = [
    simulationPeriodResult.error,
    tradeParameterResult.error,
    signalResult.error,
    feeTaxResult.error,
  ].filter((e): e is string => e !== null);

  if (primaryErrors.length > 0) {
    return {
      data: null,
      error: `関連情報の取得に失敗: ${primaryErrors.join(", ")}`,
    };
  }

  // 3. シグナル情報があれば、エントリー/イグジットシグナルも取得
  const signal = signalResult.data;
  const [entrySignalResult, exitSignalResult] = await Promise.all(
    signal
      ? [
          getEntrySignalAction(signal.entry_signal_id),
          getExitSignalAction(signal.exit_signal_id),
        ]
      : [
          Promise.resolve({ data: null, error: null }),
          Promise.resolve({ data: null, error: null }),
        ]
  );

  const signalDetailErrors = [
    entrySignalResult.error,
    exitSignalResult.error,
  ].filter(Boolean);
  if (signalDetailErrors.length > 0) {
    return {
      data: null,
      error: `シグナル詳細の取得に失敗: ${signalDetailErrors.join(", ")}`,
    };
  }
  // console.log(
  //   "planactioncalled.stockCodesResult.data",
  //   stockInfoListResult.data
  // );
  // 4. すべてのデータを一つのオブジェクトにまとめる
  const responseData: PlanDetailsAll = {
    plan,
    simulationPeriod: simulationPeriodResult.data,
    tradeParameter: tradeParameterResult.data,
    signal: signalResult.data,
    entrySignal: entrySignalResult.data,
    exitSignal: exitSignalResult.data,
    feeTax: feeTaxResult.data,
    stockCodes: stockInfoListResult.data, // ★追加
  };

  return { data: responseData, error: null };
}
