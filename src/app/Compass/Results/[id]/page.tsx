import PagePlanResult from "@/components/domain/Compass/PagePlanResult";
import React from "react"; // Reactをインポート

interface ResultProps {
  params: Promise<{ id: string }>;
  // params: { portfolio_id: string };
}

export default async function Home({ params }: ResultProps) {
  const { id } = await params;
  return (
    <div>
      <main>
        {/* PageChartTest を Suspense でラップ */}
        <React.Suspense
          fallback={
            <p className="text-center p-4">ページを読み込んでいます...</p>
          }
        >
          <PagePlanResult id={id} />
        </React.Suspense>
      </main>
    </div>
  );
}
