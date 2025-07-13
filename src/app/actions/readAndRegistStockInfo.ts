import { CompanyInfo } from "@/types/company";
import { getCompanyInfo } from "./company"; // 既存の企業情報取得アクション

/**
 * 企業情報を取得するヘルパー関数
 * @param symbol 銘柄コード
 * @returns 企業情報、成功/エラーメッセージ
 */
export async function fetchCompanyInfo(symbol: string): Promise<{
  companyInfo: CompanyInfo | null;
  successMessage: string | null;
  errorMessage: string | null;
}> {
  try {
    const companyInfoResponse = await getCompanyInfo(symbol);
    if (companyInfoResponse.error) {
      return {
        companyInfo: null,
        successMessage: null,
        errorMessage: `企業情報取得エラー: ${companyInfoResponse.error}`,
      };
    }
    if (companyInfoResponse.data) {
      return {
        companyInfo: companyInfoResponse.data,
        successMessage: `企業情報 (${symbol}: ${companyInfoResponse.data.name}) を取得しました。`,
        errorMessage: null,
      };
    }
    return {
      companyInfo: null,
      successMessage: `企業情報 (${symbol}) は見つかりませんでした。`,
      errorMessage: null,
    };
  } catch (e: unknown) {
    return {
      companyInfo: null,
      successMessage: null,
      errorMessage: `企業情報取得中に予期せぬエラー: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }
}
