// simulationRegistData.ts
"use server";

import { SupabaseClient } from "@supabase/supabase-js"; // SupabaseClientの型をインポート
import { generateHash } from "@/lib/crypto";
import { ISimulationRequestParams } from "@/types/simulation";
// サーバーアクションであることを示す
import { createClient } from "@/util/supabase/server";
/**
 * シミュレーション関連の引数をデータベースに登録します。
 * @param supabase Supabaseクライアントインスタンス
 * @param userId ユーザーID
 * @param params シミュレーションリクエストのパラメータ
 * @returns 登録されたanalysisConditionId、またはエラーメッセージ
 */

// 汎用ヘルパー関数：ハッシュとユーザーIDに基づいてレコードを取得または作成する
async function getOrCreateRecord(
  supabase: SupabaseClient, // SupabaseClientの型を適切に指定
  tableName: string,
  userId: string,
  valueHash: string,
  insertData: Record<string, unknown> // 挿入するデータ
): Promise<number> {
  const { data: existingRecord } = await supabase
    .from(tableName)
    .select("id")
    .eq("value_hash", valueHash)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingRecord) {
    return existingRecord.id;
  } else {
    const dataToInsert = { ...insertData }; // insertDataを直接変更しないようにコピー
    if (dataToInsert.name === null || dataToInsert.name === undefined) {
      dataToInsert.name = "";
    }
    if (dataToInsert.memo === null || dataToInsert.memo === undefined) {
      dataToInsert.memo = "";
    }

    const { data: newRecordData } = await supabase
      .from(tableName)
      .insert(dataToInsert) // 修正したデータを使用
      .select("id")
      .single()
      .throwOnError();
    return newRecordData.id;
  }
}

// ヘルパー関数：銘柄選択条件 (sptch_stock_selections_header & sptch_stock_selections_stocks)
async function getOrCreateStockSelection(
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams
): Promise<number> {
  const stockSelectionInput = [userId, params.stockSelection.stockCodes];
  const stockSelection_value_hash = generateHash(stockSelectionInput);

  const { data: existingHeader } = await supabase
    .from("sptch_stock_selections_header")
    .select("id")
    .eq("value_hash", stockSelection_value_hash)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingHeader) {
    return existingHeader.id;
  } else {
    const { data: newHeaderData } = await supabase
      .from("sptch_stock_selections_header")
      .insert({
        user_id: userId,
        name: params.stockSelection.name,
        memo: params.stockSelection.memo,
        value_hash: stockSelection_value_hash,
      })
      .select("id")
      .single()
      .throwOnError();
    const stockSelectionHeaderId = newHeaderData.id;

    const stockStocksToInsert = params.stockSelection.stockCodes.map(
      (code, index) => ({
        header_id: stockSelectionHeaderId,
        order_no: index,
        stock_code: code,
      })
    );
    await supabase
      .from("sptch_stock_selections_stocks")
      .insert(stockStocksToInsert)
      .throwOnError();
    return stockSelectionHeaderId;
  }
}

// ヘルパー関数：シミュレーション期間 (sptch_simulation_periods)
async function getOrCreateSimulationPeriod(
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams
): Promise<number> {
  const simulationPeriodsHashInput = [
    userId,
    params.simulationPeriod.startDate,
    params.simulationPeriod.endDate,
  ];
  const simulationPeriod_value_hash = generateHash(simulationPeriodsHashInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_simulation_periods",
    userId,
    simulationPeriod_value_hash,
    {
      user_id: userId,
      name: params.simulationPeriod.name,
      memo: params.simulationPeriod.memo,
      start_date: params.simulationPeriod.startDate,
      end_date: params.simulationPeriod.endDate,
      value_hash: simulationPeriod_value_hash,
    }
  );
}

// ヘルパー関数：取引前提条件 (sptch_trade_parameters)
async function getOrCreateTradeParameters(
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams
): Promise<number> {
  const parametersHashInput = [
    userId,
    params.tradeFilter.maxPurchaseAmount,
    params.tradeFilter.minVolume,
    params.tradeFilter.tradeUnit,
  ];
  const parameters_value_hash = generateHash(parametersHashInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_trade_parameters",
    userId,
    parameters_value_hash,
    {
      user_id: userId,
      name: params.tradeFilter.name,
      memo: params.tradeFilter.memo,
      max_purchase_amount: params.tradeFilter.maxPurchaseAmount,
      min_volume: params.tradeFilter.minVolume,
      trade_unit: params.tradeFilter.tradeUnit,
      value_hash: parameters_value_hash,
    }
  );
}

async function getOrCreateEntrySignal( // 169:13
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams
): Promise<number> {
  const entrySignalInput = [userId, params.signs.entry];
  const entrySignal_value_hash = generateHash(entrySignalInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_entry_signals",
    userId,
    entrySignal_value_hash,
    {
      user_id: userId,
      name: params.signs.entry_name,
      memo: params.signs.entry_memo,
      conditions_json: params.signs.entry,
      value_hash: entrySignal_value_hash,
    }
  );
}

async function getOrCreateExitSignal( // 199:13
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams
): Promise<number> {
  const exitSignalInput = [userId, params.signs.exit];
  const exitSignal_value_hash = generateHash(exitSignalInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_exit_signals",
    userId,
    exitSignal_value_hash,
    {
      user_id: userId,
      name: params.signs.exit_name,
      memo: params.signs.exit_memo,
      conditions_json: params.signs.exit,
      value_hash: exitSignal_value_hash,
    }
  );
}

async function getOrCreateSignalSet( // 229:13
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams,
  entrySignalId: number,
  exitSignalId: number
): Promise<number> {
  const SignalInput = [
    userId,
    params.signs.transactionType,
    entrySignalId,
    exitSignalId,
  ];
  const Signal_value_hash = generateHash(SignalInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_signals",
    userId,
    Signal_value_hash,
    {
      user_id: userId,
      name: params.signs.name,
      memo: params.signs.memo,
      transaction_type: params.signs.transactionType,
      entry_signal_id: entrySignalId,
      exit_signal_id: exitSignalId,
      value_hash: Signal_value_hash,
    }
  );
}

async function getOrCreateFeeTax( // 265:13
  supabase: SupabaseClient,
  userId: string,
  params: ISimulationRequestParams
): Promise<number> {
  const feetaxInput = [
    userId,
    params.feeTax.buyFeeRate,
    params.feeTax.sellFeeRate,
    params.feeTax.taxRate,
  ];
  const feetax_value_hash = generateHash(feetaxInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_fee_taxes",
    userId,
    feetax_value_hash,
    {
      user_id: userId,
      name: params.feeTax.name,
      memo: params.feeTax.memo,
      buy_fee_rate: params.feeTax.buyFeeRate,
      sell_fee_rate: params.feeTax.sellFeeRate,
      tax_rate: params.feeTax.taxRate,
      value_hash: feetax_value_hash,
    }
  );
}

async function getOrCreateAnalysisCondition( // 299:13
  supabase: SupabaseClient,
  userId: string,
  name: string,
  memo: string,
  stockSelectionHeaderId: number,
  simulationPeriodId: number,
  tradeParameterId: number,
  signalId: number,
  feeTaxId: number
): Promise<number> {
  const conditionhaderInput = [
    userId,
    stockSelectionHeaderId,
    simulationPeriodId,
    tradeParameterId,
    signalId,
    feeTaxId,
  ];
  const conditionhader_value_hash = generateHash(conditionhaderInput);

  return await getOrCreateRecord(
    supabase,
    "sptch_analysis_conditions",
    userId,
    conditionhader_value_hash,
    {
      user_id: userId,
      name: name,
      memo: memo,
      stock_selection_header_id: stockSelectionHeaderId,
      simulation_period_id: simulationPeriodId,
      trade_parameter_id: tradeParameterId,
      signal_id: signalId,
      fee_tax_id: feeTaxId,
      value_hash: conditionhader_value_hash,
    }
  );
}

/**
 * シミュレーション関連の引数をデータベースに登録します。
 * @param supabase Supabaseクライアントインスタンス
 * @param userId ユーザーID
 * @param params シミュレーションリクエストのパラメータ
 * @returns 登録されたanalysisConditionId、またはエラーメッセージ
 */
export async function registerSimulationData(
  userId: string,
  params: ISimulationRequestParams
): Promise<{ analysisConditionId?: number; error?: string }> {
  const supabase = await createClient();
  try {
    // 各条件を登録または取得し、IDを保持
    const stockSelectionHeaderId = await getOrCreateStockSelection(
      supabase,
      userId,
      params
    );
    const simulationPeriodId = await getOrCreateSimulationPeriod(
      supabase,
      userId,
      params
    );
    const tradeParameterId = await getOrCreateTradeParameters(
      supabase,
      userId,
      params
    );
    const entrySignalId = await getOrCreateEntrySignal(
      supabase,
      userId,
      params
    );
    const exitSignalId = await getOrCreateExitSignal(supabase, userId, params);
    const signalId = await getOrCreateSignalSet(
      supabase,
      userId,
      params,
      entrySignalId,
      exitSignalId
    );
    const feeTaxId = await getOrCreateFeeTax(supabase, userId, params);
    const analysisConditionId = await getOrCreateAnalysisCondition(
      supabase,
      userId,
      params.name,
      params.memo,
      stockSelectionHeaderId,
      simulationPeriodId,
      tradeParameterId,
      signalId,
      feeTaxId
    );
    return { analysisConditionId };
  } catch (error: unknown) {
    console.error("Unexpected error during data registration:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      error: message, // エラーメッセージが具体的になっているため、そのまま返す
    };
  }
}
