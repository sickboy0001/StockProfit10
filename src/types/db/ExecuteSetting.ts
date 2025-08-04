// src/types/db/ExecuteSetting.ts
export interface ExecuteSetting {
  id: number;
  analysis_condition_id: number;
  name: string;
  start_date: string;
  end_date: string;
  excute_end_date: string | null;
  is_auto_enabled: boolean;
  is_active: boolean;
  send_mail_to: string | null;
  created_at: string;
  updated_at: string;
  // // 以下はRPCから返される追加プロパティの例
  // plan_name: string; // `name` のエイリアスかもしれません
  // plan_memo: string | null;
  // stock_selection_name: string | null;
  // simulation_period_name: string | null;
  // trade_parameter_name: string | null;
  // profit_rate: number | null;
  // // ...その他必要なプロパティ
}
