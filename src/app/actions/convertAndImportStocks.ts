"use server";

// Supabaseクライアントの初期化
// 環境変数からSUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを取得します
// .env.local ファイルに以下のように設定してください:
//
// サービスロールキーはSupabaseの「Project Settings」->「API Keys」で取得できます。
// これを使うことで、RLSポリシーに左右されずに（バイパスして）DB操作が可能です。
// ただし、このキーは絶対にクライアントサイドに公開しないでください。
import { createClient } from "@/util/supabase/server";

// jpx_company_master のレコード型
interface JpxCompanyMasterRecord {
  code: string;
  company_name: string;
  market_segment: string;
  industry_33_code: string | null;
  industry_33_name: string | null;
  industry_17_code: string | null;
  industry_17_name: string | null;
  scale_code: string | null;
  scale_name: string | null;
  updated_at: string; // ISO形式の文字列として受け取る
}

// spt_stocks のレコード型
interface SptStockRecord {
  code: string;
  name: string;
  market: string | null;
  industry: string | null;
  tradable: boolean;
  listing_date: string | null; // 現在のデータにlisting_dateがないため、NULLで処理
  created_at: string;
  updated_at: string;
}

async function fetchAllJpxCompanyMasterData(): Promise<
  JpxCompanyMasterRecord[]
> {
  const supabase = await createClient();
  const allData: JpxCompanyMasterRecord[] = [];
  let offset = 0;
  const limit = 1000; // 一度に取得する件数。Supabaseのデフォルト上限に合わせる
  let totalCount = Infinity; // 初期値は無限大としておく

  console.log(
    "[fetchAllJpxCompanyMasterData] Fetching all data from jpx_company_master with pagination..."
  );

  while (allData.length < totalCount) {
    const { data, error, count } = await supabase
      .from("jpx_company_master")
      .select("*", { count: "exact" }) // count: 'exact' で総件数を取得
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(
        "[fetchAllJpxCompanyMasterData] Error fetching page:",
        error
      );
      throw error; // エラーを投げて呼び出し元で処理
    }

    if (data) {
      allData.push(...(data as JpxCompanyMasterRecord[])); // 型アサーション
      if (count !== null && totalCount === Infinity) {
        // 最初の取得で総件数を設定
        totalCount = count;
        console.log(
          `[fetchAllJpxCompanyMasterData] Total records to fetch: ${totalCount}`
        );
      }
    }
    offset += limit;
    if (
      !data ||
      data.length < limit ||
      (count !== null && allData.length >= count)
    )
      break;
  }
  console.log(
    `[fetchAllJpxCompanyMasterData] Successfully fetched ${allData.length} records.`
  );
  return allData;
}

// convertAndImportStocks関数の戻り値のdataフィールドの型
interface ConvertAndImportResultData {
  successCount?: number;
  totalCount?: number;
}

/**
 * jpx_company_master から spt_stocks へデータを変換・インポートするサーバーアクション
 * @returns 処理結果のメッセージ
 */
export async function convertAndImportStocks(): Promise<{
  success: boolean;
  message: string;
  data?: ConvertAndImportResultData;
}> {
  try {
    console.log(
      "[convertAndImportStocks] Starting conversion and import process..."
    );

    // 1. jpx_company_master から全てのデータを取得
    let jpxData: JpxCompanyMasterRecord[];
    try {
      // Supabaseクライアントを渡してヘルパー関数を呼び出す
      jpxData = await fetchAllJpxCompanyMasterData();
    } catch (fetchError: unknown) {
      console.error(
        "[convertAndImportStocks] Error fetching from jpx_company_master:",
        fetchError
      );
      let errorMessage = "予期せぬエラーが発生しました。";
      if (fetchError instanceof Error) {
        errorMessage = `予期せぬエラーが発生しました: ${fetchError.message}`;
      } else if (typeof fetchError === "string") {
        errorMessage = `予期せぬエラーが発生しました: ${fetchError}`;
      }
      return {
        success: false,

        message: errorMessage,
      };
    }

    // 2. データを spt_stocks の形式に変換
    const sptStocksData: SptStockRecord[] = jpxData.map(
      (jpxRecord: JpxCompanyMasterRecord) => ({
        code: jpxRecord.code,
        name: jpxRecord.company_name,
        // market_segment を market にマッピング
        market:
          jpxRecord.market_segment === "-" ? null : jpxRecord.market_segment,
        // industry_33_name を industry にマッピング（または industry_17_name を使うか選択）
        industry:
          jpxRecord.industry_33_name === "-"
            ? null
            : jpxRecord.industry_33_name,
        tradable: true, // デフォルトでTRUEとする
        listing_date: null, // jpx_company_masterにlisting_dateがないため、ここではNULL
        created_at: new Date().toISOString(), // 現在時刻をISO形式で設定
        updated_at: new Date().toISOString(), // 現在時刻をISO形式で設定
      })
    );

    // 3. spt_stocks テーブルにUPSERT（挿入または更新）
    // 大量データのため、バッチ処理で実行
    const BATCH_SIZE = 500; // Supabaseはデフォルトで1000件のバッチサイズを推奨しますが、安全のため500に設定
    let successCount = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < sptStocksData.length; i += BATCH_SIZE) {
      const batch = sptStocksData.slice(i, i + BATCH_SIZE);
      console.log(
        `[convertAndImportStocks] Importing batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }/${Math.ceil(sptStocksData.length / BATCH_SIZE)} (${
          batch.length
        } records)...`
      );

      const { error: upsertError } = await supabase
        .from("spt_stocks")
        .upsert(batch, { onConflict: "code", ignoreDuplicates: false }); // codeが競合したら更新

      if (upsertError) {
        console.error(
          `[convertAndImportStocks] Error during upsert of batch ${
            Math.floor(i / BATCH_SIZE) + 1
          }:`,
          upsertError
        );
        errorMessages.push(
          `バッチ ${
            Math.floor(i / BATCH_SIZE) + 1
          } のインポート中にエラーが発生しました: ${upsertError.message}`
        );
      } else {
        successCount += batch.length;
      }
    }

    if (errorMessages.length > 0) {
      return {
        success: false,
        message: `一部のデータのインポートに失敗しました: ${errorMessages.join(
          "; "
        )}`,
        data: { successCount, totalCount: sptStocksData.length },
      };
    } else {
      console.log(
        `[convertAndImportStocks] Successfully imported ${successCount} records into spt_stocks.`
      );
      return {
        success: true,
        message: `全 ${successCount} 件のデータを正常にspt_stocksにインポートしました。`,
      };
    }
  } catch (error: unknown) {
    console.error(
      "[convertAndImportStocks] Unexpected error during conversion and import:",
      error
    );
    let errorMessage = "予期せぬエラーが発生しました。";
    if (error instanceof Error) {
      errorMessage = `予期せぬエラーが発生しました: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage = `予期せぬエラーが発生しました: ${error}`;
    }
    return {
      success: false,
      message: errorMessage,
    };
  }
}
