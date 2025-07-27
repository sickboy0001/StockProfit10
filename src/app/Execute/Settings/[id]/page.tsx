import PageExecuteSettings from "@/components/domain/Execute/PageExecuteSettings";
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
        test
        {/* PageChartTest を Suspense でラップ */}
        <React.Suspense
          fallback={
            <p className="text-center p-4">ページを読み込んでいます...</p>
          }
        >
          <PageExecuteSettings id={id} />
        </React.Suspense>
      </main>
    </div>
  );
}
