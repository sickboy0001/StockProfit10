// src/components/domain/Stock/PageStockDataViewer.tsx
"use client";

import ActionYApiAndRegist from "./ActionYApiAndRegist";

export default function PageStockDataViewer() {
  return (
    <div className="container mx-auto p-4">
      {/* <TestGetCompanyStockDetail stockCode="9684"></TestGetCompanyStockDetail> */}
      <ActionYApiAndRegist></ActionYApiAndRegist>
    </div>
  );
}
