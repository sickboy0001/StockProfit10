// src/app/actions/readAndRegistStockInfo.ts
"use server";

import { CompanyInfo } from "@/types/company";
import { DailyQuote } from "@/types/yFinance";
import { getCompanyInfo } from "./company"; // 既存の企業情報取得アクション
import { getAndParseStockData, saveDailyQuotesToDb } from "./stock"; // 既存の株価データ取得・保存アクション

export interface ReadAndRegistStockInfoResult {
  successMessages: string[];
  errorMessages: string[];
  companyInfo: CompanyInfo | null;
  stockData: DailyQuote[] | null;
  dbSaveCount: number | null;
}

export async function readAndRegistStockInfo(
  symbol: string,
  startDateString: string,
  endDateString: string
): Promise<ReadAndRegistStockInfoResult> {
  const result: ReadAndRegistStockInfoResult = {
    successMessages: [],
    errorMessages: [],
    companyInfo: null,
    stockData: null,
    dbSaveCount: null,
  };

  let fetchedStockDataForDb: DailyQuote[] | null = null;

  // 1. 企業情報を取得
  try {
    const companyInfoResponse = await getCompanyInfo(symbol);
    if (companyInfoResponse.error) {
      result.errorMessages.push(
        `企業情報取得エラー: ${companyInfoResponse.error}`
      );
    }
    if (companyInfoResponse.data) {
      result.companyInfo = companyInfoResponse.data;
      result.successMessages.push(
        `企業情報 (${symbol}: ${companyInfoResponse.data.name}) を取得しました。`
      );
    } else if (!companyInfoResponse.error) {
      result.successMessages.push(
        `企業情報 (${symbol}) は見つかりませんでした。`
      );
    }
  } catch (e: unknown) {
    result.errorMessages.push(
      `企業情報取得中に予期せぬエラー: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  // 2. 株価データを取得
  try {
    const stockDataResponse = await getAndParseStockData(
      symbol,
      startDateString,
      endDateString
    );

    if (stockDataResponse.error) {
      result.errorMessages.push(
        `株価データ取得エラー: ${stockDataResponse.error}`
      );
    } else if (stockDataResponse.data && stockDataResponse.data.length > 0) {
      result.stockData = stockDataResponse.data;
      fetchedStockDataForDb = stockDataResponse.data; // DB保存用に保持
      result.successMessages.push(
        `株価データを取得しました (${stockDataResponse.data.length}件)。`
      );
    } else {
      result.successMessages.push(
        "指定された条件の株価データは見つかりませんでした。"
      );
    }
  } catch (e: unknown) {
    result.errorMessages.push(
      `株価データ取得中に予期せぬエラー: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }

  // 3. 株価データをデータベースに保存 (取得成功時のみ)
  if (fetchedStockDataForDb && fetchedStockDataForDb.length > 0) {
    try {
      const saveDbResponse = await saveDailyQuotesToDb(fetchedStockDataForDb);
      if (saveDbResponse.error) {
        result.errorMessages.push(`DB保存エラー: ${saveDbResponse.error}`);
      } else if (saveDbResponse.success) {
        // result.dbSaveCount = saveDbResponse.count;
        result.successMessages.push(
          `データベースに ${saveDbResponse.count} 件のデータを登録しました。`
        );
      }
    } catch (e: unknown) {
      result.errorMessages.push(
        `DB保存中に予期せぬエラー: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  } else if (result.stockData && result.stockData.length > 0) {
    // 株価データは取得できたが、何らかの理由でDB保存用変数に入らなかった場合 (通常はないはず)
    // もしくは、DB保存の条件を満たさなかった場合
    if (result.errorMessages.length === 0) {
      // 他にエラーがなければ
      result.successMessages.push(
        "取得した株価データはDB保存の対象外でした、または既に保存済みです。"
      );
    }
  }

  return result;
}
