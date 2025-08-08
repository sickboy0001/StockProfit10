import PageAppLogView from "@/components/domain/AppLog/PageAppLogView";
import React from "react"; // Reactをインポート

export default function Home() {
  return (
    <div>
      <main>
        {/* PageChartTest を Suspense でラップ */}
        <React.Suspense
          fallback={
            <p className="text-center p-4">ページを読み込んでいます...</p>
          }
        >
          test
          <PageAppLogView />
        </React.Suspense>
      </main>
    </div>
  );
}
