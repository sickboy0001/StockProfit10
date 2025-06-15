// app/action/stock-history.ts
"use server"; // これをファイルの先頭に記述することで、Server Actionとして機能します

import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントのインポート
import { getDailyQuotesPeriodsAction } from "./DailyQuotes";

// Supabaseクライアントの初期化
// Server Actionはサーバーサイドで実行されるため、環境変数を直接安全に利用できます。
// ただし、Next.jsのServer Actionでは、通常NEXT_PUBLIC_プレフィックスなしの環境変数も利用可能ですが、
// ここではフロントエンドと共有するためにNEXT_PUBLIC_を使用します。
// 実際のデプロイ時には、Vercelのプロジェクト設定でこれらの環境変数を設定してください。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// get_period_stock_views 関数が返す行の型定義
// これはSupabaseのRPC関数の戻り値の型と一致させる必要があります
export interface PeriodStockView {
  stock_code: string;
  stock_name: string;
  stock_market: string | null; // NULL許容の型に合わせる
  stock_industry: string | null; // NULL許容の型に合わせる
  period_view_count: number; // BIGINTはTypeScriptではnumberで扱われることが多い
  latest_viewed_at_in_period: string; // TIMESTAMP WITH TIME ZONE は通常stringで扱われる
  data_acquisition_period: string; // ここにデータ取得期間が含まれます
}

interface GetPeriodStockViewsParams {
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  stockCode?: string | null;
  stockName?: string | null;
}

/**
 * 指定された期間とフィルター条件に基づいて、株価参照履歴の集計データを取得するServer Action。
 * この関数はSupabaseのPostgreSQL関数 'get_period_stock_views' を呼び出します。
 *
 * @param params フィルター条件を含むオブジェクト
 * @returns 集計された株価参照履歴の配列、またはエラーオブジェクト
 */
export async function getRawPeriodStockViewsAction(
  params: GetPeriodStockViewsParams
): Promise<PeriodStockView[] | { error: string }> {
  try {
    // SupabaseのRPC (Remote Procedure Call) メソッドを使って
    // PostgreSQL関数 'get_period_stock_views' を呼び出します。
    // 引数がundefined/nullの場合は、PostgreSQL関数のDEFAULT NULL設定が適用されます。
    const { data, error } = await supabase.rpc("get_period_stock_views", {
      start_date_param: params.startDate,
      end_date_param: params.endDate,
      stock_code_param: params.stockCode,
      stock_name_param: params.stockName,
    });

    // エラーハンドリング
    if (error) {
      console.error(
        "Supabase RPC 呼び出しエラー (get_period_stock_views):",
        error.message
      );
      return { error: "参照履歴データの取得に失敗しました。" };
    }

    // 取得したデータを返す
    return data as PeriodStockView[]; // 型アサーション
  } catch (err: unknown) {
    console.error(
      "Server Action 'getPeriodStockViewsAction' で予期せぬエラー:",
      err
    );
    let errorMessage = "データの取得中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `データの取得中にサーバーエラーが発生しました: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = `データの取得中にサーバーエラーが発生しました: ${err}`;
    }
    return { error: errorMessage };
  }
}

/**
 * 閲覧履歴と各銘柄のデータ取得期間をマージして返すServer Action。
 * `data_acquisition_period` を `getDailyQuotesPeriodsAction` の結果で更新します。
 *
 * @param params フィルター条件を含むオブジェクト
 * @returns `data_acquisition_period` が更新された株価参照履歴の配列、またはエラーオブジェクト
 */
export async function getPeriodStockViewsAction(
  params: GetPeriodStockViewsParams
): Promise<PeriodStockView[] | { error: string }> {
  try {
    // 1. 基本的な閲覧履歴データを取得
    const stockViewsResult = await getRawPeriodStockViewsAction(params);
    if ("error" in stockViewsResult) {
      return stockViewsResult; // エラーがあればそのまま返す
    }

    // 2. 全銘柄のデータ取得期間を取得
    const dailyQuotesPeriodsResult = await getDailyQuotesPeriodsAction();
    if ("error" in dailyQuotesPeriodsResult) {
      // エラーが発生しても、閲覧履歴データは返せるようにするかもしれないが、
      // data_acquisition_period が期待通りにならないため、ここではエラーとして扱う
      console.warn(
        "日次株価期間データの取得に失敗しましたが、閲覧履歴の取得は成功しています。data_acquisition_period は不正確かもしれません。",
        dailyQuotesPeriodsResult.error
      );
      // data_acquisition_period を更新せずに返すか、エラーとするか選択
      // ここではエラーとして処理を進めず、取得できた閲覧履歴をそのまま返す（data_acquisition_periodはRPCの結果のまま）
      // もし厳密にエラーとしたい場合は return dailyQuotesPeriodsResult;
    }

    const stockViews = stockViewsResult;
    const quotePeriodsMap: Map<string, string> = new Map();

    if (!("error" in dailyQuotesPeriodsResult)) {
      dailyQuotesPeriodsResult.forEach((period) => {
        quotePeriodsMap.set(
          period.code,
          `${period.min_date}~${period.max_date}`
        );
      });
    }

    // 3. 閲覧履歴データにデータ取得期間をマージ
    const enhancedStockViews = stockViews.map((view) => {
      const periodString = quotePeriodsMap.get(view.stock_code);
      return {
        ...view,
        // getDailyQuotesPeriodsAction から取得した期間で上書き、なければ元の値（または "N/A"など）
        data_acquisition_period:
          periodString || view.data_acquisition_period || "N/A",
      };
    });

    return enhancedStockViews;
  } catch (err: unknown) {
    console.error(
      "Server Action 'getEnhancedPeriodStockViewsAction' で予期せぬエラー:",
      err
    );
    let errorMessage =
      "拡張参照履歴データの取得中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `拡張参照履歴データの取得中にサーバーエラーが発生しました: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = `拡張参照履歴データの取得中にサーバーエラーが発生しました: ${err}`;
    }
    return { error: errorMessage };
  }
}
