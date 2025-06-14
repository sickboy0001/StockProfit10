export interface DailyQuote {
  code: string;
  date: string; // YYYY-MM-DD format
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface ChartData extends DailyQuote {
  ma20?: number; // 20-day moving average
  ma60?: number; // 60-day moving average
  // MACD関連のプロパティを追加
  macd?: {
    line?: number; // MACDライン
    signal?: number; // シグナルライン
    histogram?: number; // MACDヒストグラム
  };
}

// spt_stocks テーブルの構造に対応する型
export interface StockDetails {
  code: string;
  name: string;
  market?: string | null;
  industry?: string | null;
  tradable?: boolean | null;
  listing_date?: string | null; // DBからは文字列で取得されることを想定
  created_at: string; // DBからは文字列で取得されることを想定
  updated_at: string; // DBからは文字列で取得されることを想定
}

// CompanyStockDetail 型をインポートまたはここで定義
export interface CompanyStockDetail {
  code: string;
  market_cap?: number | null;
  issued_shares?: number | null;
  div_yield?: number | null;
  dividend?: number | null;
  per?: number | null;
  pbr?: number | null;
  eps?: number | null;
  bps?: number | null;
  roe?: number | null;
  equity_ratio?: number | null;
  min_price?: number | null;
  unit_shares?: number | null;
  high_price_ytd?: number | null;
  low_price_ytd?: number | null;
  updated_at: string;
  roa?: number | null;
  operating_margin?: number | null;
  free_cash_flow?: number | null;
  interest_coverage?: number | null;
  beta?: number | null;
  peg_ratio?: number | null;
}
