import PageConditionSetting from "@/components/domain/Compass/PageConditionSetting";
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
          <PageConditionSetting />
        </React.Suspense>
      </main>
    </div>
  );
}
