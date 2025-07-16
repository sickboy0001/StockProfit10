// supabase-db.ts
"use server";

import { createClient } from "@/util/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSptStocksCache } from "../Cache/SptStocks";
import { AnalysisCondition } from "./PlanActions";

/**
 * `calculateTradeSummary` 関数の返り値の型定義。
 * シミュレーション結果のサマリー情報を表します。
 */
export interface TradeSummary {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  gross_profit: number;
  gross_loss: number;
  profit_factor: number;
  total_gross_profit_loss: number;
  total_net_profit_loss: number;
}

// シミュレーション結果データの型定義
export interface SimulationResult {
  id: number;
  analysis_condition_id: number; // plan_id から analysis_condition_id に変更
  user_id: string;
  status: "pending" | "running" | "completed" | "failed";
  summary_json: TradeSummary | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  sptch_analysis_conditions: { name: string } | null; // 関連するプラン名
}

/**
 * sptch_simulation_results_trade テーブルの1レコードに対応する型定義
 */
export interface SimulationResultsTrade {
  id: number;
  simulation_result_id: number;
  stock_code: string;
  trade_method: string;
  target_date: string;
  target_close_price: number | null;
  entry_date: string | null;
  entry_close_price: number | null;
  entry_quantity: number | null;
  entry_amount: number | null;
  exit_date: string | null;
  exit_close_price: number | null;
  exit_quantity: number | null;
  exit_amount: number | null;
  gross_profit_amount: number | null;
  gross_profit_rate: number | null;
  net_profit_amount: number | null;
  net_profit_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface SimulationResultsTradeWithName extends SimulationResultsTrade {
  name: string;
}

/**
 * sptch_simulation_results_stocks テーブルの1レコードに対応する型定義
 */
export interface SimulationResultStocks {
  id: number;
  simulation_result_id: number;
  stock_code: string;
  filter_reason: string | null;
  score: number;
  manual_score: number;
  created_at: string;
  updated_at: string;
}

export interface SimulationResultStocksWithName extends SimulationResultStocks {
  name: string;
}

// シミュレーションログデータの型定義 (新しく追加)
export interface SimulationLog {
  id: number;
  simulation_result_id: number;
  step_name: string;
  status: "started" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  details: Record<string, unknown> | null; // JSONB カラムに対応
}

/**
 * シミュレーションログを記録するヘルパー関数
 * @param supabase Supabaseクライアントインスタンス
 * @param simulationResultId シミュレーション結果ID
 * @param stepName ステップ名
 * @param status ステータス ('started', 'completed', 'failed')
 * @param startedAt 開始時刻 (ISO文字列)
 * @param completedAt 完了時刻 (ISO文字列、完了時のみ)
 * @param durationMs 期間 (ミリ秒、完了時のみ)
 * @param details 詳細情報 (JSONB)
 */
export async function recordSimulationLog(
  supabase: SupabaseClient,
  simulationResultId: number,
  stepName: string,
  status: "started" | "completed" | "failed",
  startedAt: string,
  completedAt: string | null = null,
  durationMs: number | null = null,
  details: Record<string, unknown> | null = null
) {
  try {
    const { error: logError } = await supabase
      .from("sptch_simulation_logs")
      .insert({
        simulation_result_id: simulationResultId,
        step_name: stepName,
        status: status,
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: durationMs,
        details: details,
      });

    if (logError) {
      console.warn(
        `Failed to record simulation log for step '${stepName}':`,
        logError.message
      );
    }
  } catch (logCatchError: unknown) {
    const message =
      logCatchError instanceof Error
        ? logCatchError.message
        : "予期せぬログ記録エラーが発生しました。";
    console.warn(
      `Error while recording simulation log for step '${stepName}':`,
      message
    );
  }
}

/**
 * sptch_simulation_results テーブルのレコードを更新するヘルパー関数。
 * @param supabase Supabaseクライアントインスタンス
 * @param simulationResultId 更新するシミュレーション結果のID
 * @param updates 更新するフィールドと値を含むオブジェクト
 */
export async function updateSimulationResult(
  supabase: SupabaseClient,
  simulationResultId: number,
  updates: {
    status?: "pending" | "running" | "completed" | "failed";
    summary_json?: TradeSummary | null;
    result_json?: TradeSummary | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
  }
) {
  try {
    const { error } = await supabase
      .from("sptch_simulation_results")
      .update(updates)
      .eq("id", simulationResultId);

    if (error) {
      console.error(
        `Failed to update simulation result ID ${simulationResultId}:`,
        error.message
      );
      // エラーハンドリングの必要に応じて、ここでエラーをスローするか、ステータスを返す
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "予期せぬシミュレーション結果更新エラーが発生しました。";
    console.error(
      `Error while updating simulation result ID ${simulationResultId}:`,
      message
    );
  }
}

/**
 * シミュレーション結果をIDで取得します。
 * 関連する分析プランの名前も取得します。
 * @param simulationResultId 取得するシミュレーション結果のID
 * @returns シミュレーション結果データまたはエラーを含むオブジェクト
 */
export async function getSimulationResultFromDb(
  simulationResultId: number
): Promise<{ data: SimulationResult | null; error: string | null }> {
  if (!simulationResultId || isNaN(simulationResultId)) {
    return { data: null, error: "シミュレーション結果IDが無効です。" };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("sptch_simulation_results")
      .select(`*, sptch_analysis_conditions ( name )`)
      .eq("id", simulationResultId)
      .single();

    if (error) {
      return { data: null, error: `結果の取得に失敗: ${error.message}` };
    }

    return { data, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

/**
 * 指定されたシミュレーション結果IDのシミュレーションログを取得します。
 * ログは started_at の昇順で並べられます。
 * @param simulationResultId ログを取得するシミュレーション結果のID
 * @returns シミュレーションログの配列またはエラーを含むオブジェクト
 */
export async function getSimulationLogsFromDb(
  simulationResultId: number
): Promise<{ data: SimulationLog[] | null; error: string | null }> {
  if (!simulationResultId || isNaN(simulationResultId)) {
    return { data: null, error: "シミュレーション結果IDが無効です。" };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("sptch_simulation_logs")
      .select("*")
      .eq("simulation_result_id", simulationResultId)
      .order("started_at", { ascending: true }); // ログは開始時刻順に並べる

    if (error) {
      return {
        data: null,
        error: `ログの取得に失敗しました: ${error.message}`,
      };
    }

    return { data, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

/**
 * 指定された分析条件IDに紐づくシミュレーション結果の一覧を取得します。
 * 結果は作成日時の降順（新しいものが先頭）で返されます。
 * @param analysisConditionId 取得対象の分析条件ID
 * @returns シミュレーション結果のリストまたはエラーを含むオブジェクト
 */
export async function getSimulationResultsByAnalysisConditionId(
  analysisConditionId: number
): Promise<{ data: SimulationResult[] | null; error: string | null }> {
  if (!analysisConditionId || isNaN(analysisConditionId)) {
    return { data: null, error: "分析条件IDが無効です。" };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("sptch_simulation_results")
      .select(`*, sptch_analysis_conditions ( name )`) // プラン名も一緒に取得
      .eq("analysis_condition_id", analysisConditionId)
      .order("created_at", { ascending: false }); // 新しいものが先頭

    if (error) {
      return { data: null, error: `結果の取得に失敗: ${error.message}` };
    }

    return { data, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

export async function getResultTradeByResultId(
  resultId: number
): Promise<{ data: SimulationResultsTrade[] | null; error: string | null }> {
  if (!resultId || isNaN(resultId)) {
    return { data: null, error: "分析条件IDが無効です。" };
  }
  // console.log("", "getResultTradeByResultId", resultId);
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("sptch_simulation_results_trade")
      .select(`*`)
      .eq("simulation_result_id", resultId);

    if (error) {
      return {
        data: null,
        error: `結果(トレード)の取得に失敗: ${error.message}`,
      };
    }

    return { data, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

export async function getResultTradeWithNameByResultId(
  resultId: number
): Promise<{
  data: SimulationResultsTradeWithName[] | null;
  error: string | null;
}> {
  if (!resultId || isNaN(resultId)) {
    return { data: null, error: "分析条件IDが無効です。" };
  }

  try {
    // トレード結果と銘柄キャッシュを並行して取得
    const [tradeResultResponse, stocksCache] = await Promise.all([
      getResultTradeByResultId(resultId),
      getSptStocksCache(),
    ]);

    // トレード結果取得でエラーが発生した場合
    if (tradeResultResponse.error) {
      return { data: null, error: tradeResultResponse.error };
    }

    // トレード結果データが存在しない場合
    if (!tradeResultResponse.data) {
      return { data: [], error: null }; // データがない場合は空配列を返す
    }

    // 銘柄キャッシュをMapに変換して高速にアクセスできるようにする
    // getSptStocksCacheが返すオブジェクトの型は { code: string, name: string } を想定
    const stockMap = new Map<string, string>();
    for (const stock of stocksCache) {
      if (stock.code && stock.name) {
        stockMap.set(stock.code, stock.name);
      }
    }

    // トレード結果に銘柄名を追加
    const dataWithNames: SimulationResultsTradeWithName[] =
      tradeResultResponse.data.map((trade) => ({
        ...trade,
        name: stockMap.get(trade.stock_code) || "不明", // 見つからない場合は'不明'とする
      }));

    return { data: dataWithNames, error: null };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "トレード結果と銘柄名の取得中に予期せぬエラーが発生しました。";
    console.error("Error in getResultTradeWithNameByResultId:", message);
    return { data: null, error: message };
  }
}

export async function getResultStockByResultId(
  resultId: number
): Promise<{ data: SimulationResultStocks[] | null; error: string | null }> {
  if (!resultId || isNaN(resultId)) {
    return { data: null, error: "分析条件IDが無効です。" };
  }
  console.log("", "getResultStockByResultId", resultId);
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("sptch_simulation_results_stocks")
      .select(`*`) // プラン名も一緒に取得
      .eq("simulation_result_id", resultId);

    if (error) {
      return {
        data: null,
        error: `結果(トレード)の取得に失敗: ${error.message}`,
      };
    }

    return { data, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

export async function getResultStockWithNameByResultId(
  resultId: number
): Promise<{
  data: SimulationResultStocksWithName[] | null;
  error: string | null;
}> {
  if (!resultId || isNaN(resultId)) {
    return { data: null, error: "分析条件IDが無効です。" };
  }

  try {
    // 銘柄結果と銘柄キャッシュを並行して取得
    const [stockResultResponse, stocksCache] = await Promise.all([
      getResultStockByResultId(resultId),
      getSptStocksCache(),
    ]);

    // 銘柄結果取得でエラーが発生した場合
    if (stockResultResponse.error) {
      return { data: null, error: stockResultResponse.error };
    }

    // 銘柄結果データが存在しない場合
    if (!stockResultResponse.data) {
      return { data: [], error: null }; // データがない場合は空配列を返す
    }

    // 銘柄キャッシュをMapに変換して高速にアクセスできるようにする
    const stockMap = new Map<string, string>();
    for (const stock of stocksCache) {
      if (stock.code && stock.name) {
        stockMap.set(stock.code, stock.name);
      }
    }

    // 銘柄結果に銘柄名を追加
    const dataWithNames: SimulationResultStocksWithName[] =
      stockResultResponse.data.map((stock) => ({
        ...stock,
        name: stockMap.get(stock.stock_code) || "不明", // 見つからない場合は'不明'とする
      }));

    return { data: dataWithNames, error: null };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "銘柄結果と銘柄名の取得中に予期せぬエラーが発生しました。";
    console.error("Error in getResultStockWithNameByResultId:", message);
    return { data: null, error: message };
  }
}

export async function getResultLogByResultId(
  resultId: number
): Promise<{ data: SimulationLog[] | null; error: string | null }> {
  if (!resultId || isNaN(resultId)) {
    return { data: null, error: "分析条件IDが無効です。" };
  }
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("sptch_simulation_logs")
      .select(`*`)
      .eq("simulation_result_id", resultId)
      .order("started_at", { ascending: true });

    if (error) {
      return {
        data: null,
        error: `結果(ログ)の取得に失敗: ${error.message}`,
      };
    }

    return { data, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return { data: null, error: message };
  }
}

/**
 * sptch_analysis_conditions テーブルからユーザーIDを取得するヘルパー関数。
 * @param supabase Supabaseクライアントインスタンス
 * @param analysisConditionId 分析条件のID
 * @returns ユーザーIDまたはエラーを含むオブジェクト
 */
export async function getAnalysisConditionUserId(
  supabase: SupabaseClient,
  analysisConditionId: number
): Promise<{ userId: string | null; error: string | null }> {
  try {
    const { data: planData, error: planError } = await supabase
      .from("sptch_analysis_conditions")
      .select("user_id")
      .eq("id", analysisConditionId)
      .single();

    if (planError || !planData) {
      return {
        userId: null,
        error: `プランの取得に失敗しました: ${
          planError?.message || "Not found"
        }`,
      };
    }
    return { userId: planData.user_id, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "分析条件のユーザーID取得中に予期せぬエラーが発生しました。";
    console.error("Error in getAnalysisConditionUserId:", message);
    return { userId: null, error: message };
  }
}

/**
 * 指定された分析条件IDに関連するすべてのシミュレーション結果データを削除します。
 * これには、結果、ログ、フィルタリングされた銘柄、個々の取引、サマリーが含まれます。
 * @param supabase Supabaseクライアントインスタンス
 * @param analysisConditionId 削除対象の分析条件ID
 * @returns エラー情報を含むオブジェクト
 */
export async function deleteSimulationResult(
  supabase: SupabaseClient,
  simulationResultId: number
): Promise<{ error: string | null }> {
  // 関連するテーブルから過去のシミュレーションデータを削除
  // これらは並列で実行可能
  const deletePromises = [
    // supabase
    //   .from("sptch_simulation_results_stocks")
    //   .delete()
    //   .eq("simulation_result_id", simulationResultId),
    // supabase
    //   .from("sptch_simulation_results_trade")
    //   .delete()
    //   .eq("simulation_result_id", simulationResultId),
    // supabase
    //   .from("sptch_simulation_results_summary")
    //   .delete()
    //   .eq("simulation_result_id", simulationResultId),
    // // sptch_simulation_results を削除すると、ON DELETE CASCADE により sptch_simulation_logs も削除される想定
    supabase
      .from("sptch_simulation_results")
      .delete()
      .eq("simulation_result_id", simulationResultId),
  ];

  try {
    const results = await Promise.all(deletePromises);

    // 各Promiseの結果をチェックし、エラーがあれば集約
    const errors = results
      .map((res) => res.error)
      .filter((error): error is NonNullable<typeof error> => error !== null);

    if (errors.length > 0) {
      const errorMessages = errors.map((e) => e.message).join("\\n");
      console.error(
        `Failed to delete old simulation data for analysisConditionId ${simulationResultId}:`,
        errorMessages
      );
      return {
        error: `過去のシミュレーションデータの削除に失敗しました: ${errorMessages}`,
      };
    }

    console.log(
      `Successfully deleted old simulation data for analysisConditionId: ${simulationResultId}`
    );
    return { error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "過去データの削除中に予期せぬエラーが発生しました。";
    console.error(
      `Unexpected error while deleting old simulation data for analysisConditionId ${simulationResultId}:`,
      message
    );
    return { error: message };
  }
}

/**
 * sptch_simulation_results に新しいレコードを作成するヘルパー関数。
 * @param supabase Supabaseクライアントインスタンス
 * @param analysisConditionId 分析条件ID
 * @param userId ユーザーID
 * @returns 作成されたシミュレーション結果のIDまたはエラーを含むオブジェクト
 */
export async function createSimulationResultEntry(
  supabase: SupabaseClient,
  analysisConditionId: number,
  userId: string
): Promise<{ simulationResultId: number | null; error: string | null }> {
  try {
    const { data: resultData, error: insertError } = await supabase
      .from("sptch_simulation_results")
      .insert({
        analysis_condition_id: analysisConditionId,
        user_id: userId,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create simulation result record:", insertError);
      return {
        simulationResultId: null,
        error: `シミュレーションの開始に失敗しました: ${insertError.message}`,
      };
    }
    return { simulationResultId: resultData.id, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "シミュレーション結果エントリの作成中に予期せぬエラーが発生しました。";
    console.error("Error in createSimulationResultEntry:", message);
    return { simulationResultId: null, error: message };
  }
}

/**
 * シミュレーション結果から分析条件IDを取得するヘルパー関数。
 * @param supabase Supabaseクライアントインスタンス
 * @param simulationResultId シミュレーション結果ID
 * @returns 分析条件IDまたはエラーを含むオブジェクト
 */
export async function getAnalysisConditionIdFromSimulationResult(
  supabase: SupabaseClient,
  simulationResultId: number
): Promise<{ analysisConditionId: number | null; error: string | null }> {
  try {
    const { data: resultData, error: resultError } = await supabase
      .from("sptch_simulation_results")
      .select("analysis_condition_id")
      .eq("id", simulationResultId)
      .single();

    if (resultError || !resultData) {
      return {
        analysisConditionId: null,
        error: `シミュレーション結果の取得に失敗しました: ${
          resultError?.message || "Not found"
        }`,
      };
    }
    return {
      analysisConditionId: resultData.analysis_condition_id,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "シミュレーション結果から分析条件IDを取得中に予期せぬエラーが発生しました。";
    console.error(
      "Error in getAnalysisConditionIdFromSimulationResult:",
      message
    );
    return { analysisConditionId: null, error: message };
  }
}

/**
 * sptch_analysis_conditions テーブルから分析条件の詳細を取得するヘルパー関数。
 * @param supabase Supabaseクライアントインスタンス
 * @param analysisConditionId 分析条件ID
 * @returns 分析条件の詳細データまたはエラーを含むオブジェクト
 */
export async function getAnalysisConditionDetails(
  supabase: SupabaseClient,
  analysisConditionId: number
): Promise<{ data: AnalysisCondition | null; error: string | null }> {
  try {
    const { data: conditionData, error: conditionError } = await supabase
      .from("sptch_analysis_conditions")
      .select("*") // 必要に応じて必要なカラムのみ選択
      .eq("id", analysisConditionId)
      .single();

    if (conditionError || !conditionData) {
      return {
        data: null,
        error: `分析条件の取得に失敗しました: ${
          conditionError?.message || "Not found"
        }`,
      };
    }
    return { data: conditionData, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "分析条件の詳細取得中に予期せぬエラーが発生しました。";
    console.error("Error in getAnalysisConditionDetails:", message);
    return { data: null, error: message };
  }
}

/**
 * `sptch_simulation_results_stocks` テーブルに挿入するデータの型定義。
 */
interface InsertSimulationStock {
  simulation_result_id: number;
  stock_code: string;
  filter_reason: string | null;
  score: number;
}

/**
 * シミュレーション対象銘柄のフィルタリング結果をDBに記録します。
 * @param supabase Supabaseクライアントインスタンス
 * @param stocksToInsert 登録する銘柄データの配列
 */
export async function recordSimulationStocks(
  supabase: SupabaseClient,
  stocksToInsert: InsertSimulationStock[]
) {
  if (stocksToInsert.length === 0) {
    return; // 登録データがなければ何もしない
  }

  const { error } = await supabase
    .from("sptch_simulation_results_stocks")
    .insert(stocksToInsert);

  if (error) {
    console.error("Failed to insert simulation stocks:", error);
    // エラーハンドリング。ここではエラーをスローして処理を中断させる。
    throw new Error(
      `シミュレーション対象銘柄の記録に失敗しました: ${error.message}`
    );
  }
}

/**
 * 個々の注文約定情報を表すインターフェース
 */
export interface OrderFill {
  trade_date: string;
  close_price: number; //　株価
  quantity: number; //量　株数
  amount: number; //合計
}

/**
 * 個々のトレード全体の記録を表すインターフェース
 * エントリーからエグジットまでの一連の取引とその損益情報を含む
 */
export interface TradeRecord {
  stock_code: string;
  trade_method: string; // long short 買い　売り
  target_date: string; // 基準日、　entry_tradeのtrade_dateと同じ
  target_close_price: string; // 基準日前日でのクローズの金額
  entry_trade: OrderFill; //エントリー
  exit_trade: OrderFill; //エグジット
  gross_profit_amount: number; //税引前の利益金額
  gross_profit_rate: number; //税引前の利益率
  net_profit_amount: number; //税引後の利益金額
  net_profit_rate: number; //税引後の利益率
}

/**
 * 個別のトレードシミュレーション結果をDBに記録します。
 * @param supabase Supabaseクライアントインスタンス
 * @param analysisConditionId 分析条件ID
 * @param tradeRecord 記録するトレードデータ
 */
export async function recordTradeResult(
  supabase: SupabaseClient,
  simulationResultId: number,
  tradeRecord: TradeRecord
) {
  const {
    stock_code,
    trade_method,
    target_date,
    target_close_price,
    entry_trade,
    exit_trade,
    gross_profit_amount,
    gross_profit_rate,
    net_profit_amount,
    net_profit_rate,
  } = tradeRecord;

  const { error } = await supabase
    .from("sptch_simulation_results_trade")
    .insert({
      simulation_result_id: simulationResultId,
      stock_code,
      trade_method,
      target_date,
      target_close_price: parseFloat(target_close_price),
      entry_date: entry_trade.trade_date,
      entry_close_price: entry_trade.close_price,
      entry_quantity: entry_trade.quantity,
      entry_amount: entry_trade.amount,
      exit_date: exit_trade.trade_date,
      exit_close_price: exit_trade.close_price,
      exit_quantity: exit_trade.quantity,
      exit_amount: exit_trade.amount,
      gross_profit_amount,
      gross_profit_rate,
      net_profit_amount,
      net_profit_rate,
    });

  if (error) {
    console.error("Failed to record trade result:", error);
    throw new Error(`トレード結果の記録に失敗しました: ${error.message}`);
  }
}
