// components/domain/Portfolio/types.ts (新規作成を推奨)
// または PagePortfolioDetail.tsx の中に含める

// ポートフォリオ内の個々の銘柄の詳細情報
export type PortfolioStockDetail = {
  id: number; // spt_portfolio_stocks.id
  stockCode: string; // spt_portfolio_stocks.stock_code
  name: string; // spt_stocks.name (銘柄名)
  market: string | null; // spt_stocks.market (上場市場)
  groupName: string | null; // spt_portfolio_stocks.group_name
  memo: string | null; // spt_portfolio_stocks.memo
  displayOrder: number; // spt_portfolio_stocks.display_order
  holdingsQuantity: number; // spt_portfolio_stocks.quantity (保有株数 - テーブルにカラム追加を推奨)
  purchasePrice: number; // spt_portfolio_stocks.purchase_price (購入価格 - テーブルにカラム追加を推奨)

  // 日次株価データ (最新の情報のみ)
  latestDailyQuote?: {
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
  } | null;

  // 計算された損益情報 (クライアント側で計算、またはDBから取得)
  currentPrice?: number | null; // 最新の終値
  previousDayClose?: number | null; // 前日値（Close）
  previousDayChange?: number | null; // 前日比（金額）
  previousDayChangeRate?: number | null; // 前日比（パーセント）
  profitLoss?: number | null; // 評価損益（金額）
  profitLossRate?: number | null; // 評価損益率
};

// ポートフォリオ詳細全体のデータ構造
export type PortfolioDetailData = {
  id: string; // spt_portfolios.id
  title: string; // spt_portfolios.name
  description: string | null; // spt_portfolios.memo
  createdAt: string; // spt_portfolios.created_at
  updatedAt: string; // spt_portfolios.updated_at
  stocks: PortfolioStockDetail[]; // 含まれる銘柄のリスト

  // ポートフォリオ全体の集計値 (クライアント側で計算、またはServer Actionで計算して渡す)
  totalCurrentValue?: number | null;
  totalPurchaseValue?: number | null;
  totalProfitLoss?: number | null;
  totalProfitLossRate?: number | null;
};
