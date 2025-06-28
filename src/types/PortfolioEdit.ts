// src/types/PortfolioEdit.ts

// ポートフォリオ編集モーダルに渡すための汎用的なデータ型
export interface PortfolioEditData {
  id: string;
  name: string;
  memo: string | null;
}
