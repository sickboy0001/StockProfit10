// src/lib/simulationLogic.ts
// このファイルはServer Actionから呼び出される純粋なロジック層です。
// DBへのアクセスは行わず、受け取ったデータに対して計算処理を行います。
"use server";
import { parseISO } from "date-fns";

// spt_daily_quotesのデータ形式に合わせる
interface DailyQuote {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// MVPコア仮説のパラメータ
interface HypothesisParams {
  variableADays: number; // 仮説前提条件となる日数 (起点からA日前)
  variableBPercent: number; // 仮説前提条件となる上昇率 (%)
  variableCDays: number; // 仮説結果条件となる日数 (起点からC日後)
  variableDPercent: number; // 仮説結果条件となる上昇率 (%)
}

// 取引前提パラメータ
interface TradePremises {
  maxPurchaseAmount: number; // 購入金額上限
  minVolume: number; // 出来高下限
  tradeUnit: number; // 取引単位（例: 100株）
  buyFeeRate: number; // 購入手数料率 (例: 0.005)
  sellFeeRate: number; // 売却手数料率 (例: 0.005)
  taxRate: number; // 税率 (例: 0.20315)
}

// シミュレーションサマリー結果
interface SimulationSummary {
  totalProfitLoss: number;
  totalProfitLossRate: number;
  tradeCount: number;
}

// シミュレーション取引履歴
interface SimulationTrade {
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
export function simulateTrades(
  quotes: DailyQuote[],
  hypothesisParams: HypothesisParams,
  tradePremises: TradePremises,
  stockCode: string
): { summary: SimulationSummary; trades: SimulationTrade[] } {
  let totalProfitLoss = 0;
  let totalPurchaseAmount = 0;
  let tradeCount = 0;
  const trades: SimulationTrade[] = [];
  let currentHolding: {
    buyPrice: number;
    quantity: number;
    buyDate: Date;
  } | null = null;
  let cumulativeProfitLoss = 0;

  // 日付のインデックスマッピングを作成して高速化
  const dateToIndex = new Map<string, number>();
  quotes.forEach((q, index) => dateToIndex.set(q.date, index));

  for (let i = 0; i < quotes.length; i++) {
    const currentDate = quotes[i];
    const currentDateParsed = parseISO(currentDate.date);

    // 買いシグナル検出ロジック (analyze_stock_00003 の前提条件部分)
    // まだ株を保有していない場合のみ買いを検討
    if (currentHolding === null) {
      // A日前（過去 variableADays 日）のデータインデックスを計算
      const aDaysAgoIndex = i - hypothesisParams.variableADays;

      if (aDaysAgoIndex >= 0) {
        const aDaysAgoQuote = quotes[aDaysAgoIndex];

        // 出来高フィルタリング
        if (currentDate.volume < tradePremises.minVolume) {
          continue; // 出来高が条件を満たさない場合はスキップ
        }

        // 株価上限フィルタリング (購入金額上限)
        if (
          currentDate.close * tradePremises.tradeUnit >
          tradePremises.maxPurchaseAmount
        ) {
          continue; // 購入金額が上限を超える場合はスキップ
        }

        // 仮説の前提条件 (A日間B%上昇) の確認
        if (aDaysAgoQuote.close > 0) {
          // ゼロ除算対策
          const changePercentADays =
            ((currentDate.close - aDaysAgoQuote.close) / aDaysAgoQuote.close) *
            100;

          if (changePercentADays >= hypothesisParams.variableBPercent) {
            // 買いシグナル発生！仮想購入を実行
            const buyPrice = currentDate.close;
            const quantityToBuy = tradePremises.tradeUnit; // 固定の取引単位

            const buyFee = buyPrice * quantityToBuy * tradePremises.buyFeeRate;
            const actualBuyCost = buyPrice * quantityToBuy + buyFee;

            currentHolding = {
              buyPrice: buyPrice,
              quantity: quantityToBuy,
              buyDate: currentDateParsed,
            };

            totalPurchaseAmount += actualBuyCost;
            tradeCount++;

            const buyTrade: SimulationTrade = {
              tradeDate: currentDate.date,
              tradeType: "BUY",
              stockCode: stockCode,
              price: buyPrice,
              quantity: quantityToBuy,
              fee: buyFee,
              cumulativeProfitLoss: cumulativeProfitLoss, // 買い時点での累積損益は変化なし
              memo: `買いシグナル発生: ${hypothesisParams.variableADays}日で${hypothesisParams.variableBPercent}%上昇`,
              createdAt: new Date().toISOString(),
            };
            trades.push(buyTrade);
          }
        }
      }
    }

    // 株を保有している場合、売りシグナルを検討 (analyze_stock_00003 の結果条件部分 + 損切り/利確)
    if (currentHolding !== null) {
      const { buyPrice, quantity } = currentHolding;

      // C日後（未来 variableCDays 日）のデータインデックスを計算
      const cDaysForwardIndex = i + hypothesisParams.variableCDays;
      let sellOccurred = false;

      // 1. 指定日数後の強制売却、または目標達成/損切り
      // C日後までデータを探索し、その間の最大利益/最大損失を追う
      for (let j = i + 1; j <= cDaysForwardIndex && j < quotes.length; j++) {
        const futureDateQuote = quotes[j];
        const currentProfitLossPercent =
          ((futureDateQuote.close - buyPrice) / buyPrice) * 100;

        // 利確条件: 10%以上値上がり
        if (currentProfitLossPercent >= hypothesisParams.variableDPercent) {
          const sellPrice = futureDateQuote.close;
          const sellFee = sellPrice * quantity * tradePremises.sellFeeRate;
          const grossProfit = (sellPrice - buyPrice) * quantity;
          const netProfit =
            grossProfit -
            sellFee -
            (grossProfit > 0 ? grossProfit * tradePremises.taxRate : 0);

          totalProfitLoss += netProfit;
          cumulativeProfitLoss += netProfit;

          const sellTrade: SimulationTrade = {
            tradeDate: futureDateQuote.date,
            tradeType: "SELL",
            stockCode: stockCode,
            price: sellPrice,
            quantity: quantity,
            fee: sellFee,
            profitLoss: netProfit,
            cumulativeProfitLoss: cumulativeProfitLoss,
            memo: `利確 (${hypothesisParams.variableDPercent}%目標達成)`,
            createdAt: new Date().toISOString(),
          };
          trades.push(sellTrade);
          currentHolding = null; // 売却したので保有をクリア
          sellOccurred = true;
          i = j - 1; // 売却日以降から次の買いシグナルを探索
          break; // 売却したので次の買いを探す
        }

        // 損切り条件: 10%以上値下がり
        if (currentProfitLossPercent <= -hypothesisParams.variableDPercent) {
          const sellPrice = futureDateQuote.close;
          const sellFee = sellPrice * quantity * tradePremises.sellFeeRate;
          const grossProfit = (sellPrice - buyPrice) * quantity; // マイナスになる
          const netProfit = grossProfit - sellFee; // 損失は課税されないので税は0

          totalProfitLoss += netProfit;
          cumulativeProfitLoss += netProfit;

          const sellTrade: SimulationTrade = {
            tradeDate: futureDateQuote.date,
            tradeType: "SELL",
            stockCode: stockCode,
            price: sellPrice,
            quantity: quantity,
            fee: sellFee,
            profitLoss: netProfit,
            cumulativeProfitLoss: cumulativeProfitLoss,
            memo: `損切り (${hypothesisParams.variableDPercent}%損切り)`,
            createdAt: new Date().toISOString(),
          };
          trades.push(sellTrade);
          currentHolding = null; // 売却したので保有をクリア
          sellOccurred = true;
          i = j - 1; // 売却日以降から次の買いシグナルを探索
          break; // 売却したので次の買いを探す
        }
      }

      // C日後まで到達したが、利確・損切り条件を満たさなかった場合、強制売却
      if (!sellOccurred && i === quotes.length - 1 && currentHolding !== null) {
        // ループの最後に到達し、まだ保有している場合
        // C日後の株価が、期間内に存在しない場合は、最終日の終値で売却
        const finalSellPrice = currentDate.close;
        const sellFee = finalSellPrice * quantity * tradePremises.sellFeeRate;
        const grossProfit = (finalSellPrice - buyPrice) * quantity;
        const netProfit =
          grossProfit -
          sellFee -
          (grossProfit > 0 ? grossProfit * tradePremises.taxRate : 0);

        totalProfitLoss += netProfit;
        cumulativeProfitLoss += netProfit;

        const sellTrade: SimulationTrade = {
          tradeDate: currentDate.date,
          tradeType: "SELL",
          stockCode: stockCode,
          price: finalSellPrice,
          quantity: quantity,
          fee: sellFee,
          profitLoss: netProfit,
          cumulativeProfitLoss: cumulativeProfitLoss,
          memo: `シミュレーション期間終了による強制売却`,
          createdAt: new Date().toISOString(),
        };
        trades.push(sellTrade);
        currentHolding = null;
      }
    }
  }

  // シミュレーション期間終了時にまだ株を保有している場合は、最終日の終値で強制売却
  if (currentHolding !== null && quotes.length > 0) {
    const finalQuote = quotes[quotes.length - 1];
    const { buyPrice, quantity } = currentHolding;
    const sellPrice = finalQuote.close;
    const sellFee = sellPrice * quantity * tradePremises.sellFeeRate;
    const grossProfit = (sellPrice - buyPrice) * quantity;
    const netProfit =
      grossProfit -
      sellFee -
      (grossProfit > 0 ? grossProfit * tradePremises.taxRate : 0);

    totalProfitLoss += netProfit;
    cumulativeProfitLoss += netProfit;

    const sellTrade: SimulationTrade = {
      tradeDate: finalQuote.date,
      tradeType: "SELL",
      stockCode: stockCode,
      price: sellPrice,
      quantity: quantity,
      fee: sellFee,
      profitLoss: netProfit,
      cumulativeProfitLoss: cumulativeProfitLoss,
      memo: "シミュレーション期間終了による強制売却",
      createdAt: new Date().toISOString(),
    };
    trades.push(sellTrade);
  }

  // 損益率の計算 (購入総額が0の場合は0とする)
  const totalProfitLossRate =
    totalPurchaseAmount > 0 ? (totalProfitLoss / totalPurchaseAmount) * 100 : 0;

  return {
    summary: {
      totalProfitLoss,
      totalProfitLossRate,
      tradeCount,
    },
    trades,
  };
}
