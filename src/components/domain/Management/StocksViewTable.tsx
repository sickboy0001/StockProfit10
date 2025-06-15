// components/StockHistoryTable.tsx
import { PeriodStockView } from "@/app/actions/StocksViewHistory";
import { format } from "date-fns/format";
import { isValid } from "date-fns/isValid";
import { parseISO } from "date-fns/parseISO";
import React from "react";

interface StockHistoryTableProps {
  historyList: PeriodStockView[];
  onViewChart: (stockCode: string) => void;
}

const StocksViewTable: React.FC<StockHistoryTableProps> = ({
  historyList,
  onViewChart,
}) => {
  // 日付をフォーマットする関数
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = parseISO(dateString);
    if (!isValid(date)) return "無効な日付";
    return format(date, "yyyy-MM-dd HH:mm:ss");
  };
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              銘柄コード
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              銘柄名
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              最終参照日時
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              回数
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              データ取得期間
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              チャート
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {historyList.map((item, index) => (
            <tr key={item.stock_code + index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.stock_code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.stock_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDateTime(item.latest_viewed_at_in_period)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.period_view_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.data_acquisition_period}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onViewChart(item.stock_code)}
                  className="text-indigo-600 hover:text-indigo-900 px-3 py-1 border border-indigo-600 rounded-md text-xs transition-colors duration-200 hover:bg-indigo-50"
                >
                  表示
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StocksViewTable;
