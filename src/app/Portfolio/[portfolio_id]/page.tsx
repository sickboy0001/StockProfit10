// // app/portfolios/detail/[portfolio_id]/page.tsx

// // PagePortfolioDetail コンポーネントをインポートします。
// // このパスが正しいことを確認してください。
// // import PagePortfolioDetail from "@/components/domain/Portfolio/PagePortfolioDetail";
// import React from "react"; // ページコンポーネントがサーバーコンポーネントの場合でも、Reactのインポートは問題ありません。

// // Next.jsのDynamic Route Parametersを受け取るための型定義です。
// // params は動的セグメント ([portfolio_id]) の値を持ちます。
// // searchParams はクエリパラメータを受け取ります (オプション)。
// interface PortfolioDetailNoPageProps {
//   params: { portfolio_id: string };
//   // searchParams?: { [key: string]: string | string[] | undefined };
// }

// // ページコンポーネントはデフォルトでサーバーコンポーネントです。
// // propsとして PortfolioDetailPageProps 型を受け取ります。
// export default function PortfolioDetailPage({
//   params,
// }: PortfolioDetailNoPageProps) {
//   // PagePortfolioDetail コンポーネントに params をそのまま渡します。
//   // ***重要***: PagePortfolioDetail コンポーネントのPropsの型定義が
//   // { params: { portfolio_id: string } } となっていることを確認してください。
//   // 例:
//   // interface PagePortfolioDetailProps {
//   //   params: { portfolio_id: string };
//   // }
//   // export default function PagePortfolioDetail({ params }: PagePortfolioDetailProps) { ... }

//   // もし PagePortfolioDetail がクライアントコンポーネントである場合、
//   // PagePortfolioDetail.tsx ファイルの先頭に '"use client";' が必要です。
//   // しかし、このエラーは直接その問題を示唆しているわけではありません。
//   // return <PagePortfolioDetail params={params} />;
//   return (
//     <div>
//       <h1>ポートフォリオID: {params.portfolio_id}</h1>
//       {/* 他のコンテンツ */}
//     </div>
//   );
// }
interface PortfolioDetailPageProps {
  params: { portfolio_id: string };
}

export default function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  return (
    <div>
      <h1>Portfolio ID: {params.portfolio_id}</h1>
    </div>
  );
}
