// components/domain/Portfolio/PagePortfolioList.tsx

import { PortfolioList } from "./PortfolioList";

export default async function PagePortfolioList() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">ポートフォリオ一覧</h1>
      <PortfolioList />
    </div>
  );
}
