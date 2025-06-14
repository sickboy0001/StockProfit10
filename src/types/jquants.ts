export interface JQuantsCompanyCodeInfo {
  Code: string; // 銘柄コード
  CompanyName: string; // 企業名
  CompanyNameEnglish?: string; // 企業名（英語）
  Sector17CodeName?: string; // TOPIX-17業種名
  Sector33CodeName?: string; // TOPIX-33業種名
  ScaleCategory?: string; // TOPIX Size区分(規模区分)
  MarketCodeName?: string; // 市場名
  Website?: string; // ウェブサイト
  HeadOfficeLocation?: string; // 本店所在地
}
