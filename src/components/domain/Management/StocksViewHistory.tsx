// app/stocks-view-history/page.tsx
"use client"; // クライアントコンポーネントであることを宣言

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // Next.js 13+ App Router
// import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントのインポート

interface FilterParams {
  startDate: string;
  endDate: string;
}

// Subabaseクライアントの初期化 (環境変数から取得)
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// UIコンポーネントのインポート
import { Skeleton } from "@/components/ui/skeleton";
// import Pagination from "./Pagination";
import StocksViewTable from "./StocksViewTable";
import StocksViewHistoryFilter from "./StocksViewHistoryFilter";
import { showCustomToast } from "@/components/organisms/CustomToast";
import {
  getPeriodStockViewsAction,
  PeriodStockView,
} from "@/app/actions/StocksViewHistory";
import { Info } from "lucide-react";
import { format } from "date-fns/format";
import { getDay } from "date-fns/getDay";
import { subDays } from "date-fns/subDays";
import { Day } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// const ITEMS_PER_PAGE = 10; // 1ページあたりの表示件数

export default function StocksViewHistory() {
  const router = useRouter();

  const [historyList, setHistoryList] = useState<PeriodStockView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const [totalPages, setTotalPages] = useState<number>(1);
  // const [totalItems, setTotalItems] = useState<number>(0); // ★ フィルター適用後の全アイテム数を保持するstate

  const [filters, setFilters] = useState<FilterParams>({
    startDate: "",
    endDate: "",
  });

  // ★ 株価取得可能な最終日を計算する関数
  const getTradableLatestDate = (date: Date): Date => {
    const dayOfWeek = getDay(date) as Day; // 0 (日曜日) から 6 (土曜日)
    if (dayOfWeek === 0) {
      // 日曜日
      return subDays(date, 2);
    } else if (dayOfWeek === 6) {
      // 土曜日
      return subDays(date, 1);
    }
    return date; // 平日
  };

  // ★ 今日の日付と株価取得可能な最終日をフォーマットして取得
  const today = new Date();
  const formattedToday = format(today, "yyyy年MM月dd日 (eee)", { locale: ja });
  const tradableLatestDate = getTradableLatestDate(today);
  const formattedTradableLatestDate = format(
    tradableLatestDate,
    "yyyy年MM月dd日 (eee)",
    { locale: ja }
  );

  // 履歴データをフェッチする関数

  const fetchStockHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Server Actionを直接呼び出し
      const result = await getPeriodStockViewsAction({
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        stockCode: null,
        stockName: null,
      });

      if ("error" in result) {
        // エラーオブジェクトが返された場合
        throw new Error(result.error);
      }

      const data = result; // 取得した集計データ

      // ページネーションはクライアント側で処理
      // setTotalItems(data.length); // フィルター適用後の全アイテム数を設定
      // const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedData = data;

      setHistoryList(paginatedData); // 取得したデータをセット
    } catch (err: unknown) {
      console.error("参照履歴の取得エラー:", err);
      let subMsg =
        "参照履歴の取得中にエラーが発生しました。時間をおいて再度お試しください。";
      if (err instanceof Error) {
        subMsg = err.message;
      }
      setError(subMsg);
      showCustomToast({
        message: "取得エラー",
        submessage: subMsg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [filters]); // 依存配列は変更なし

  useEffect(() => {
    fetchStockHistory();
  }, [fetchStockHistory]);

  // totalItems が変更されたら totalPages を再計算
  // useEffect(() => {
  //   setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE));
  // }, [totalItems]);

  const handleFilterChange = (newFilters: Partial<FilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // setCurrentPage(1); // フィルター適用時は1ページ目に戻す
  };

  // const handlePageChange = (page: number) => {
  //   setCurrentPage(page);
  // };

  const handleViewChart = (stockCode: string) => {
    // チャート画面への遷移ロジック
    const chartUrl = `/stock/ChartTest?stockCode=${stockCode}`;
    router.push(chartUrl);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header (共通ヘッダー) はLayoutコンポーネントでラップされていることを想定 */}
      <div className="container mx-auto bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">参照履歴一覧</h1>

        {/* 警告メッセージの表示 */}
        <Alert className="mb-6 border-blue-400 bg-blue-50 text-blue-700 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-blue-700">
          <Info className="h-5 w-5" /> {/* ★ アイコンを Info に変更 */}
          <AlertTitle className="font-bold text-blue-800">情報</AlertTitle>
          <AlertDescription className="text-blue-700">
            本日: {formattedToday}/ 株価データの最新取得可能日(目安):{" "}
            {formattedTradableLatestDate}
            <span className="block mt-1 text-xs">
              (市場の休場日やデータの更新タイミングにより、実際の最新データと異なる場合があります)
            </span>
          </AlertDescription>
        </Alert>
        <StocksViewHistoryFilter
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          loading={loading}
        />

        {loading ? (
          // Skeleton表示
          <div className="mt-6">
            {/* Table Skeleton */}
            <div className="space-y-4">
              {/* Header Skeleton */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-t-md border-b">
                <Skeleton className="h-5 w-1/5" />
                <Skeleton className="h-5 w-1/5" />
                <Skeleton className="h-5 w-1/5" />
                <Skeleton className="h-5 w-1/5" />
                <Skeleton className="h-5 w-1/5" />
              </div>
              {/* Row Skeletons */}
              {/* {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border-b"
                >
                  <Skeleton className="h-5 w-1/5" />
                  <Skeleton className="h-5 w-1/5" />
                  <Skeleton className="h-5 w-1/5" />
                  <Skeleton className="h-5 w-1/5" />
                  <Skeleton className="h-5 w-1/5" />
                </div>
              ))} */}
            </div>
            {/* Pagination Skeleton */}
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ) : error ? (
          <p className="text-red-600 text-center mt-4">{error}</p>
        ) : historyList.length === 0 ? (
          <p className="text-gray-600 text-center mt-4">
            該当する履歴はありません。
          </p>
        ) : (
          <>
            <StocksViewTable
              historyList={historyList}
              onViewChart={handleViewChart}
            />
            {/* <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            /> */}
          </>
        )}
      </div>
      {/* Footer (共通フッター) はLayoutコンポーネントでラップされていることを想定 */}
    </div>
  );
}
