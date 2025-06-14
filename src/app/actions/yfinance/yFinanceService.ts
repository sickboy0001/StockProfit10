// src/lib/api/yFinanceService.ts

import { YahooFinanceApiResponse } from "@/types/yFinance";
import yahooFinance from "yahoo-finance2"; // ESモジュール形式でインポート

// Define a local interface for the financialData module structure
// This is needed because the default types might not include all properties used,
// such as ebitda and interestExpense for interest_coverage calculation.
interface YahooFinanceFinancialData {
  returnOnEquity?: number | null;
  quickRatio?: number | null; // equity_ratio として使用
  returnOnAssets?: number | null;
  operatingMargins?: number | null;
  freeCashflow?: number | null;
  ebitda?: number | null;
  interestExpense?: number | null;
}

// const yahooFinance = require("yahoo-finance2").default; // CommonJS形式のインポート
export async function FetchStockData(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<YahooFinanceApiResponse> {
  // Yahoo Finance APIのエンドポイントとパラメータを構築
  // 通常は `https://query1.finance.yahoo.com/v7/finance/download/${symbol}` のような形式
  // ただし、このエンドポイントはCSVダウンロード用で、直接JSONを返すAPIではない可能性があります。
  // Yahoo Finance APIの具体的なJSON APIエンドポイントは、有料プランや特定のライブラリ経由での利用が一般的です。
  // 無料でJSONレスポンスを得るには、yfinanceなどのPythonライブラリをバックエンドで使うか、
  // 他の無料API (Alpha Vantageなど) を検討する必要があります。
  // 今回の仕様ではYahooFinanceAPIが前提なので、そのAPIの仕様に合わせて実装が必要です。
  // ここでは仮のURLとデータ構造を使用します。

  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const queryParams = new URLSearchParams({
    period1: new Date(startDate).getTime() / 1000 + "",
    period2: new Date(endDate).getTime() / 1000 + "",
    interval: "1d", // 日足
    events: "history",
    includeAdjustedClose: "true",
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // エラーハンドリング
      const errorData = await response.json();
      console.error("Yahoo Finance API Error:", errorData);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data: YahooFinanceApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch stock data from Yahoo Finance:", error);
    throw error;
  }
}
export async function fetchStockFromYahoo2(symbol: string) {
  // この関数は fetchStockFromYahoo の修正の参考として残しますが、
  // 直接呼び出されることは想定していません。
  // 必要であれば、このロジックを fetchStockFromYahoo に統合します。

  // 企業のティッカーシンボルを指定
  const ticker = symbol + ".T"; // Appleのティッカー

  // 株価情報を取得
  const quoteData = await yahooFinance.quote(ticker);
  console.log("株価情報 (fetchStockFromYahoo2):", quoteData);

  // 財務データを取得
  const summaryData = await yahooFinance.quoteSummary(ticker, {
    modules: [
      "financialData",
      "defaultKeyStatistics",
      "summaryDetail",
      "price",
    ],
  });
  console.log("財務・サマリーデータ (fetchStockFromYahoo2):", summaryData);
  return { quoteData, summaryData }; // 参考のために両方返す
}

export async function fetchStockFromYahoo(symbol: string) {
  const currentSymbol = symbol.includes(".") ? symbol : `${symbol}.T`;
  // const yahooFinance = require("yahoo-finance2").default; // CommonJS形式のインポート

  try {
    console.log(
      `[fetchStockFromYahoo] Fetching data for ${currentSymbol} using yahoo-finance2`
    );
    // quoteSummary を使って必要なモジュールを一括で取得
    const summary = await yahooFinance.quoteSummary(currentSymbol, {
      modules: [
        "defaultKeyStatistics",
        "financialData",
        "summaryDetail",
        "price",
      ],
    });

    // summary オブジェクトに必要なデータが含まれているか確認
    // yahoo-finance2 はエラー時に例外をスローする傾向があるため、
    // ここでのチェックは主にデータ構造の確認となる
    if (!summary) {
      console.warn(
        `[fetchStockFromYahoo] No summary data returned for symbol ${currentSymbol}.`
      );
      return null; // Indicate data not found or error in data structure
    }

    // 必要なデータが各モジュールに存在するか確認
    const {
      defaultKeyStatistics,
      financialData: rawFinancialData, // Rename to avoid conflict with the typed variable
      summaryDetail,
      price,
    } = summary;

    console.log(
      `[fetchStockFromYahoo] Successfully parsed data for ${currentSymbol} from Yahoo Finance.`
    );

    console.log(
      `[fetchStockFromYahoo] summaryDetail for ${currentSymbol}:`,
      JSON.stringify(summaryDetail, null, 2)
    );

    // Assert the raw financialData to our local interface
    const financialData = rawFinancialData as YahooFinanceFinancialData;

    return {
      market_cap:
        summaryDetail?.marketCap != null // summaryDetailからmarketCapを取得
          ? Math.round(summaryDetail.marketCap / 1_000_000) // 百万単位に変換後、四捨五入
          : null,
      issued_shares: defaultKeyStatistics?.sharesOutstanding ?? null,
      div_yield:
        summaryDetail?.dividendYield != null
          ? summaryDetail.dividendYield * 100 // %に変換
          : null,
      dividend: summaryDetail?.dividendRate ?? null,
      per: summaryDetail?.trailingPE ?? null,
      pbr: defaultKeyStatistics?.priceToBook ?? null,
      eps: defaultKeyStatistics?.trailingEps ?? null,
      bps: defaultKeyStatistics?.bookValue ?? null,
      roe:
        financialData?.returnOnEquity != null
          ? financialData.returnOnEquity * 100 // %に変換
          : null,
      equity_ratio: financialData?.quickRatio ?? null, // ※QuickRatio を仮で使用。要調整
      min_price:
        price?.regularMarketPrice != null
          ? price.regularMarketPrice * 100 // 単元株数を100として最低購入代金を計算
          : null,
      unit_shares: 100, // yahoo-finance2では直接取得できないため固定値または別途取得ロジックが必要
      high_price_ytd:
        summaryDetail?.fiftyTwoWeekHigh != null
          ? Math.round(summaryDetail.fiftyTwoWeekHigh)
          : null,
      low_price_ytd:
        summaryDetail?.fiftyTwoWeekLow != null
          ? Math.round(summaryDetail.fiftyTwoWeekLow)
          : null,

      // 以下は追加で参考になる値（必要に応じてDBスキーマも拡張）
      roa:
        financialData?.returnOnAssets != null
          ? financialData.returnOnAssets * 100 // %に変換
          : null,
      operating_margin:
        financialData?.operatingMargins != null
          ? financialData.operatingMargins * 100 // %に変換
          : null,
      free_cash_flow:
        financialData?.freeCashflow != null // nullまたはundefinedでないことを確認
          ? Math.round(financialData.freeCashflow / 1_000_000) // 百万単位に変換後、四捨五入して整数に
          : null,
      interest_coverage:
        financialData?.ebitda && financialData?.interestExpense
          ? financialData.ebitda / financialData.interestExpense
          : null,

      beta: defaultKeyStatistics?.beta ?? null,
      peg_ratio: defaultKeyStatistics?.pegRatio ?? null,
      updated_at: new Date().toISOString().slice(0, 10),
    };
  } catch (error) {
    console.error(
      `[fetchStockFromYahoo] Failed to fetch or parse stock data from Yahoo Finance for ${currentSymbol}:`,
      error
    );
    return null; // Indicate failure
  }
}
