// simulationValidate.ts
import { ISimulationRequestParams } from "@/types/simulation";

/**
 * シミュレーションリクエストの引数をバリデートします。
 * @param params シミュレーションリクエストのパラメータ
 * @returns エラーメッセージ（バリデーション失敗時）、またはnull（バリデーション成功時）
 */
export function validateSimulationParams(
  params: ISimulationRequestParams
): string | null {
  // console.log(params);
  if (!params.stockSelection || params.stockSelection.stockCodes.length === 0) {
    return "銘柄コードが指定されていません。";
  }
  if (
    !params.simulationPeriod ||
    !params.simulationPeriod.startDate ||
    !params.simulationPeriod.endDate
  ) {
    return "シミュレーション期間が指定されていません。";
  }

  if (
    new Date(params.simulationPeriod.startDate) >
    new Date(params.simulationPeriod.endDate)
  ) {
    return "開始日は終了日より前の日付である必要があります。";
  }
  if (!params.tradeFilter || params.tradeFilter.tradeUnit <= 0) {
    return "取引単位は1以上である必要があります。";
  }
  if (
    !params.signs ||
    !params.signs.entry ||
    params.signs.entry.entryConditions.length === 0
  ) {
    return "入口サイン条件が指定されていません。";
  }
  // Fee/Tax rates should be between 0 and 1 (as they are already divided by 100 on client)
  if (
    params.feeTax.buyFeeRate < 0 ||
    params.feeTax.buyFeeRate > 1 ||
    params.feeTax.sellFeeRate < 0 ||
    params.feeTax.sellFeeRate > 1 ||
    params.feeTax.taxRate < 0 ||
    params.feeTax.taxRate > 1
  ) {
    return "手数料率または税率が不正な値です。";
  }

  return null; // バリデーション成功
}

export const setNameMemo = (params: ISimulationRequestParams) => {
  if (!params.name) {
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    params.name = `自動設定プラン ${formattedTimestamp}`;
  }
  if (!params.memo) {
    params.memo = params.name;
  }
  if (!params.stockSelection.name) {
    params.stockSelection.name = (
      "[" +
      params.stockSelection.stockCodes.length.toString() +
      "銘柄] " +
      params.stockSelection.stockCodes.join(", ")
    ).slice(0, 64);
  }
  if (!params.stockSelection.memo) {
    params.stockSelection.memo = params.stockSelection.name;
  }

  if (!params.simulationPeriod.name) {
    params.simulationPeriod.name = `${params.simulationPeriod.startDate}-${params.simulationPeriod.endDate}`;
  }
  if (!params.simulationPeriod.memo) {
    params.simulationPeriod.memo = params.simulationPeriod.name;
  }

  if (!params.tradeFilter.name) {
    params.tradeFilter.name = `${params.tradeFilter.maxPurchaseAmount} - ${params.tradeFilter.minVolume} - ${params.tradeFilter.tradeUnit}`;
  }
  if (!params.tradeFilter.memo) {
    params.tradeFilter.memo = params.tradeFilter.name;
  }

  // ヘルパー関数: 条件の要約を生成
  const getConditionsSummary = (
    conditions: {
      label?: string;
      type?: string;
    }[]
  ): string => {
    if (!conditions || conditions.length === 0) return "条件なし";
    const summary = conditions
      .map((c) => c.label || c.type)
      .slice(0, 3)
      .join(", ");
    return summary.length > 64 ? summary.slice(0, 61) + "..." : summary;
  };

  // 入口シグナルの名前とメモ
  if (!params.signs.entry_name) {
    params.signs.entry_name = getConditionsSummary(
      params.signs.entry.entryConditions
    );
  }
  if (!params.signs.entry_memo) {
    params.signs.entry_memo = params.signs.entry_name;
  }

  // 出口シグナルの名前とメモ
  if (!params.signs.exit_name) {
    params.signs.exit_name = getConditionsSummary(
      params.signs.exit.exitConditions
    );
  }
  if (!params.signs.exit_memo) {
    params.signs.exit_memo = params.signs.exit_name;
  }

  if (!params.signs.name) {
    params.signs.name = `${params.signs.transactionType} - ${params.signs.entry_name} - ${params.signs.exit_name}`;
  }
  if (!params.signs.memo) {
    params.signs.memo = params.signs.name;
  }
  if (!params.feeTax.name) {
    params.feeTax.name = `${params.feeTax.taxRate} - ${params.feeTax.buyFeeRate} - ${params.feeTax.sellFeeRate}`;
  }
  if (!params.feeTax.memo) {
    params.feeTax.memo = params.feeTax.name;
  }
};
