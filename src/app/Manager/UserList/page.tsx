import PageAdminUserList from "@/components/domain/Management/PageAdminUserList";
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
          <PageAdminUserList />
        </React.Suspense>
      </main>
    </div>
  );
}
