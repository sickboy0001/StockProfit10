"use client";

import { useEffect, useState } from "react";
import { readAndRegistCompanyStockDetail } from "@/app/actions/readAndRegistCompanyStockDetail"; // アクションのパスを確認
import { CompanyStockDetail } from "@/types/stock";

interface TestGetCompanyStockDetailProps {
  stockCode: string;
}

export default function TestGetCompanyStockDetail(
  props: TestGetCompanyStockDetailProps
) {
  const { stockCode } = props;

  const [stockDetail, setStockDetail] = useState<CompanyStockDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockCode) {
      setLoading(false);
      setError("銘柄コードが指定されていません。");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await readAndRegistCompanyStockDetail(stockCode);
        setStockDetail(detail);
      } catch (e: unknown) {
        let errorMessage = "データの取得に失敗しました。";
        if (e instanceof Error) {
          errorMessage = e.message;
        } else if (typeof e === "string") {
          errorMessage = e;
        }
        setError(errorMessage);
        setStockDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stockCode]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>エラー: {error}</div>;
  }

  if (!stockDetail) {
    return <div>企業詳細データが見つかりませんでした。</div>;
  }

  return (
    <div>
      <h1>企業詳細: {stockDetail.code}</h1>
      <pre>{JSON.stringify(stockDetail, null, 2)}</pre>
    </div>
  );
}
