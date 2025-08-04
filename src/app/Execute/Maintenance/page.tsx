//

import PageSettingMaintenance from "@/components/domain/Execute/PageSettingMaintenance";
import React from "react"; // Reactをインポート
//http://192.168.2.100:3000/Execute/Maintenance
export default async function Home() {
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
          <PageSettingMaintenance />
        </React.Suspense>
      </main>
    </div>
  );
}
