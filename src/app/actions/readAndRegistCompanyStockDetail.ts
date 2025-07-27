"use server"; // Next.js Server Actionとしてマークする場合

import { createClient } from "@/util/supabase/server"; // Supabaseクライアントのインポートパスを実際のプロジェクトに合わせてください
import { fetchStockFromYahoo } from "./yfinance/yFinanceService";

// spt_company_stock_details テーブルの型定義 (実際のカラムに合わせて調整してください)
interface CompanyStockDetail {
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
  updated_at: string; // YYYY-MM-DD
  // fetchStockFromYahooから返されるが、テーブルスキーマに含まれない可能性のある追加フィールド
  // [key: string]: any;
}

//spt_company_stock_detailsからデータ取得、なければ、YFinanceからログの取得する動き
//対象の日付は１週間を想定
export async function readAndRegistCompanyStockDetail(
  code: string
): Promise<CompanyStockDetail | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 既存データを取得
  const { data: existingData, error: fetchError } = await supabase
    .from("spt_company_stock_details")
    .select("*")
    .eq("code", code)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116は「行が見つからない」エラーで、この場合は問題ない（新規作成される）
    console.error(
      `Error fetching existing stock detail for ${code}:`,
      fetchError
    );
    throw new Error(
      `既存の株式詳細データの取得中にエラーが発生しました: ${fetchError.message}`
    );
  }

  const existing = existingData as CompanyStockDetail | null;

  // 1週間前の日付を計算
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoString = oneWeekAgo.toISOString().slice(0, 10);

  // updated_at が1週間以内のデータであれば、DBのデータを返す
  if (existing && existing.updated_at >= oneWeekAgoString) {
    console.log(
      `Returning existing, up-to-date (within 1 week) stock detail for ${code} from DB.`
    );
    return existing;
  }

  // 最新データ取得
  console.log(`Fetching latest stock detail for ${code} from Yahoo Finance.`);
  const latest = await fetchStockFromYahoo(code); // fetchStockFromYahooはCompanyStockDetailの一部または互換性のある型を返すと仮定
  if (!latest) {
    console.error(`Failed to fetch latest stock detail for ${code}.`);
    throw new Error("最新の株式詳細データの取得に失敗しました。");
  }

  // console.log(
  //   `[dateToUpsert] latest for ${latest.code}:`,
  //   JSON.stringify(latest, null, 2)
  // );

  // DBを更新（UPSERT）
  // `latest` オブジェクトには `updated_at: today` が含まれていることを期待
  // また、`ticker` も含める必要がある
  const dataToUpsert: CompanyStockDetail = {
    code, // codeを明示的に含める
    ...(latest as Omit<CompanyStockDetail, "code">), // latestの型を調整
    updated_at: today, // 念のため上書き、またはlatestがこれを含んでいることを確認
  };

  // DBの整数型カラムに挿入するために、浮動小数点数になる可能性のある値を丸める
  // エラー報告のあった min_price や、同様の問題が起こりうる値を対象とする
  const keysToRound: (keyof Pick<
    CompanyStockDetail,
    | "min_price"
    | "high_price_ytd"
    | "low_price_ytd"
    | "market_cap"
    | "issued_shares"
    | "unit_shares"
  >)[] = [
    "min_price",
    "high_price_ytd",
    "low_price_ytd",
    "market_cap",
    "issued_shares",
    "unit_shares",
  ];

  for (const key of keysToRound) {
    const value = dataToUpsert[key];
    if (typeof value === "number") {
      dataToUpsert[key] = Math.round(value);
    }
  }

  console.log(
    `[dateToUpsert] for ${dataToUpsert.code}:`,
    JSON.stringify(dataToUpsert, null, 2)
  );

  console.log(`Upserting stock detail for ${code} into DB.`);
  const { data: upsertedData, error: upsertError } = await supabase
    .from("spt_company_stock_details")
    .upsert(dataToUpsert, { onConflict: "code" })
    .select() // upsert後にデータを返したい場合
    .single(); // 1行だけ更新/挿入されるはず

  if (upsertError) {
    console.error(`Error upserting stock detail for ${code}:`, upsertError);
    throw new Error(
      `株式詳細データの更新中にエラーが発生しました: ${upsertError.message}`
    );
  }

  console.log(`Successfully upserted stock detail for ${code}.`);
  // upsertedData が null の場合も考慮 (例: RLSでselect権限がない場合など)
  // 基本的には upsert したデータ (latest に基づく) を返すのが適切
  return upsertedData || dataToUpsert;
}
