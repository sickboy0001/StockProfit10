// dummy
// c:\work\dev\spa\stockprofit10-app\src\app\actions\Compass\simulationService.ts
"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { DailyQuote } from "./simulationLogic";
import {
  ExitSignal,
  FeeTax,
  getPlanDetailsAll,
  StockInfo,
  TradeParameter,
} from "./PlanActions";
import { readAndRegistDailyQuotesEntry } from "../readAndRegistEntry";
import { readAndRegistStockCompanyDetails } from "../readAndRegistStockCompanyDetails";
import { StockDetails } from "@/types/stock";
import {
  getDateNextOpenMarketDate,
  getDateWithPeriosEnd,
  getDateWithPeriosStart,
  getDaysMAfter,
  getDaysNBefore,
  getProfitTargetStopLoss,
} from "./PlanFuncs";
import { recordSimulationStocks, recordTradeResult } from "./simulationDb";

/**
 * ログや一時的なサマリーとして使用されるオブジェクトの型。
 */
interface LogSummary {
  note: string;
}

/**
 * エントリーシグナルの条件を表すインターフェース。
 */
interface EntryCondition {
  type: string;
  variableADays?: number;
  variableBPercent?: number;
  macdLongEma?: number;
}

/**
 * エントリーシグナルのJSON構造を表すインターフェース。
 */
interface EntrySignalConditions {
  entryConditions: EntryCondition[];
}

/**
 * 個々のトレード全体の記録を表すインターフェース
 * エントリーからエグジットまでの一連の取引とその損益情報を含む
 */
interface TradeRecord {
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
interface OrderFill {
  trade_date: string;
  close_price: number; //　株価
  quantity: number; //量　株数
  amount: number; //合計
}

// /**
//  * 指定された条件で株価データをデータベースから取得します。
//  * @param supabase Supabaseクライアント
//  * @param stockCode 銘柄コード
//  * @param startDate 開始日 (YYYY-MM-DD)
//  * @param endDate 終了日 (YYYY-MM-DD)
//  * @returns 株価データの配列
//  */
// async function getDailyQuotes(
//   supabase: SupabaseClient,
//   stockCode: string,
//   startDate: string,
//   endDate: string
// ): Promise<DailyQuote[]> {
//   const { data, error } = await supabase
//     .from("spt_daily_quotes")
//     .select("date, open, high, low, close, volume")
//     .eq("stock_code", stockCode)
//     .gte("date", startDate)
//     .lte("date", endDate)
//     .order("date", { ascending: true });

//   if (error) {
//     console.error("Error fetching daily quotes:", error);
//     throw new Error(`株価データの取得に失敗しました: ${error.message}`);
//   }
//   // DBからのデータは型アサーションが必要な場合がある
//   return data as DailyQuote[];
// }

async function getStockCompanyDetails(stockCodes: StockInfo[]): Promise<{
  data: (StockDetails | null)[];
  error: string | null;
}> {
  try {
    // Promise.allを使用して、各銘柄の詳細情報を並行して取得します。
    const detailPromises = stockCodes.map((stockInfo) =>
      readAndRegistStockCompanyDetails(stockInfo.code)
    );

    const responses = await Promise.all(detailPromises);

    const results: (StockDetails | null)[] = [];
    const errors: string[] = [];

    responses.forEach((response, index) => {
      if (response.error) {
        const stockCode = stockCodes[index].code;
        console.error(
          `銘柄[${stockCode}]の詳細情報取得に失敗: ${response.error}`
        );
        errors.push(`[${stockCode}]: ${response.error}`);
        results.push(null); // 失敗した場合はnullを結果配列に追加
      } else {
        results.push(response.data);
      }
    });

    const combinedError = errors.length > 0 ? errors.join("\\n") : null;
    return { data: results, error: combinedError };
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : "予期せぬエラーが発生しました";
    console.error("getStockCompanyDetailsで予期せぬエラー:", e);
    return {
      data: [],
      error: `企業情報の取得中にエラーが発生しました: ${errorMessage}`,
    };
  }
}
interface stockCodeWithCompany extends StockInfo {
  StockDetail: StockDetails | null;
}

/**
 * 01-01: 対象の銘柄を選別（分析条件を取得）するヘルパー関数。
 * analysisConditionId に基づいて、シミュレーションに必要な条件を取得します。
 * @param supabase Supabaseクライアント
 * @param analysisConditionId 分析条件ID
 * @returns 分析条件オブジェクト
 */
async function selectTargetStock(
  supabase: SupabaseClient,
  analysisConditionId: number,
  simulationResultId: number,
  stockCodes: stockCodeWithCompany[],
  tradeParameter: TradeParameter
): Promise<{ summary: null; stocks: stockCodeWithCompany[] }> {
  // `getAnalysisConditionDetails` を呼び出してDBから詳細を取得
  console.log("selectTargetStock supabase", supabase.schema);
  console.log("selectTargetStock tradeParameter", tradeParameter);

  const stocksToInsert = [];
  const filteredStocks: stockCodeWithCompany[] = [];

  for (const stock of stockCodes) {
    let score = 1;
    let filter_reason: string | null = null;

    if (
      !stock.StockDetail ||
      !stock.StockDetail.company_detail ||
      typeof stock.StockDetail.company_detail.min_price !== "number"
    ) {
      score = 0;
      filter_reason = "企業詳細情報または最低購入価格が取得できませんでした。";
      console.warn(`銘柄[${stock.code}]の${filter_reason}`);
    } else if (
      stock.StockDetail.company_detail.min_price >
      tradeParameter.max_purchase_amount
    ) {
      score = 0;
      filter_reason = `最低購入価格(${stock.StockDetail.company_detail.min_price}円)が最大購入金額(${tradeParameter.max_purchase_amount}円)を超えています。`;
    }

    stocksToInsert.push({
      simulation_result_id: simulationResultId,
      stock_code: stock.code,
      filter_reason: filter_reason,
      score: score,
    });

    if (score === 1) {
      filteredStocks.push(stock);
    }
  }

  //* sptch_simulation_results_stocks:
  //  *  sptch_analysis_conditions に基づく銘柄フィルタリングの結果を格納します。
  //  *  どの銘柄が投資対象になったかを記録します。
  // DBにフィルタリング結果を登録
  await recordSimulationStocks(supabase, stocksToInsert);

  return { summary: null, stocks: filteredStocks };
}

async function getTradeRecord(
  supabase: SupabaseClient,
  currentDate: Date,
  stockData: DailyQuote[],
  stockDetail: StockDetails,
  tradeParameter: TradeParameter,
  exitSignal: ExitSignal,
  feeTax: FeeTax
): Promise<{ summary: LogSummary; tradeRecord: TradeRecord | null }> {
  // console.log("getTradeRecord called");

  const entrtDate = await getDateNextOpenMarketDate(
    supabase,
    currentDate.toISOString().split("T")[0]
  );

  const daysMafter = getDaysMAfter(exitSignal);
  const defExitDate = await getDateWithPeriosEnd(
    supabase,
    entrtDate,
    daysMafter
  );

  const entryTrade = stockData.find((d) => d.date === entrtDate);
  if (!entryTrade) {
    const summary = {
      note: `銘柄[${stockDetail.code}]のエントリー日(${entrtDate})のデータが見つかりません`,
    };
    return { summary, tradeRecord: null };
  }

  // --- ここから決済日を決定するロジック ---
  let exitDate = defExitDate;
  let exitReason = "期間満了";

  /*
  {"exitConditions": [
    {"days": 10, "type": "fixedDays"}, 
    {"type": "profitTarget", "percent": 10}, 
    {"type": "stopLoss", "percent": 10}]}
   */
  // const overProfitPercent = 0.1; // +10%で利益確定
  // const underProfitPercent = -0.1; // -10%で損切り
  const { profitTarget, stopLoss } = getProfitTargetStopLoss(exitSignal);
  const entryPrice = entryTrade.close;

  const entryIndex = stockData.findIndex((d) => d.date === entrtDate);

  // デフォルトの決済日までのインデックスを検索
  let loopEndIndex = stockData.findIndex((d) => d.date === defExitDate);
  if (loopEndIndex === -1) {
    // データが期間の途中で終わっている場合、最後までチェック
    loopEndIndex = stockData.length - 1;
  }

  // エントリーの翌日からループして利益確定・損切りをチェック
  if (entryIndex !== -1) {
    for (let i = entryIndex + 1; i <= loopEndIndex; i++) {
      const currentDayData = stockData[i];
      if (!currentDayData) continue;

      const currentPrice = currentDayData.close;
      const profitRate = (currentPrice - entryPrice) / entryPrice;
      // console.log(
      //   "seekexitday",
      //   currentPrice,
      //   entryPrice,
      //   profitRate,
      //   stopLoss
      // );
      // 利益確定
      if (profitRate >= profitTarget) {
        exitDate = currentDayData.date;
        exitReason = "利益確定";
        break; // 条件を満たしたらループを抜ける
      }

      // 損切り
      if (profitRate <= stopLoss) {
        exitDate = currentDayData.date;
        exitReason = "損切り";
        break; // 条件を満たしたらループを抜ける
      }
    }
  }

  // console.log("exitDate", exitDate, exitReason);

  const exitTrade = stockData.find((d) => d.date === exitDate);
  if (!exitTrade) {
    const summary = {
      note: `銘柄[${stockDetail.code}]の決済日(${exitDate})のデータが見つかりません。エントリー日: ${entrtDate}`,
    };
    return { summary, tradeRecord: null };
  }

  // trade_unit 単位（例: 100株）
  // max_purchase_amount 最大購入金額
  // entryTrade.close: 株価
  // 最大購入金額以下で、取引単位の整数倍となる最大の株数を計算します。
  const numberOfUnits = Math.floor(
    tradeParameter.max_purchase_amount /
      (entryTrade.close * tradeParameter.trade_unit)
  );
  const trade_quantity = numberOfUnits * tradeParameter.trade_unit;

  // 購入できる株数がない場合は、取引を行わずに終了
  if (trade_quantity === 0) {
    const summary = {
      note: `銘柄[${stockDetail.code}]は購入金額上限（${tradeParameter.max_purchase_amount}円）に達しているため、購入できません。`,
    };
    return { summary, tradeRecord: null };
  }

  // console.log("tradeParameter:", tradeParameter);
  const entry_trade: OrderFill = {
    trade_date: entryTrade.date,
    close_price: entryTrade.close,
    quantity: trade_quantity,
    amount: trade_quantity * entryTrade.close,
  };
  // console.log("exitTrade", exitTrade);

  const exit_trade: OrderFill = {
    trade_date: exitTrade.date,
    close_price: exitTrade.close,
    quantity: trade_quantity,
    amount: trade_quantity * exitTrade.close,
  };

  const gross_profit_amount = exit_trade.amount - entry_trade.amount;
  const gross_profit_rate =
    entry_trade.amount !== 0 ? gross_profit_amount / entry_trade.amount : 0;
  const net_profit_amount =
    gross_profit_amount > 0
      ? (1 - feeTax.tax_rate) * gross_profit_amount
      : gross_profit_amount;
  const net_profit_rate =
    entry_trade.amount !== 0 ? net_profit_amount / entry_trade.amount : 0;
  const tradeRecord: TradeRecord = {
    stock_code: stockDetail.code,
    trade_method: "long",
    target_date: currentDate.toISOString().split("T")[0],
    target_close_price: stockData[0].close.toString(),
    entry_trade: entry_trade,
    exit_trade: exit_trade,
    gross_profit_amount: gross_profit_amount,
    gross_profit_rate: gross_profit_rate,
    net_profit_amount: net_profit_amount,
    net_profit_rate: net_profit_rate,
  };

  const note =
    `[${tradeRecord.stock_code}] ` +
    `${exitReason} ` +
    `start_date:${tradeRecord.entry_trade.trade_date} ` +
    `/end_date:${tradeRecord.exit_trade.trade_date}` +
    `/start to end :${tradeRecord.entry_trade.amount.toFixed(
      2
    )} to ${tradeRecord.exit_trade.amount.toFixed(2)}` +
    `/gross_profit_amount: ${gross_profit_amount}` +
    `/gross_profit_rate: ${gross_profit_rate.toFixed(2)}` +
    `/net_profit_amount: ${net_profit_amount.toFixed(2)}` +
    `/net_profit_rate: ${net_profit_rate.toFixed(2)}`;
  const summary = {
    note: `完了:` + note,
  };
  return { summary, tradeRecord };
}
/**
 * シミュレーションを実行し、結果を返すサービス関数。
 * DBアクセスとビジネスロジックを調整します。
 * @param supabase Supabaseクライアント
 * @param analysisConditionId 分析条件ID
 * @param simulationResultId シミュレーション結果ID (取引履歴保存用)
 * @returns シミュレーションのサマリーと取引履歴
 * sptch_simulation_results_stocks:
 *  sptch_analysis_conditions に基づく銘柄フィルタリングの結果を格納します。
 *  どの銘柄が投資対象になったかを記録します。
 * sptch_simulation_results_trade:
 *  sptch_analysis_conditions に基づく個々の銘柄の
 *  トレードシミュレーション結果（エントリーからエグジットまで）を格納します。
 * sptch_simulation_results_summary:
 *  sptch_analysis_conditions に基づくプラン全体の総合的な損益結果を格納します。
 */
export async function runSimulation(
  supabase: SupabaseClient,
  analysisConditionId: number,
  simulationResultId: number
): Promise<{ summary: LogSummary; trades: TradeRecord[] }> {
  // 1. 分析条件を取得
  const { data: planCondition, error: conditionError } =
    await getPlanDetailsAll(analysisConditionId);

  const tradeRecords: TradeRecord[] = [];

  // await getAnalysisConditionDetails(supabase, analysisConditionId);
  if (conditionError || !planCondition) {
    throw new Error(
      `分析条件の取得に失敗しました: ${conditionError || "データがありません"}`
    );
  }

  if (planCondition.stockCodes === null) {
    const summary = {
      note: "condition.stockCodes is null.",
    };
    return { summary, trades: tradeRecords };
  }
  if (planCondition.tradeParameter === null) {
    const summary = {
      note: "condition.tradeParameter is null.",
    };
    return { summary, trades: tradeRecords };
  }
  if (planCondition.entrySignal === null) {
    const summary = {
      note: "condition.entrySignal is null.",
    };
    return { summary, trades: tradeRecords };
  }
  if (planCondition.exitSignal === null) {
    const summary = {
      note: "condition.exitSignal is null.",
    };
    return { summary, trades: tradeRecords };
  }
  if (planCondition.simulationPeriod === null) {
    const summary = {
      note: "simulationPeriod is null.",
    };
    return { summary, trades: tradeRecords };
  }
  if (planCondition.feeTax === null) {
    const summary = {
      note: "feeTax is null.",
    };
    return { summary, trades: tradeRecords };
  }

  // 準備
  const { data: stockCompanyDetails, error: stockDetailsError } =
    await getStockCompanyDetails(planCondition.stockCodes);

  if (stockDetailsError) {
    // 企業詳細情報の取得中にエラーが発生した場合、シミュレーションを続行できないため、エラーをスローします。
    // getStockCompanyDetailsは一部の銘柄で失敗してもエラーを返すため、
    // 致命的なエラーとして処理を中断します。
    throw new Error(
      `シミュレーションに必要な企業詳細情報の取得に失敗しました: ${stockDetailsError}`
    );
  }
  // console.log("stockCompanyDetails.length:", stockCompanyDetails.length);

  const stockCodeWithCompanys = planCondition.stockCodes.map((stockInfo) => {
    // .filter() は配列を返すため、.find() を使って最初の一致する要素を取得します。
    // 見つからない場合は undefined が返るため、|| null で null にフォールバックします。
    const detail =
      stockCompanyDetails.find((d) => d?.code === stockInfo.code) || null;
    return { ...stockInfo, StockDetail: detail };
  });

  //   #### 詳細
  // - 01-01:対象の銘柄の選別
  //   - input sptch_stock_selections_header sptch_stock_selections_stocks sptch_simulation_periods
  //   - output sptch_simulation_results_stocks

  // 01-01:対象の銘柄の選別 (ヘルパー関数を呼び出し)
  const { stocks: selectedStocks } = await selectTargetStock(
    supabase,
    analysisConditionId,
    simulationResultId,
    stockCodeWithCompanys,
    planCondition.tradeParameter
  );

  // - 02-01:EntrySignal条件のN日前を確認
  //   - input sptch_signals
  const daysN = getDaysNBefore(planCondition.entrySignal.conditions_json);
  // - 02-02:開始日のN日前を取得
  //   - input sptch_simulation_periods
  const targetStartDate = await getDateWithPeriosStart(
    supabase,
    planCondition.simulationPeriod.start_date,
    daysN
  );
  // console.log(
  //   "runSimulation planCondition.entrySingal.Condation_days",
  //   planCondition.simulationPeriod.start_date
  // );
  // console.log("runSimulation targetStartDate", targetStartDate);

  // -)
  // - 02-03:ExitSignal条件のM日後を確認
  //   - input sptch_exit_signals
  const daysM = getDaysMAfter(planCondition.exitSignal.conditions_json);
  // - 02-04:終了日のM日後を取得
  //   - input sptch_simulation_periods
  // console.log("runSimulation planCondition.exitSingal.Condation_days", daysM);
  const targetEndDate = await getDateWithPeriosEnd(
    supabase,
    planCondition.simulationPeriod.end_date,
    daysM
  );

  // - 02-05:銘柄の配列の１つ目を指定
  //   - input sptch_simulation_results_stocks
  // 銘柄の配列が空でないことを確認
  if (!selectedStocks || selectedStocks.length === 0) {
    const summary = {
      note: "対象銘柄が見つかりませんでした。",
    };
    return { summary, trades: tradeRecords };
  }

  // 各銘柄に対して処理を実行
  for (const stockInfo of selectedStocks) {
    if (stockInfo.StockDetail === null) {
      throw new Error(
        `シミュレーションに必要な企業詳細情報の取得に失敗しました: ${stockInfo.code}`
      );
    }
    const stockCode = stockInfo.code;
    // console.log("現在処理中の銘柄コード:", stockCode); // デバッグ用ログ

    // TODO: ここに各銘柄に対するシミュレーションロジックを実装
    // - 03-01:銘柄に対しての処理開始
    //   - input sptch_simulation_results_stocks
    // - 03-02:銘柄のヒストグラムが開始日のN日前、終了日のM日後を含んでいるか？
    //   - input spt_daily_quotes
    //   - targetStartDate,targetEndtDate
    const { stockData } = await readAndRegistDailyQuotesEntry(
      // for...of ループ内で await を使用
      stockCode,
      targetStartDate,
      targetEndDate
    );
    if (!stockData) {
      console.warn(
        `銘柄コード ${stockCode} の株価データが取得できませんでした。`
      );
      continue; // 次の銘柄へ
    }

    // null を許容しない simulationLogic.DailyQuote[] 型に合わせるため、
    // null を含むレコードを除外する
    const cleanStockData = stockData.filter(
      (q) =>
        q.open !== null &&
        q.high !== null &&
        q.low !== null &&
        q.close !== null &&
        q.volume !== null
    ) as DailyQuote[];

    //todo ５日間での出来高が平均で１００００以上あること

    // 処理対象の日付をSetに格納して高速にルックアップできるようにする
    const availableDates = new Set(cleanStockData.map((d) => d.date));

    // - 03-05: シミュレーション期間をループして評価
    const simStartDate = new Date(planCondition.simulationPeriod.start_date);
    const simEndDate = new Date(planCondition.simulationPeriod.end_date);

    for (
      let currentDate = new Date(simStartDate);
      currentDate <= simEndDate;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const currentDateString = currentDate.toISOString().split("T")[0];
      // 評価対象日に株価データが存在しない場合（市場の休日など）はスキップ
      if (!availableDates.has(currentDateString)) {
        continue;
      }
      // - 04-01:基準日でのEntrySignalの評価
      //   - input sptch_signals sptch_entry_signals

      // console.log(`評価日: ${currentDateString}`); // デバッグ用
      const { hasEntrySignal } = getHasEntrySignal(
        cleanStockData,
        currentDate,
        planCondition.entrySignal.conditions_json
      );
      if (hasEntrySignal) {
        // console.log(
        //   "hasEntrySinal =true stockCode,currentDate",
        //   stockCode,
        //   currentDate
        // );
        const { summary: tradeRecordSummary, tradeRecord } =
          await getTradeRecord(
            supabase,
            currentDate,
            cleanStockData,
            stockInfo.StockDetail,
            planCondition.tradeParameter,
            planCondition.exitSignal,
            planCondition.feeTax
          );
        if (tradeRecord === null) {
          console.log(tradeRecordSummary.note);
        }
        if (tradeRecord !== null) {
          // console.log(tradeRecord);
          // console.log(tradeRecordSummary.note);
          try {
            await recordTradeResult(supabase, simulationResultId, tradeRecord);
          } catch (error) {
            console.error(
              `[${tradeRecord.stock_code}] のトレード結果の保存に失敗しました:`,
              error
            );
          }
          tradeRecords.push(tradeRecord);
        }

        // - 04-02:基準日でのEntry
        //   - input sptch_signals sptch_entry_signals sptch_trade_parameters
        //   - output sptch_simulation_results_trade
        // - 04-03:Exit日でのExit
        //   - input sptch_signals sptch_exit_signals sptch_fee_taxes
        //   - output sptch_simulation_results_trade
        // - 04-04:評価、登録
        //   - output sptch_simulation_results
        // - 04-05:翌日が終了日以前 (ループ条件で処理)

        break; // 条件に一致する日が見つかったら、この銘柄の評価を終了して次の銘柄へ
      }
    }
    // - 05-01:次の銘柄へ (外側のループで処理)
  }

  // - 06-01:終了処理、記録登録
  //   - output sptch_simulation_results

  // TODO: 実際のシミュレーションロジックが実装されるまでのダミーデータ
  const summary = {
    note: "This is a dummy summary. Real implementation is pending.",
  };
  // エラー(ts7034)を解消するため、SimulationTradeの配列型を明示的に指定します
  // const trades: SimulationTrade[] = [];

  // 6. 結果を返す
  return { summary, trades: tradeRecords };
}

interface getHasEntrySignalResult {
  hasEntrySignal: boolean;
  message: string;
}

function getHasEntrySignal(
  stockData: DailyQuote[] | null,
  currentDate: Date,
  conditions_json: string | EntrySignalConditions | null
): getHasEntrySignalResult {
  // 1. 引数チェック
  if (!stockData || stockData.length === 0) {
    return { hasEntrySignal: false, message: "株価データがありません。" };
  }
  if (!currentDate) {
    return { hasEntrySignal: false, message: "評価日が指定されていません。" };
  }
  if (!conditions_json) {
    return {
      hasEntrySignal: false,
      message: "エントリー条件が指定されていません。",
    };
  }

  try {
    // 2. 条件をパース
    // 引数が文字列ならパースし、オブジェクトならそのまま使用する")
    const conditions: EntrySignalConditions | null =
      typeof conditions_json === "string"
        ? JSON.parse(conditions_json)
        : conditions_json;

    if (!conditions || !Array.isArray(conditions.entryConditions)) {
      return {
        hasEntrySignal: false,
        message: "エントリー条件の形式が不正です。",
      };
    }

    // 3. 評価日のデータを検索
    const currentDateString = currentDate.toISOString().split("T")[0];
    const currentIndex = stockData.findIndex(
      (d) => d.date === currentDateString
    );

    if (currentIndex === -1) {
      // このパスはrunSimulationの事前チェックで除外されるはずだが、念のため
      return {
        hasEntrySignal: false,
        message: `評価日 ${currentDateString} のデータが見つかりません。`,
      };
    }
    const currentDayData = stockData[currentIndex];

    // 4. 各エントリー条件を評価
    const entryConditions: EntryCondition[] = conditions.entryConditions;
    for (const cond of entryConditions) {
      if (cond.type === "priceMovement") {
        const { variableADays, variableBPercent } = cond;
        if (variableADays === undefined || variableBPercent === undefined) {
          // console.log("getHasEntrySignal skip variableADay");
          continue; // 不正な条件はスキップ
        }

        // 5. 評価日を含まない、過去 variableADays 日間のデータを取得
        const startIndex = Math.max(0, currentIndex - variableADays);
        const periodData = stockData.slice(startIndex, currentIndex);

        if (periodData.length === 0) {
          continue; // 過去のデータがない場合は評価不可
        }

        // 6. 期間開始日の終値を取得
        const periodStartDateData = periodData[0];
        const periodStartDateClose = periodStartDateData.close;

        // 7. 上昇率を計算して評価
        const increasePercent =
          ((currentDayData.close - periodStartDateClose) /
            periodStartDateClose) *
          100;
        // console.log(increasePercent);

        if (increasePercent >= variableBPercent) {
          return {
            hasEntrySignal: true,
            message: `Entry Signal (priceMovement): ${variableADays}日前の終値(${periodStartDateClose})から当日の終値(${
              currentDayData.close
            })が${variableBPercent}%以上上昇 (実績: ${increasePercent.toFixed(
              2
            )}%)`,
          };
        }
      }
      // TODO: 他の条件タイプ (e.g., macdCrossover) の評価ロジックもここに追加
    }

    // 8. どの条件にも一致しなかった場合
    return {
      hasEntrySignal: false,
      message: "エントリーシグナルはありません。",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in getHasEntrySignal:", errorMessage);
    return {
      hasEntrySignal: false,
      message: `評価中にエラーが発生しました: ${errorMessage}`,
    };
  }
}
