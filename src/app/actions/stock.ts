// src/app/action/stock.ts
"use server";

import { FetchStockData as fetchStockData } from "./yfinance/yFinanceService";
import { DailyQuote as yahooDailyQuote } from "@/types/yFinance";
import { DailyQuote } from "@/types/stock";
// 修正：supabase を直接インポートする代わりに、createServerSupabaseClient をインポート
// import { createServerSupabaseClient } from "@/lib/db/supabase";
import { createClient } from "@/util/supabase/server";
import { StockDetails } from "@/types/stock"; // 既存の型をインポート
import moji from "moji";
/**
 * Yahoo Finance APIから株価データを取得し、整形して返すサーバーアクション
 * @param symbol 銘柄コード
 * @param startDate 開始日 (YYYY-MM-DD)
 * @param endDate 終了日 (YYYY-MM-DD)
 * @returns 整形された株価データの配列
 */
export async function getAndParseStockData(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<{ data?: yahooDailyQuote[]; error?: string }> {
  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.T`; // .T 以外にも .L などがあるため、より汎用的に
  console.log(
    `[getAndParseStockData] Fetching company info for: ${yahooSymbol} using yahoo-finance2`
  );

  try {
    const apiResponse = await fetchStockData(yahooSymbol, startDate, endDate);

    if (apiResponse.chart.error) {
      return {
        error:
          apiResponse.chart.error.description ||
          "APIからのエラーが発生しました。",
      };
    }

    if (!apiResponse.chart.result || apiResponse.chart.result.length === 0) {
      return {
        error: "指定された銘柄または期間のデータが見つかりませんでした。",
      };
    }

    const result = apiResponse.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const dailyQuotes: yahooDailyQuote[] = timestamps.map((ts, index) => ({
      code: symbol,
      date: new Date(ts * 1000).toISOString().split("T")[0], // Unix timestamp to YYYY-MM-DD
      open: quotes.open[index] || null,
      high: quotes.high[index] || null,
      low: quotes.low[index] || null,
      close: quotes.close[index] || null,
      volume: quotes.volume[index] || null,
    }));

    return { data: dailyQuotes };
  } catch (err: unknown) {
    console.error("Error fetching or parsing stock data:", err);
    let errorMessage = "データの取得中にエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `データの取得中にエラーが発生しました: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = `データの取得中にエラーが発生しました: ${err}`;
    }
    return { error: errorMessage };
  }
}

/**
 * 整形された株価データをデータベースに登録するサーバーアクション
 * @param dailyQuotes 登録する日次株価データの配列
 * @returns 登録結果
 */
export async function saveDailyQuotesToDb(
  dailyQuotes: yahooDailyQuote[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  // 修正：createServerSupabaseClient を呼び出してクライアントインスタンスを取得
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("spt_daily_quotes")
      .upsert(dailyQuotes, { onConflict: "code,date", ignoreDuplicates: false }) // 銘柄コードと日付が重複したら更新
      .select("code,date"); // 登録/更新された行のcodeとdateを取得して件数カウントに利用

    if (error) {
      console.error("Error saving daily quotes to DB:", error);
      return {
        success: false,
        error: `データベース登録エラー: ${error.message}`,
      };
    }

    return { success: true, count: data?.length || 0 };
  } catch (err: unknown) {
    console.error("Unexpected error during DB save:", err);

    let errorMessage = "データの取得中にエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `データの取得中にエラーが発生しました: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = `データの取得中にエラーが発生しました: ${err}`;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * 指定された銘柄と期間の日次株価データをデータベースから取得します。
 * @param stockCode 銘柄コード
 * @param startDate 開始日 (YYYY-MM-DD)
 * @param endDate 終了日 (YYYY-MM-DD)
 * @returns DailyQuote[] またはエラーメッセージ
 */
export async function getDailyQuotes(
  stockCode: string,
  startDate: string,
  endDate: string
): Promise<DailyQuote[] | { error: string }> {
  const supabase = await createClient();

  // データベースから直接取得する際の行の型
  interface RawDailyQuoteRecord {
    date: string;
    open: string | number | null;
    high: string | number | null;
    low: string | number | null;
    close: string | number | null;
    volume: string | number | null;
  }

  try {
    const { data, error } = await supabase
      .from("spt_daily_quotes")
      .select("date, open, high, low, close, volume")
      .eq("code", stockCode)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true }); // 日付順にソート

    if (error) {
      console.error("Error fetching daily quotes:", error.message);
      return { error: "株価データの取得に失敗しました。" };
    }

    // データベースから取得したデータを型に合うように変換
    const dailyQuotes: DailyQuote[] = data.map((d: RawDailyQuoteRecord) => ({
      code: stockCode, // `code`はselectで取得していないが、DailyQuote型に必要なので追加
      date: d.date,
      open: d.open !== null ? parseFloat(String(d.open)) : null,
      high: d.high !== null ? parseFloat(String(d.high)) : null,
      low: d.low !== null ? parseFloat(String(d.low)) : null,
      close: d.close !== null ? parseFloat(String(d.close)) : null,
      volume: d.volume !== null ? parseInt(String(d.volume), 10) : null,
    }));

    return dailyQuotes;
  } catch (err: unknown) {
    console.error("Unexpected error in getDailyQuotes:", err);
    let errorMessage = "データの取得中にエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `データの取得中にエラーが発生しました: ${err.message}`;
    } else if (typeof err === "string") {
      errorMessage = `データの取得中にエラーが発生しました: ${err}`;
    }
    return { error: errorMessage };
  }
}

export async function recordStockView(userId: string, stockCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("spt_stock_view_history").insert({
    user_id: userId,
    stock_code: stockCode,
    // viewed_atはSQLスキーマの定義によりnow()がデフォルトで設定されます
  });

  if (error) {
    console.error("銘柄閲覧履歴の記録エラー:", error);
    // エラーを適切に処理する (例: スローするか、エラーオブジェクトを返すか)
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export interface RecentViewedStockInfo {
  stock_code: string;
  company_name: string;
}

export async function fetchRecentViewedStockCodes(
  userId: string,
  limit: number = 5
): Promise<{
  success: boolean;
  data: RecentViewedStockInfo[];
  error: string | null;
}> {
  "use server"; // Next.js Server Actionとしてマーク
  const supabase = await createClient();

  if (!userId) {
    return { success: false, error: "User ID is required.", data: [] };
  }
  try {
    // spt_stock_view_history テーブルから閲覧履歴を取得
    // viewed_at で降順にソートし、ある程度の件数を取得してメモリ上でユニーク処理を行う
    // limit の数倍 (例: 5倍、ただし最低でも20件程度) を取得して、ユニークな銘柄コードが limit 件に達するようにする
    const recordsToFetch = Math.max(20, limit * 5);

    const { data: historyRecords, error: historyError } = await supabase
      .from("spt_stock_view_history")
      .select("stock_code")
      .eq("user_id", userId)
      .not("stock_code", "like", "%.T") // ".T"で終わるstock_codeを除外
      .order("viewed_at", { ascending: false })
      .limit(recordsToFetch);

    if (historyError) {
      console.error("Error fetching stock view history from DB:", historyError);
      return {
        success: false, // Corrected: should be false on error
        error: `Failed to fetch stock view history: ${historyError.message}`,
        data: [],
      };
    }

    if (!historyRecords || historyRecords.length === 0) {
      return { success: true, data: [], error: null };
    }

    // Filter out any potential null/undefined stock_codes and get unique codes in order of appearance
    const validStockCodesFromHistory = historyRecords
      .map((record) => record.stock_code)
      .filter(
        (code): code is string => typeof code === "string" && code.length > 0
      );

    const allOrderedUniqueStockCodes = Array.from(
      new Set(validStockCodesFromHistory)
    );

    if (allOrderedUniqueStockCodes.length === 0) {
      return { success: true, data: [], error: null };
    }

    // We only need to fetch company names for the top 'limit' unique stock codes
    const codesToQueryNamesFor = allOrderedUniqueStockCodes.slice(0, limit);

    // Fetch company names for these unique stock codes
    const { data: companyDetails, error: companyError } = await supabase
      .from("spt_stocks")
      .select("code, name")
      .in("code", codesToQueryNamesFor);

    let companyErrorMessage: string | null = null;
    if (companyError) {
      console.warn(
        "Error fetching company names from spt_stocks:",
        companyError.message
      );
      companyErrorMessage = `Partially failed to fetch some company names: ${companyError.message}`;
      // Proceeding, names for which fetch failed will be "不明"
    }

    // Create a map for quick lookup of company names
    const companyNameMap = new Map<string, string>();
    if (companyDetails) {
      companyDetails.forEach((detail) => {
        if (detail && detail.code && detail.name) {
          companyNameMap.set(detail.code, detail.name);
        }
      });
    }

    // Construct the result data
    const resultData: RecentViewedStockInfo[] = codesToQueryNamesFor.map(
      (code) => ({
        stock_code: code,
        company_name: companyNameMap.get(code) || "不明",
      })
    );

    return {
      success: true,
      data: resultData,
      error: companyErrorMessage,
    };
  } catch (error) {
    console.error("Error fetching recent viewed stock codes:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: `Failed to fetch stock view history: ${errorMessage}`,
      data: [],
    };
  }
}

/**
 * 指定された銘柄コードの基本情報をデータベース (spt_stocks) から取得します。
 * @param stockCode 銘柄コード
 * @returns StockDetailsFromDB | null またはエラーメッセージ
 */
export async function fetchStockDetailsFromDB(
  stockCode: string
): Promise<{ data: StockDetails | null; error: string | null }> {
  "use server";
  const supabase = await createClient();

  if (!stockCode) {
    return { data: null, error: "銘柄コードは必須です。" };
  }

  try {
    const { data, error } = await supabase
      .from("spt_stocks")
      .select(
        "code, name, market, industry, tradable, listing_date, created_at, updated_at"
      )
      .eq("code", stockCode)
      .single(); // 銘柄コードは主キーなので単一レコードを期待

    if (error) {
      if (error.code === "PGRST116") {
        // PostgREST error for "No rows found"
        return {
          data: null,
          error: "指定された銘柄コードの情報は見つかりませんでした。",
        };
      }
      console.error("Error fetching stock details from DB:", error);
      return {
        data: null,
        error: `データベースからの銘柄詳細の取得に失敗しました: ${error.message}`,
      };
    }
    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error fetching stock details from DB:", err);
    const errorMessage =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    return {
      data: null,
      error: `データベースからの銘柄詳細の取得中にエラーが発生しました: ${errorMessage}`,
    };
  }
}

// 新しい型定義 (検索結果用)
export interface SearchedStockInfo {
  code: string;
  name: string | null; // spt_stocks.name が nullable の場合
}

// ... (既存の recordStockView, fetchRecentViewedStockCodes, fetchStockDetailsFromDB アクション)

export async function searchStocksByName(
  searchText: string,
  limit: number = 10
): Promise<{ success: boolean; data?: SearchedStockInfo[]; error?: string }> {
  if (!searchText || searchText.trim().length < 2) {
    return { success: false, error: "検索文字列は2文字以上必要です。" };
  }
  const supabase = await createClient(); // createClient() は Promise を返すため await を追加

  const toHalfWidthFuzzy = (text: string) =>
    moji(text)
      .convert("ZE", "HE") // 全角英数を半角へ
      .convert("ZS", "HS") // 全角スペースを半角へ
      .convert("ZK", "HK") // 全角カタカナを半角へ
      .toString();

  const toFullWidthFuzzy = (text: string) =>
    moji(text)
      .convert("HE", "ZE") // 半角英数を全角へ
      .convert("HS", "ZS") // 半角スペースを全角へ
      .convert("HK", "ZK") // 半角カタカナを全角へ
      .toString();

  const searchTextNormalizedHalf = toHalfWidthFuzzy(searchText);
  const searchTextNormalizedFull = toFullWidthFuzzy(searchText);

  const patternHalf = `%${searchTextNormalizedHalf}%`;
  const patternFull = `%${searchTextNormalizedFull}%`;

  let queryBuilder = supabase.from("spt_stocks").select("code, name");

  if (searchTextNormalizedHalf === searchTextNormalizedFull) {
    // 正規化後も文字列が変わらない場合 (例: ひらがなのみ、漢字のみ)
    queryBuilder = queryBuilder.ilike("name", patternHalf);
  } else {
    queryBuilder = queryBuilder.or(
      `name.ilike.${patternHalf},name.ilike.${patternFull}`
    );
  }

  try {
    const { data: stocks, error } = await queryBuilder
      .limit(limit)
      .order("code", { ascending: true });
    if (error) {
      console.error("Error searching stocks by name:", error);
      return {
        success: false,
        error: `銘柄の検索中にエラーが発生しました: ${error.message}`,
      };
    }

    return { success: true, data: stocks || [] }; // stocks が null の場合は空配列を返す
  } catch (error: unknown) {
    // catch ブロックのエラー型を unknown に指定

    console.error("Error searching stocks by name:", error);
    let errorMessage = "銘柄の検索中に予期せぬエラーが発生しました。";
    if (error instanceof Error) {
      errorMessage = `銘柄の検索中にエラーが発生しました: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage = `銘柄の検索中にエラーが発生しました: ${error}`;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}
