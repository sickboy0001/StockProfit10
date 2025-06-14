// src/types/company.d.ts

/**
 * Yahoo Finance APIの quoteSummary レスポンスから抽出する企業情報の型
 */
export interface CompanyInfo {
  symbol: string;
  name: string | null;
  shortName: string | null; // 銘柄略称 (例: トヨタ)
  longName: string | null; // 銘柄の正式名称 (例: TOYOTA MOTOR CORP)
  currency: string | null; // 通貨 (例: JPY, USD)
  exchange: string | null; // 取引所 (例: TSE, NMS)
  currentPrice: number | null; // 現在の株価

  // summaryProfile モジュールから取得される情報
  // https://github.com/gadicc/node-yahoo-finance2/blob/devel/docs/modules/quoteSummary-summaryProfile.md
  address1: string | null;
  city: string | null;
  state: string | null; // 都道府県/州
  zip: string | null; // 郵便番号
  country: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  sector: string | null;
  fullTimeEmployees: number | null; // 従業員数
  longBusinessSummary: string | null; // 企業概要

  // assetProfile モジュールから取得される情報 (summaryProfileと重複する場合がある)
  // https://github.com/gadicc/node-yahoo-finance2/blob/devel/docs/modules/quoteSummary-assetProfile.md
  // ここではsummaryProfileで取得できるものは省略し、補完的に利用
  // governanceEpochDate: number | null; // 例
  // compensationRisk: number | null; // 例

  // 他のモジュールから取得される情報
  marketCap: number | null; // 時価総額 (priceモジュールなどから)

  // 必要に応じて追加
  // 例えば、株主情報、役員情報、財務サマリーなども追加可能
  // 例えば、yahooFinance.quoteSummary(symbol, { modules: ['earnings'] }) などで取得

  // 取得時にエラーが発生した場合のプロパティ（ただし、通常は上位でエラーハンドリングする）
  // error?: string;
}

// 役員情報の型定義
export interface CompanyOfficerProfile {
  maxAge?: number;
  name?: string;
  age?: number;
  title?: string;
  yearBorn?: number;
  fiscalYear?: number;
  totalPay?: number; // 報酬
  exercisedValue?: number;
  unexercisedValue?: number;
  // 他にも役員情報に関連するフィールドがあれば追加
}

// yahoo-finance2のquoteSummaryの実際のレスポンス型に近い、より詳細な型定義
// これは内部的に利用し、最終的にCompanyInfoに変換することを想定
export interface YahooFinance2QuoteSummaryResponse {
  assetProfile?: {
    uuid?: string;
    longBusinessSummary?: string;
    sector?: string;
    industry?: string;
    fullTimeEmployees?: number;
    companyOfficers?: CompanyOfficerProfile[]; // 詳細な型定義が必要な場合
    auditRisk?: number;
    boardRisk?: number;
    compensationRisk?: number;
    shareHolderRightsRisk?: number;
    overallRisk?: number;
    governanceEpochDate?: number;
    compensationAsOfEpochDate?: number;
    maxAge?: number;
  };
  price?: {
    maxAge?: number;
    preMarketChangePercent?: number;
    preMarketChange?: number;
    preMarketTime?: number;
    preMarketPrice?: number;
    preMarketSource?: string;
    postMarketChangePercent?: number;
    postMarketChange?: number;
    postMarketTime?: number;
    postMarketPrice?: number;
    postMarketSource?: string;
    regularMarketChangePercent?: number;
    regularMarketChange?: number;
    regularMarketTime?: number;
    regularMarketPrice?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    regularMarketPreviousClose?: number;
    regularMarketSource?: string;
    shortName?: string;
    longName?: string;
    currency?: string;
    exchange?: string;
    quoteType?: string;
    symbol?: string;
    marketState?: string;
    marketCap?: number;
    averageDailyVolume10Day?: number;
    averageDailyVolume3Month?: number;
    exchangeDataDelayedBy?: number;
    gmtOffSetMilliseconds?: number;
    language?: string;
    messageBoardId?: string;
    region?: string;
    quoteSourceName?: string;
    triggerable?: boolean;
    tradeable?: boolean;
    displayName?: string;
  };
  summaryProfile?: {
    address1?: string;
    address2?: string; // 番地2もあるかもしれない
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    fax?: string;
    website?: string;
    industry?: string;
    sector?: string;
    longBusinessSummary?: string;
    fullTimeEmployees?: number;
    companyOfficers?: CompanyOfficerProfile[]; // 詳細な型定義が必要な場合
    auditRisk?: number;
    boardRisk?: number;
    compensationRisk?: number;
    shareHolderRightsRisk?: number;
    overallRisk?: number;
    governanceEpochDate?: number;
    compensationAsOfEpochDate?: number;
    maxAge?: number;
  };
  // 他のモジュール (e.g., 'earnings', 'financialData', 'defaultKeyStatistics'...) もここに追加
  // 例えば:
  // earnings?: { ... };
  // financialData?: { ... };
  // defaultKeyStatistics?: { ... };
}
