"use server";

import { getJQuantsAccessToken } from "./jquantsAuth";

// src/lib/api/jquantsCompanyService.ts (新しいサービスファイル)

export interface JQuantsCompanyCodeInfo {
  Code: string;
  CompanyName: string; // 企業名（日本語）
  CompanyNameEng: string; // 企業名（英語）
  MarketCode: string;
  MarketSegment: string; // 市場区分
  SectorCode: string;
  SectorName: string; // 業種名（日本語）
  SectorNameEng: string; // 業種名（英語）
  Date: string; // データの基準日 (YYYY-MM-DD)
  // 他のフィールドも含まれる可能性があります
}

/**
 * J-Quants API から銘柄マスターデータを取得し、特定の銘柄情報を抽出する
 * @param code 取得したい銘柄コード
 * @returns 銘柄情報オブジェクト、または null
 */
export async function fetchJQuantsCompanyInfo(
  stockCode: string
): Promise<JQuantsCompanyCodeInfo | null> {
  const accessToken = await getJQuantsAccessToken(); // アクセストークンを取得
  if (!accessToken) {
    console.error("Failed to get J-Quants access token.");
    return null;
  }

  const endpoint = "https://api.jquants.com/v1/companies/codes";

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // J-Quants APIはGETリクエストでクエリパラメータをあまり使わない（全件取得が多い）
      // 必要に応じて日付フィルタなどを適用する
    });

    if (!response.ok) {
      console.error(
        `Error fetching J-Quants company codes: ${response.status} ${response.statusText}`
      );
      const errorBody = await response.text();
      console.error("Error details:", errorBody);
      throw new Error(`J-Quants API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const companyCodes: JQuantsCompanyCodeInfo[] = data.codes; // data.codes に配列が入る

    // 取得した全銘柄情報から、指定された銘柄コードの情報を探す
    const targetCompany = companyCodes.find((item) => item.Code === stockCode);

    return targetCompany || null;
  } catch (error) {
    console.error(`Error in fetchJQuantsCompanyInfo for ${stockCode}:`, error);
    return null;
  }
}

// usage example in a Server Action:
/*
import { fetchJQuantsCompanyInfo } from '@/lib/api/jquantsCompanyService';

export async function getCompanyDetailFromJQuants(code: string): Promise<{ companyInfo?: JQuantsCompanyCodeInfo; error?: string }> {
  try {
    const info = await fetchJQuantsCompanyInfo(code);
    if (!info) {
      return { error: 'J-Quantsから企業情報が見つかりませんでした。' };
    }
    return { companyInfo: info };
  } catch (error) {
    console.error('Error in getCompanyDetailFromJQuants:', error);
    return { error: `J-Quants企業情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}` };
  }
}
*/
