import PageChartTest from "@/components/domain/Stock/PageChartTest";
import Providers from "@/components/domain/Stock/QueryProvider";
import React from "react"; // Reactをインポート

export default function Home() {
  return (
    <div>
      <Providers>
        <main>
          <main>
            {/* PageChartTest を Suspense でラップ */}
            <React.Suspense
              fallback={
                <p className="text-center p-4">ページを読み込んでいます...</p>
              }
            >
              <PageChartTest />
            </React.Suspense>
          </main>
        </main>
      </Providers>
    </div>
  );
}
