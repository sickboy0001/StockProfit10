// components/StockHistoryFilter.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";

interface StockHistoryFilterProps {
  onFilterChange: (filters: { startDate: string; endDate: string }) => void;
  currentFilters: {
    startDate: string;
    endDate: string;
  };
  loading: boolean;
}

const StocksViewHistoryFilter: React.FC<StockHistoryFilterProps> = ({
  onFilterChange,
  currentFilters,
  loading,
}) => {
  const [startDate, setStartDate] = useState(currentFilters.startDate);
  const [endDate, setEndDate] = useState(currentFilters.endDate);

  // 親コンポーネントのフィルター変更を内部状態に同期
  useEffect(() => {
    setStartDate(currentFilters.startDate);
    setEndDate(currentFilters.endDate);
  }, [currentFilters]);

  const handleSearch = () => {
    // バリデーション
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      alert("開始日は終了日以前の日付を選択してください。"); // 簡単なアラート。実際はtoastなどを使う。
      return;
    }
    onFilterChange({ startDate, endDate });
  };

  return (
    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        検索フィルター
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            期間（開始）
          </Label>
          <Input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <Label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            期間（終了）
          </Label>
          <Input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-2 lg:col-span-4 flex justify-end">
          <Button
            onClick={handleSearch}
            disabled={loading}
            className={`px-6 py-2 rounded-md font-semibold text-white transition-colors duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "検索中..." : "検索"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StocksViewHistoryFilter;
