"use server";
import { createClient } from "@/util/supabase/server";

// Server Actionであることを示す

// 銘柄の日付期間の型定義
interface DailyQuotePeriod {
  code: string;
  min_date: string; // 最小日付 (YYYY-MM-DD)
  max_date: string; // 最大日付 (YYYY-MM-DD)
}

/**
 * spt_daily_quotesテーブルから、各銘柄コードの日付範囲（最小日付と最大日付）を取得します。
 * これは、株価データがデータベースにいつからいつまで存在するかを示すために使用されます。
 *
 * @returns DailyQuotePeriodの配列、またはエラーオブジェクト
 */
export async function getDailyQuotesPeriodsAction(): Promise<
  DailyQuotePeriod[] | { error: string }
> {
  try {
    const supabase = await createClient();
    // ユーザーが提供したクエリをSupabaseクライアントで実行
    // .select()に集計関数を含めると、自動的にGROUP BYが適用されます
    const { data, error } = await supabase.rpc("get_all_daily_quotes_periods");

    if (error) {
      console.error(
        "Supabaseクエリエラー (getDailyQuotesPeriodsAction):",
        error.message
      );
      return { error: "日次株価期間データの取得に失敗しました。" };
    }

    // データが null の場合は空の配列を返す
    if (!data) {
      return [];
    }
    // RPCからのデータは直接 DailyQuotePeriod[] と互換性があるはずです。
    // SQL関数内でエイリアス (min_date, max_date) を使用しているため、
    // item.min_date や item.max_date として直接アクセスできます。
    // SQL関数がNULLを返す可能性がある場合、または "N/A" をフォールバックとして保持したい場合は、
    // ここでその処理を追加できますが、SQL関数側でTEXTにキャストして対応済みです。
    const formattedData: DailyQuotePeriod[] = data.map(
      (item: {
        code: string;
        min_date: string | null;
        max_date: string | null;
      }) => ({
        code: item.code,
        min_date: item.min_date || "N/A", // SQL関数がNULLを返す場合に備える
        max_date: item.max_date || "N/A", // SQL関数がNULLを返す場合に備える
      })
    );
    return formattedData;
  } catch (err: unknown) {
    console.error(
      "Server Action 'getDailyQuotesPeriodsAction' で予期せぬエラー:",
      err
    );
    let errorMessage =
      "日次株価期間データの取得中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `日次株価期間データの取得中にサーバーエラーが発生しました: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = `日次株価期間データの取得中にサーバーエラーが発生しました: ${err}`;
    }
    return { error: errorMessage };
  }
}
