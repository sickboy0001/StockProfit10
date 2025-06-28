// "use client";
// // app/portfolios/detail/[portfolio_id]/page.tsx
import PagePortfolioDetail from "@/components/domain/Portfolio/PagePortfolioDetail";
import React from "react"; // ページコンポーネントがサーバーコンポーネントの場合でも、Reactのインポートは問題ありません。

// Next.jsのDynamic Route Parametersを受け取るための型定義です。
// params は動的セグメント ([portfolio_id]) の値を持ちます。
// searchParams はクエリパラメータを受け取ります (オプション)。
// interface PortfolioDetailNoPageProps {
//   params: { portfolio_id: string };
//   // searchParams?: { [key: string]: string | string[] | undefined };
// }

interface PortfolioDetailPageProps {
  params: Promise<{ portfolio_id: string }>;
  // params: { portfolio_id: string };
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const currentParams = await params;
  return (
    <div>
      {/* <h1>ポートフォリオID: {portfolio_id}</h1> */}
      {/* 他のコンテンツ */}
      <PagePortfolioDetail params={currentParams} />
    </div>
  );
}
