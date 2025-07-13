// src/app/actions/readAndRegistDailyQuotes.ts
"use server";

import { DailyQuote } from "@/types/yFinance";

import { getMostRecentOpenMarketDate } from "./MarketCalendar/calendar";
import {
  getAndParseStockData,
  getDailyQuotes,
  getDbQuotePeriod,
  saveDailyQuotesToDb,
} from "./readAndRegistStockCompanyDetails";

export interface ReadAndRegistDailyQuotesResult {
  successMessages: string[];
  errorMessages: string[];
  stockData: DailyQuote[] | null;
  dbSaveCount: number | null;
}

const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * DBの株価データ存在チェックと、必要に応じた外部APIからのデータ取得・保存を行うヘルパー関数
 * @param symbol 銘柄コード
 * @param startDateString 開始日
 * @param endDateString 終了日
 * @returns 処理結果メッセージ、保存件数、有効な終了日
 */
async function ensureStockData(
  symbol: string,
  startDateString: string,
  endDateString: string
): Promise<{
  successMessages: string[];
  errorMessages: string[];
  dbSaveCount: number | null;
  effectiveEndDate: string;
}> {
  const successMessages: string[] = [];
  const errorMessages: string[] = [];
  let dbSaveCount: number | null = null;

  // 有効な終了日を計算
  const todayString = getTodayString();
  const latestMarketOpenDate = await getMostRecentOpenMarketDate(todayString);
  const effectiveEndDate =
    endDateString > latestMarketOpenDate ? latestMarketOpenDate : endDateString;

  try {
    const dbPeriod = await getDbQuotePeriod(symbol);
    if (dbPeriod.error) {
      errorMessages.push(dbPeriod.error);
    }

    const hasFullDataInDb =
      dbPeriod.min_date &&
      dbPeriod.max_date &&
      dbPeriod.min_date <= startDateString &&
      dbPeriod.max_date >= effectiveEndDate;

    if (hasFullDataInDb) {
      successMessages.push(
        `株価データは既にデータベースに存在します。[${symbol}]`
      );
    } else {
      const stockDataResponse = await getAndParseStockData(
        symbol,
        startDateString,
        effectiveEndDate
      );

      if (stockDataResponse.error) {
        errorMessages.push(`株価データ取得エラー: ${stockDataResponse.error}`);
      } else if (stockDataResponse.data && stockDataResponse.data.length > 0) {
        const fetchedData = stockDataResponse.data;
        successMessages.push(
          `外部APIから株価データを取得しました (${fetchedData.length}件)。`
        );

        const saveDbResponse = await saveDailyQuotesToDb(fetchedData);
        if (saveDbResponse.error) {
          errorMessages.push(`DB保存エラー: ${saveDbResponse.error}`);
        } else if (saveDbResponse.success) {
          dbSaveCount = saveDbResponse.count ?? 0;
          successMessages.push(
            `データベースに ${saveDbResponse.count} 件のデータを登録/更新しました。`
          );
        }
      } else {
        successMessages.push(
          "指定された条件の株価データは外部APIに見つかりませんでした。"
        );
      }
    }
  } catch (e: unknown) {
    errorMessages.push(
      `株価データ処理中に予期せぬエラー: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  return { successMessages, errorMessages, dbSaveCount, effectiveEndDate };
}

/**
 * 日次株価データを取得・登録する
 * @param symbol 銘柄コード
 * @param startDateString 開始日
 * @param endDateString 終了日
 * @returns 日次株価データと処理結果
 */
export async function readAndRegistDailyQuotes(
  symbol: string,
  startDateString: string,
  endDateString: string
): Promise<ReadAndRegistDailyQuotesResult> {
  const result: ReadAndRegistDailyQuotesResult = {
    successMessages: [],
    errorMessages: [],
    stockData: null,
    dbSaveCount: null,
  };

  // 1. DBの株価データ存在チェックと、必要に応じた外部APIからのデータ取得・保存
  const stockDataResult = await ensureStockData(
    symbol,
    startDateString,
    endDateString
  );

  // 株価データ確保の結果をマージ
  result.successMessages.push(...stockDataResult.successMessages);
  result.errorMessages.push(...stockDataResult.errorMessages);
  result.dbSaveCount = stockDataResult.dbSaveCount;

  // 2. 最終的な株価データをDBから取得して返却
  // (エラーがあっても、取得できる範囲でデータを返す試み)
  try {
    const finalStockData = await getDailyQuotes(
      symbol,
      startDateString,
      stockDataResult.effectiveEndDate // ensureStockDataで計算した有効な終了日を使用
    );

    if ("error" in finalStockData) {
      result.errorMessages.push(
        `最終的な株価データ取得エラー: ${finalStockData.error}`
      );
    } else {
      result.stockData = finalStockData;
    }
  } catch (e: unknown) {
    result.errorMessages.push(
      `最終的な株価データ取得中に予期せぬエラー: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  return result;
}
