// src/types/yFinance.d.ts

export interface Quote {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  // その他の指標も必要に応じて追加
}

export interface Indicators {
  quote: Quote[];
  // その他の指標も必要に応じて追加
}

export interface Result {
  meta: {
    currency: string;
    symbol: string;
    exchangeName: string;
    instrumentType: string;
    firstTradeDate: number; // Unix timestamp
    regularMarketTime: number; // Unix timestamp
    gmtoffset: number;
    timezone: string;
    exchangeTimezoneName: string;
    regularMarketPrice: number;
    chartPreviousClose: number;
    priceHint: number;
    currentTradingPeriod: {
      pre: {
        timezone: string;
        start: number;
        end: number;
        gmtoffset: number;
      };
      regular: {
        timezone: string;
        start: number;
        end: number;
        gmtoffset: number;
      };
      post: {
        timezone: string;
        start: number;
        end: number;
        gmsoffset: number;
      };
    };
    dataGranularity: string;
    range: string;
    validRanges: string[];
  };
  timestamp: number[]; // Unix timestamps for each day
  indicators: Indicators;
}

// Yahoo Finance APIのエラーオブジェクトの型
export interface YahooFinanceError {
  code: string; // 例: "Not Found", "Unauthorized"
  description: string; // エラーの詳細説明
  // 他にエラーレスポンスに含まれる可能性のあるプロパティ
}
export interface YahooFinanceApiResponse {
  chart: {
    result: Result[] | null; // resultがない場合も考慮してnull許容にする
    error: YahooFinanceError | null; // エラーオブジェクトまたはエラーがない場合はnull
  };
}

// データベースに保存する日次データの型
export interface DailyQuote {
  code: string;
  date: string; // YYYY-MM-DD
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}
