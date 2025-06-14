// src/app/action/getCompanyInfo.ts (または適切なパス)
"use server";

import yf from "yahoo-finance2"; // yahoo-finance2をインポート
import { CompanyInfo } from "@/types/company"; // 既存の型をインポート (型定義は後述)
import { createClient } from "@/util/supabase/server";

// spt_stocks テーブルのレコード型 (必要に応じて型定義ファイルに移動)
interface SptStockRecord {
  code: string;
  name: string;
  market: string | null;
  industry: string | null;
  // 他の spt_stocks のカラムも必要に応じて追加
}

/**
 * Yahoo Financeから企業情報を取得するサーバーアクション
 * @param symbol 銘柄コード (例: "7203.T" - 日本株の場合 .T をつける)
 * @returns 企業情報オブジェクトまたはエラー
 */
export async function getCompanyInfo(
  symbol: string
): Promise<{ data?: CompanyInfo; error?: string }> {
  try {
    // const supabase = await fetchStockDetailsFromDB();
    const supabase = await createClient();
    // spt_stocks検索用の銘柄コード (例: "7203.T" -> "7203", "AAPL" -> "AAPL")
    const dbSymbol = symbol.replace(/\.T$/, "");

    console.log(
      `[getCompanyInfo] Fetching data from spt_stocks for symbol: ${dbSymbol}`
    );
    const { data: sptStockData, error: sptStockError } = await supabase
      .from("spt_stocks")
      .select("code, name, market, industry")
      .eq("code", dbSymbol)
      .maybeSingle<SptStockRecord>(); // 単一のレコードまたはnullを取得

    if (sptStockError) {
      console.warn(
        `[getCompanyInfo] Error fetching from spt_stocks for ${dbSymbol}:`,
        sptStockError.message
      );
      // エラーがあっても処理を続行し、Yahoo Financeからの取得を試みる
    }
    if (sptStockData) {
      console.log(
        `[getCompanyInfo] Found data in spt_stocks for ${dbSymbol}:`,
        sptStockData
      );
    }

    // Yahoo Financeは日本の銘柄の場合、一般的に ".T" をサフィックスとして要求します。
    // symbolがすでに .T を含んでいるか確認し、含んでいなければ追加します。
    const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.T`; // .T 以外にも .L などがあるため、より汎用的に
    console.log(
      `[getCompanyInfo] Fetching company info for: ${yahooSymbol} using yahoo-finance2`
    );

    // Yahoo Financeから必要な情報を取得
    // ここでは主に modules: ['summaryProfile', 'assetProfile', 'price'] を取得します
    const result = await yf.quoteSummary(yahooSymbol, {
      modules: ["summaryProfile", "assetProfile", "price", "summaryDetail"],
    });

    // spt_stocksにもYahoo Financeにも情報がない場合はエラー
    if (!sptStockData && !result?.price) {
      console.error(
        `[getCompanyInfo] No data found for symbol: ${yahooSymbol}`
      );
      return {
        error: `指定された銘柄コード (${symbol}) の情報が見つかりませんでした。`,
      };
    }
    if (result?.price) {
      // console.log(
      //   `[getCompanyInfo] Yahoo Finance price data for ${yahooSymbol}:`,
      //   result.price
      // );
    }

    // 取得したデータをCompanyInfo型にマッピング
    const companyData: CompanyInfo = {
      symbol: symbol, // 元の銘柄コード
      name:
        sptStockData?.name ||
        result?.price?.longName ||
        result?.price?.shortName ||
        "不明な企業名",
      shortName:
        sptStockData?.name || result?.price?.shortName || "不明な会社名",
      longName:
        sptStockData?.name || result?.price?.longName || "不明な正式名称",
      industry:
        sptStockData?.industry || result?.assetProfile?.industry || "不明",
      sector: result?.assetProfile?.sector || "不明",
      fullTimeEmployees: result?.summaryProfile?.fullTimeEmployees || 0,
      longBusinessSummary: result?.summaryProfile?.longBusinessSummary || "N/A",
      city: result?.summaryProfile?.city || "N/A",
      country: result?.summaryProfile?.country || "N/A",
      website: result?.summaryProfile?.website || "N/A",
      // その他、必要な情報があれば追加
      currentPrice: result?.price?.regularMarketPrice || 0,
      state: result?.summaryProfile?.state || "N/A",
      zip: result?.summaryProfile?.zip || "N/A",
      phone: result?.summaryProfile?.phone || "N/A",
      address1: result?.summaryProfile?.address1 || "N/A",
      marketCap: result?.summaryDetail?.marketCap || 0,
      currency: result?.price?.currency || "JPY",
      exchange: sptStockData?.market || result?.price?.exchangeName || "不明",
    };

    console.log(
      `[getCompanyInfo] Successfully fetched info for ${companyData.name}`
    );
    return { data: companyData };
  } catch (error: unknown) {
    console.error(
      `[getCompanyInfo] Error fetching company info for ${symbol}:`,
      error
    );
    let errorMessage = "企業情報の取得中にエラーが発生しました。";
    if (error instanceof Error) {
      errorMessage = `企業情報の取得中にエラーが発生しました: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage = `企業情報の取得中にエラーが発生しました: ${error}`;
    }
    return {
      error: errorMessage,
    };
  }
}
