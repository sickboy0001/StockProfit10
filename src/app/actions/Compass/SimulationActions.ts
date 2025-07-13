// simulation-actions.ts
"use server";

import { createClient } from "@/util/supabase/server";
import {
  recordSimulationLog,
  updateSimulationResult,
  getSimulationResultFromDb,
  getSimulationLogsFromDb,
  SimulationResult,
  SimulationLog,
  getAnalysisConditionUserId,
  createSimulationResultEntry,
  getAnalysisConditionDetails,
  TradeRecord,
  TradeSummary,
  //  deleteSimulationResult,
} from "./simulationDb"; // 新しいファイルからインポート
import { runSimulation } from "./simulationService";

/**
 * 取引履歴からサマリー情報を計算する
 * @param trades 取引履歴の配列
 * @returns 計算されたサマリー情報
 */
function calculateTradeSummary(trades: TradeRecord[]): TradeSummary {
  if (!trades || trades.length === 0) {
    return {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      gross_profit: 0,
      gross_loss: 0, //総損失：損失の合計
      profit_factor: 0, //総利益が総損失の何倍か
      total_gross_profit_loss: 0, // 課税前損益
      total_net_profit_loss: 0, // 課税後損益 (最終損益)
    };
    /*
    1より大きい: 総利益が総損失を上回っており、戦略全体で利益が出ていることを意味します。
    数値が大きいほど、効率の良い戦略と言えます。
    1に等しい: 総利益と総損失が同額で、損益がゼロ（ブレークイーブン）であることを意味します。
    1より小さい: 総損失が総利益を上回っており、戦略全体で損失が出ていることを意味します。
   */
  }

  const total_trades = trades.length;
  const winning_trades_list = trades.filter(
    (trade) => (trade.gross_profit_amount ?? 0) > 0
  );
  const losing_trades_list = trades.filter(
    (trade) => (trade.gross_profit_amount ?? 0) < 0
  );

  const winning_trades = winning_trades_list.length;

  const win_rate = total_trades > 0 ? (winning_trades / total_trades) * 100 : 0;

  const gross_profit = winning_trades_list.reduce(
    (sum, trade) => sum + (trade.gross_profit_amount ?? 0),
    0
  );

  const gross_loss = losing_trades_list.reduce(
    (sum, trade) => sum + (trade.gross_profit_amount ?? 0),
    0
  );

  const profit_factor =
    gross_loss !== 0 ? Math.abs(gross_profit / gross_loss) : 0;

  const total_gross_profit_loss = trades.reduce(
    (sum, trade) => sum + (trade.gross_profit_amount ?? 0),
    0
  );

  const total_net_profit_loss = trades.reduce(
    (sum, trade) => sum + (trade.net_profit_amount ?? 0),
    0
  );

  return {
    total_trades,
    winning_trades,
    losing_trades: losing_trades_list.length,
    win_rate,
    gross_profit, // 勝ちトレードの利益合計
    gross_loss: Math.abs(gross_loss), // 負けトレードの損失合計 (正数)
    profit_factor,
    total_gross_profit_loss, // 課税前損益
    total_net_profit_loss, // 課税後損益 (最終損益)
  };
}

/**
 * 実際の分析とシミュレーション作業を実行する関数。
 * この関数は、initiateSimulationEntry から呼び出されます。
 * @param simulationResultId シミュレーション結果ID
 * @returns 成功した場合は { success: true, summary: any }、失敗した場合は { success: false, error: string }
 */
export async function InitialSimulationAnalyse(
  simulationResultId: number,
  analysisConditionId: number
): Promise<{ success: boolean; summary?: TradeSummary; error?: string }> {
  const supabase = await createClient();
  const startTime = new Date(); // シミュレーション開始時刻

  // シミュレーション結果のステータスを 'running' に更新
  await updateSimulationResult(supabase, simulationResultId, {
    status: "running",
    started_at: startTime.toISOString(),
  });

  await recordSimulationLog(
    supabase,
    simulationResultId,
    "analysis_started",
    "started",
    startTime.toISOString(),
    null,
    null,
    {
      message: "分析処理を開始しました。",
      analysisConditionId: analysisConditionId,
    }
  );

  try {
    // 1. 分析条件の詳細を取得 (ここではダミーデータとして扱う)
    const step2StartTime = new Date();
    await recordSimulationLog(
      supabase,
      simulationResultId,
      "fetching_analysis_details",
      "started",
      step2StartTime.toISOString(),
      null,
      null,
      { message: "分析条件の詳細を取得中..." }
    );

    const { data: conditionData, error: conditionError } =
      await getAnalysisConditionDetails(supabase, analysisConditionId);

    if (conditionError || !conditionData) {
      const errorMessage = `分析条件の取得に失敗しました: ${conditionError}`;
      await recordSimulationLog(
        supabase,
        simulationResultId,
        "fetching_analysis_details",
        "failed",
        step2StartTime.toISOString(),
        new Date().toISOString(),
        new Date().getTime() - step2StartTime.getTime(),
        { error: errorMessage }
      );
      await updateSimulationResult(supabase, simulationResultId, {
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });
      return { success: false, error: errorMessage };
    }
    await recordSimulationLog(
      supabase,
      simulationResultId,
      "fetching_analysis_details",
      "completed",
      step2StartTime.toISOString(),
      new Date().toISOString(),
      new Date().getTime() - step2StartTime.getTime(),
      { condition: conditionData, message: "分析条件の詳細を取得しました。" }
    );

    // 2. 実際のシミュレーション/分析ロジック (ダミーの待機処理)
    const step3StartTime = new Date();
    await recordSimulationLog(
      supabase,
      simulationResultId,
      "performing_simulation",
      "started",
      step3StartTime.toISOString(),
      null,
      null,
      { message: "シミュレーションを実行中..." }
    );

    // 新しいsimulationServiceを呼び出してシミュレーションを実行
    // この中で株価取得、simulateTradesの呼び出し、取引履歴の保存が行われる
    const { summary: simulationSummary, trades } = await runSimulation(
      supabase,
      analysisConditionId,
      simulationResultId
    );

    await recordSimulationLog(
      supabase,
      simulationResultId,
      "performing_simulation",
      "completed",
      step3StartTime.toISOString(),
      new Date().toISOString(),
      new Date().getTime() - step3StartTime.getTime(),
      {
        summary: simulationSummary,
        message: `シミュレーションが完了しました。取引回数: ${trades.length}回`,
      }
    );

    // 取引履歴からサマリーを計算
    const calculatedSummary = calculateTradeSummary(trades);

    // 3. 結果を sptch_simulation_results に保存
    const completedTime = new Date();
    await updateSimulationResult(supabase, simulationResultId, {
      status: "completed",
      // runSimulation から返される summary はログ用の一時的なものとし、
      // DBには計算したサマリーを保存する
      summary_json: calculatedSummary,
      result_json: calculatedSummary, // result_json にも同じサマリー情報を保存
      completed_at: completedTime.toISOString(),
    });

    await recordSimulationLog(
      supabase,
      simulationResultId,
      "analysis_completed",
      "completed",
      startTime.toISOString(),
      completedTime.toISOString(),
      completedTime.getTime() - startTime.getTime(),
      {
        message: "分析処理が正常に完了しました。",
        final_summary: calculatedSummary,
      }
    );

    return { success: true, summary: calculatedSummary };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "シミュレーション分析中に予期せぬエラーが発生しました。";
    console.error("Error in InitialSimulationAnalyse:", errorMessage);

    const failedTime = new Date();
    await recordSimulationLog(
      supabase,
      simulationResultId,
      "analysis_failed",
      "failed",
      startTime.toISOString(),
      failedTime.toISOString(),
      failedTime.getTime() - startTime.getTime(),
      { error: errorMessage, message: "分析処理が失敗しました。" }
    );

    // エラー発生時はシミュレーション結果を 'failed' に更新
    await updateSimulationResult(supabase, simulationResultId, {
      status: "failed",
      error_message: errorMessage,
      completed_at: failedTime.toISOString(),
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * シミュレーションの開始をトリガーするアクション。
 * initiateSimulationEntry を呼び出し、シミュレーション結果レコードを作成し、
 * その後、実際の分析処理 (InitialSimulationAnalyse) を開始します。
 * @param analysisConditionId 分析条件ID
 * @returns 成功した場合は { success: true, simulationResultId: number }、失敗した場合は { success: false, error: string }
 */
export async function initiateSimulationAction(
  analysisConditionId: number
): Promise<{
  success: boolean;
  simulationResultId?: number;
  error?: string;
}> {
  // initiateSimulationEntry を呼び出すように変更
  return initiateSimulationEntry(analysisConditionId);
}

/**
 * シミュレーション実行を開始し、結果レコードを作成します。
 * その後、実際のシミュレーション処理 (InitialSimulationAnalyse) を呼び出します。
 * @param analysisConditionId 分析条件ID
 * @returns 成功した場合は { success: true, simulationResultId: number }、失敗した場合は { success: false, error: string }
 */
export async function initiateSimulationEntry(
  analysisConditionId: number
): Promise<{
  success: boolean;
  simulationResultId?: number;
  error?: string;
}> {
  if (!analysisConditionId) {
    return { success: false, error: "分析プランIDが必要です。" };
  }

  const supabase = await createClient();

  try {
    // 1. 分析条件のユーザーIDを取得
    const { userId, error: planError } = await getAnalysisConditionUserId(
      supabase,
      analysisConditionId
    );

    if (planError || !userId) {
      return {
        success: false,
        error: `プランの取得に失敗しました: ${planError}`,
      };
    }
    // // 既存データの削除
    // const { error: deleteError } = await deleteSimulationResult(
    //   supabase,
    //   analysisConditionId
    // );
    // if (deleteError) {
    //   console.error(
    //     "Failed to delete existing simulation result record:",
    //     deleteError
    //   );
    //   return {
    //     success: false,
    //     error: `シミュレーションの開始に失敗しました: ${deleteError}`,
    //   };
    // }

    // 2. sptch_simulation_results に新しいレコードを作成 (status: "pending")
    const { simulationResultId, error: insertError } =
      await createSimulationResultEntry(supabase, analysisConditionId, userId);

    if (insertError || !simulationResultId) {
      console.error("Failed to create simulation result record:", insertError);
      return {
        success: false,
        error: `シミュレーションの開始に失敗しました: ${insertError}`,
      };
    }

    // 3. 'simulation_initiated' ステップのログを記録
    await recordSimulationLog(
      supabase,
      simulationResultId,
      "simulation_initiated",
      "completed",
      new Date().toISOString(),
      new Date().toISOString(),
      0,
      { message: "シミュレーションが初期化されました。" }
    );

    // 4. InitialSimulationAnalyse を呼び出して実際の分析を開始
    const analyseResult = await InitialSimulationAnalyse(
      simulationResultId,
      analysisConditionId
    );

    if (!analyseResult.success) {
      // InitialSimulationAnalyse が失敗した場合、エラーを返す
      return {
        success: false,
        simulationResultId: simulationResultId, // 失敗してもIDは返す
        error: analyseResult.error || "分析処理が失敗しました。",
      };
    }

    // InitialSimulationAnalyse が成功した場合
    return { success: true, simulationResultId: simulationResultId };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "シミュレーションの開始中に予期せぬエラーが発生しました。";
    console.error("Error in initiateSimulationEntry:", message);
    return { success: false, error: message };
  }
}

/**
 * シミュレーション結果をIDで取得します。
 * 関連する分析プランの名前も取得します。
 * @param simulationResultId 取得するシミュレーション結果のID
 * @returns シミュレーション結果データまたはエラーを含むオブジェクト
 */
export async function getSimulationResultAction(
  simulationResultId: number
): Promise<{ data: SimulationResult | null; error: string | null }> {
  return getSimulationResultFromDb(simulationResultId);
}

/**
 * 指定されたシミュレーション結果IDのシミュレーションログを取得します。
 * ログは started_at の昇順で並べられます。
 * @param simulationResultId ログを取得するシミュレーション結果のID
 * @returns シミュレーションログの配列またはエラーを含むオブジェクト
 */
export async function getSimulationLogsAction(
  simulationResultId: number
): Promise<{ data: SimulationLog[] | null; error: string | null }> {
  return getSimulationLogsFromDb(simulationResultId);
}
