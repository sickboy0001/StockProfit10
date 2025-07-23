import PageContactForm from "@/components/domain/Contact/PageContactForm";
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
          <PageContactForm />
        </React.Suspense>
      </main>
    </div>
  );
}
