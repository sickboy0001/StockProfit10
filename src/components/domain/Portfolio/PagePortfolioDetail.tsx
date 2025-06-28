"use client";
// components/domain/Portfolio/PagePortfolioDetail.tsx
import { notFound } from "next/navigation";
import { PortfolioDetail } from "./PortfolioDetail";
import { readPortfolioDetailAction } from "@/app/actions/PortfolioDetail"; // Server Actionをインポート
import { PortfolioDetailData } from "@/types/PortfolioDetail"; // 型をインポート

// Next.jsのdynamic segmentsからportfolio_idを受け取る
interface PagePortfolioDetailProps {
  params: {
    portfolio_id: string;
  };
}

export default async function PagePortfolioDetail({
  params,
}: PagePortfolioDetailProps) {
  const { portfolio_id } = params;

  // Server Actionを呼び出してポートフォリオ詳細データを取得
  const result = await readPortfolioDetailAction(portfolio_id);

  if ("error" in result) {
    console.error("Failed to fetch portfolio detail:", result.error);
    // エラーハンドリング（例: 404ページを表示）
    notFound();
  }

  const initialPortfolioDetail: PortfolioDetailData = result;

  return <PortfolioDetail initialPortfolioDetail={initialPortfolioDetail} />;
}
