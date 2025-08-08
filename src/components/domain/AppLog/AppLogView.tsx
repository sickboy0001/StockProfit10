// components/AppLogView.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { showCustomToast } from "@/components/organisms/CustomToast";
import AppLogFilter, { FilterParams } from "./AppLogFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppLog } from "@/types/db/applog";
import { getAppLogsAction } from "@/app/actions/Applog/Action";
import AppLogTable from "./AppLogTable";
import AppLogDetailModal from "./AppLogDetailModal";

const AppLogView = () => {
  // const router = useRouter();
  const [logList, setLogList] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // モーダル表示用の状態
  const [selectedLog, setSelectedLog] = useState<AppLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // フィルタ状態
  const [filters, setFilters] = useState<FilterParams>({
    startDate: undefined,
    endDate: undefined,
    level: "all",
    searchText: "",
  });

  const fetchAppLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAppLogsAction({
        startDate: filters.startDate
          ? format(filters.startDate, "yyyy-MM-dd")
          : null,
        endDate: filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : null,
        level: filters.level,
        searchText: filters.searchText,
      });

      if ("error" in result) {
        throw new Error(result.error);
      }

      setLogList(result);
    } catch (err) {
      console.error("ログの取得エラー:", err);
      let subMsg = "ログの取得中にエラーが発生しました。";
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
  }, [filters]);

  useEffect(() => {
    fetchAppLogs();
  }, [fetchAppLogs]);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  // テーブルの行がクリックされたときのハンドラ
  const handleRowClick = (log: AppLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          アプリケーションログ
        </h1>
        <Alert className="mb-6 border-blue-400 bg-blue-50 text-blue-700">
          <Info className="h-5 w-5" />
          <AlertTitle className="font-bold text-blue-800">情報</AlertTitle>
          <AlertDescription className="text-blue-700">
            アプリケーションのログをフィルタリングして表示します。
          </AlertDescription>
        </Alert>

        <AppLogFilter
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          loading={loading}
        />

        {loading ? (
          // ローディングスケルトン
          <div className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-t-md border-b">
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-2/6" />
                <Skeleton className="h-5 w-2/6" />
              </div>
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border-b"
                >
                  <Skeleton className="h-5 w-1/6" />
                  <Skeleton className="h-5 w-1/6" />
                  <Skeleton className="h-5 w-2/6" />
                  <Skeleton className="h-5 w-2/6" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="text-red-600 text-center mt-4">{error}</p>
        ) : logList.length === 0 ? (
          <p className="text-gray-600 text-center mt-4">
            該当するログはありません。
          </p>
        ) : (
          <AppLogTable logList={logList} onRowClick={handleRowClick} />
        )}
      </div>

      <AppLogDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};

export default AppLogView;
