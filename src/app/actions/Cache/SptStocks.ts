// actions.ts (サーバーアクション)
"use server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getSptStocksCache() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const errorMessage =
      "SupabaseのURLまたは匿名キーが環境変数に設定されていません。";
    console.error(errorMessage);
    // 設定がない場合はアプリケーションが正しく動作しないため、エラーをスローします。
    throw new Error(errorMessage);
  }

  const allStocks = [];
  let offset = 0;
  const limit = 1000; // 一度に取得する最大件数 (PostgRESTのデフォルト上限)

  try {
    while (true) {
      // offsetとlimitを使って取得範囲を指定
      const url = `${SUPABASE_URL}/rest/v1/spt_stocks?select=*&offset=${offset}&limit=${limit}`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600 }, // 1時間キャッシュ
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error(
          "Failed to fetch stocks:",
          res.status,
          res.statusText,
          errorBody
        );
        throw new Error("銘柄データの取得に失敗しました。");
      }

      const stocks = await res.json();
      allStocks.push(...stocks);

      if (stocks.length < limit) {
        // 取得した件数がlimitより少なければ、それが最後のページなのでループを抜ける
        break;
      }

      offset += limit;
    }
    return allStocks;
  } catch (error) {
    console.error("Error in getSptStocksCache:", error);
    return []; // エラーが発生した場合は空の配列を返す
  }
}
