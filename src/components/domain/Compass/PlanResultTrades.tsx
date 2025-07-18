import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  getResultTradeWithNameByResultId,
  SimulationResultsTradeWithName,
} from "@/app/actions/Compass/simulationDb";

interface PlanResultTradesProps {
  resultId: number | null;
  router: AppRouterInstance;
}

const PlanResultTrades: React.FC<PlanResultTradesProps> = ({ resultId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultTrades, setResultTrades] = useState<
    SimulationResultsTradeWithName[]
  >([]);

  useEffect(() => {
    if (resultId === null) {
      return;
    }

    const fetch = async () => {
      const { data, error } = await getResultTradeWithNameByResultId(resultId);
      if (error) {
        console.log(error);
        setError(error);
        setLoading(false);
        return;
      }
      if (data === null) {
        console.log("データSimulationResultがありません。");
        setError("データSimulationResultがありません。");
        setLoading(false);
        return;
      }
      console.log(data);
      setResultTrades(data);
      setLoading(false);
    };
    fetch();
  }, [resultId]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg">
        エラー: {error}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg">データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">取引一覧</h3>
      <div className="overflow-x-auto">
        <Table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                銘柄
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                開始日時
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                開始価格
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                開始金額
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                最小購入金額
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                終了日時
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                終了価格
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                終了金額
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                課税前損益
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                課税後損益
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                課税前利益率
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                アクション
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultTrades.length > 0 ? (
              resultTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {`[${trade.stock_code}]${trade.name}`}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {trade.entry_date
                      ? format(new Date(trade.entry_date), "yyyy/MM/dd")
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 text-right">
                    {trade.entry_close_price
                      ? `¥${trade.entry_close_price.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 text-right">
                    {trade.entry_amount
                      ? `¥${trade.entry_amount.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 px -4 text-sm text-gray-800 text-right">
                    {trade.entry_amount
                      ? `¥${trade.entry_amount.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {trade.exit_date
                      ? format(new Date(trade.exit_date), "yyyy/MM/dd")
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 text-right">
                    {trade.exit_close_price
                      ? `¥${trade.exit_close_price.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 text-right">
                    {trade.exit_amount
                      ? `¥${trade.exit_amount.toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={`py-3 px-4 text-sm text-right ${
                      (trade.gross_profit_amount ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ¥{trade.gross_profit_amount?.toLocaleString() ?? "-"}
                  </TableCell>
                  <TableCell
                    className={`py-3 px-4 text-sm text-right ${
                      (trade.net_profit_amount ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ¥{trade.net_profit_amount?.toLocaleString() ?? "-"}
                  </TableCell>
                  <TableCell
                    className={`py-3 px-4 text-sm text-right ${
                      (trade.gross_profit_rate ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {((trade.gross_profit_rate ?? 0) * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white rounded-md px-3 py-1 shadow-sm"
                      onClick={() =>
                        window.open(
                          `/stock/ChartTest?stockCode=${trade.stock_code}`,
                          "_blank"
                        )
                      }
                    >
                      チャートへ
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="text-center py-4 text-gray-500"
                >
                  取引履歴はありません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlanResultTrades;
