// src/lib/simulationLogic.ts
// このファイルはServer Actionから呼び出される純粋なロジック層です。
// DBへのアクセスは行わず、受け取ったデータに対して計算処理を行います。
"use server";

// spt_daily_quotesのデータ形式に合わせる
export interface DailyQuote {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// MVPコア仮説のパラメータ
export interface HypothesisParams {
  variableADays: number; // 仮説前提条件となる日数 (起点からA日前)
  variableBPercent: number; // 仮説前提条件となる上昇率 (%)
  variableCDays: number; // 仮説結果条件となる日数 (起点からC日後)
  variableDPercent: number; // 仮説結果条件となる上昇率 (%)
}

// 取引前提パラメータ
export interface TradePremises {
  maxPurchaseAmount: number; // 購入金額上限
  minVolume: number; // 出来高下限
  tradeUnit: number; // 取引単位（例: 100株）
  buyFeeRate: number; // 購入手数料率 (例: 0.005)
  sellFeeRate: number; // 売却手数料率 (例: 0.005)
  taxRate: number; // 税率 (例: 0.20315)
}

// シミュレーション取引履歴
export interface SimulationTrade {
  tradeDate: string;
  tradeType: "BUY" | "SELL";
  stockCode: string;
  price: number;
  quantity: number;
  fee: number;
  profitLoss?: number; // 売却時のみ
  cumulativeProfitLoss?: number;
  memo?: string;
}

/**
 * 仮想売買シミュレーションを実行するメインロジック関数。
 * @param quotes 株価データ配列 (日付順にソート済みを想定)
 * @param hypothesisParams コア仮説のパラメータ
 * @param tradePremises 取引前提（フィルタリング・計算用）
 * @param stockCode 銘柄コード
 * @returns シミュレーション結果のサマリーと詳細な取引履歴
 */
