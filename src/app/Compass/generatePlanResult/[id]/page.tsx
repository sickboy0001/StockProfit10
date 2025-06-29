import PageGeneratePlanResult from "@/components/domain/Compass/PageGeneratePlanResult";
import React from "react"; // Reactをインポート

interface homeProps {
  params: Promise<{ id: string }>;
  // params: { portfolio_id: string };
}

export default async function Home({ params }: homeProps) {
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
          <PageGeneratePlanResult id={id} />
        </React.Suspense>
      </main>
    </div>
  );
}
