export type EntryConditionType =
  | "priceMovement"
  | "maCrossover"
  | "macdCrossover"
  | "macdZeroCrossover";

export type ExitConditionType =
  | "fixedDays"
  | "profitTarget"
  | "stopLoss"
  | "acceleratedProfit"
  | "acceleratedStopLoss";

export type LogicalOperator = "AND" | "OR";
export type TransactionDirection = "long" | "short";

export interface SimpleEntryCondition {
  id: string;
  type: EntryConditionType;
  label: string;
  variableADays?: number;
  variableBPercent?: number;
  maShortDays?: number;
  maLongDays?: number;
  maCrossOccurredDays?: number;
  macdShortEma?: number;
  macdLongEma?: number;
  macdSignalEma?: number;
  macdCrossoverOccurredDays?: number;
  macdZeroCrossoverOccurredDays?: number;
}

export interface SimpleExitCondition {
  id: string;
  type: ExitConditionType;
  label: string;
  days?: number;
  percent?: number;
  withinDays?: number;
}

export interface GroupedCondition<
  T extends SimpleEntryCondition | SimpleExitCondition
> {
  id: string;
  isGroup: true;
  logic: LogicalOperator;
  conditions: Array<T | GroupedCondition<T>>;
  label: string;
}

export type DisplayableEntryCondition =
  | SimpleEntryCondition
  | GroupedCondition<SimpleEntryCondition>;
export type DisplayableExitCondition =
  | SimpleExitCondition
  | GroupedCondition<SimpleExitCondition>;

// New structured interfaces for backend
export interface IStockSelectionParams {
  name: string;
  memo: string;
  stockCodes: string[];
}

export interface ISimulationPeriodParams {
  name: string;
  memo: string;
  startDate: string; // "yyyy-MM-dd"形式
  endDate: string; // "yyyy-MM-dd"形式
}

export interface ITradeFilterParams {
  name: string;
  memo: string;
  maxPurchaseAmount: number;
  minVolume: number;
  tradeUnit: number;
}

export interface IEntrySignParams {
  entryConditions: DisplayableEntryCondition[]; // Backend-formatted condition list
  globalEntryConditionLogic: "AND" | "OR";
}

export interface IExitSignParams {
  exitConditions: DisplayableExitCondition[]; // Backend-formatted condition list
}

export interface IFeeTaxParams {
  name: string;
  memo: string;
  buyFeeRate: number; // 0-1の範囲 (例: 0.005)
  sellFeeRate: number; // 0-1の範囲 (例: 0.005)
  taxRate: number; // 0-1の範囲 (例: 0.20315)
}

// Overall simulation request interface
export interface ISimulationRequestParams {
  userId: string;
  name: string;
  memo: string;
  stockSelection: IStockSelectionParams;
  simulationPeriod: ISimulationPeriodParams;
  tradeFilter: ITradeFilterParams;
  signs: {
    name: string;
    memo: string;
    transactionType: TransactionDirection;
    entry: IEntrySignParams;
    entry_name: string;
    entry_memo: string;
    exit: IExitSignParams;
    exit_name: string;
    exit_memo: string;
  };
  feeTax: IFeeTaxParams;
}
