// src/app/actions/readAndRegistEntry.ts
"use server";

import { CompanyInfo } from "@/types/company";
import { DailyQuote } from "@/types/yFinance";
import { fetchCompanyInfo } from "./readAndRegistStockInfo";
import { readAndRegistDailyQuotes } from "./readAndRegistDailyQuotes";

export interface ReadAndRegistCompanyDailyQuotesEntryResultResult {
  successMessages: string[];
  errorMessages: string[];
  companyInfo: CompanyInfo | null;
  stockData: DailyQuote[] | null;
  dbSaveCount: number | null;
}

export async function readAndRegistCompanyDailyQuotesEntry(
  symbol: string,
  startDateString: string,
  endDateString: string
): Promise<ReadAndRegistCompanyDailyQuotesEntryResultResult> {
  const result: ReadAndRegistCompanyDailyQuotesEntryResultResult = {
    successMessages: [],
    errorMessages: [],
    companyInfo: null,
    stockData: null,
    dbSaveCount: null,
  };

  // 1 & 2. 企業情報取得と日次株価データ取得を並列実行
  const [companyResult, dailyQuotesResult] = await Promise.all([
    fetchCompanyInfo(symbol),
    readAndRegistDailyQuotes(symbol, startDateString, endDateString),
  ]);

  // 企業情報取得の結果をマージ
  result.companyInfo = companyResult.companyInfo;
  if (companyResult.successMessage) {
    result.successMessages.push(companyResult.successMessage);
  }
  if (companyResult.errorMessage) {
    result.errorMessages.push(companyResult.errorMessage);
  }

  // 株価データ確保の結果をマージ
  result.successMessages.push(...dailyQuotesResult.successMessages);
  result.errorMessages.push(...dailyQuotesResult.errorMessages);
  result.dbSaveCount = dailyQuotesResult.dbSaveCount;
  result.stockData = dailyQuotesResult.stockData;

  return result;
}

export interface ReadAndRegistDailyQuotesEntryResultResult {
  successMessages: string[];
  errorMessages: string[];
  stockData: DailyQuote[] | null;
  dbSaveCount: number | null;
}

export async function readAndRegistDailyQuotesEntry(
  symbol: string,
  startDateString: string,
  endDateString: string
): Promise<ReadAndRegistDailyQuotesEntryResultResult> {
  const result: ReadAndRegistDailyQuotesEntryResultResult = {
    successMessages: [],
    errorMessages: [],
    stockData: null,
    dbSaveCount: null,
  };

  const [dailyQuotesResult] = await Promise.all([
    readAndRegistDailyQuotes(symbol, startDateString, endDateString),
  ]);

  // 株価データ確保の結果をマージ
  result.successMessages.push(...dailyQuotesResult.successMessages);
  result.errorMessages.push(...dailyQuotesResult.errorMessages);
  result.dbSaveCount = dailyQuotesResult.dbSaveCount;
  result.stockData = dailyQuotesResult.stockData;

  return result;
}
