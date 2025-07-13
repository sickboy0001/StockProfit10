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
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  getResultStockWithNameByResultId,
  SimulationResultStocksWithName,
} from "@/app/actions/Compass/simulationDb";

interface PlanResultStocksProps {
  resultId: number | null;
  router: AppRouterInstance;
}

const PlanResultStocks: React.FC<PlanResultStocksProps> = ({
  resultId,
  router,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultStocks, setResultStocks] = useState<
    SimulationResultStocksWithName[]
  >([]);

  useEffect(() => {
    if (resultId === null) {
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await getResultStockWithNameByResultId(resultId);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      if (data === null) {
        // データがないのはエラーではない
        setResultStocks([]);
        setLoading(false);
        return;
      }
      setResultStocks(data);
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
      <h3 className="text-xl font-semibold text-gray-700 mb-4">銘柄一覧</h3>
      <div className="overflow-x-auto">
        <Table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                銘柄
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                スコア
              </TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">
                手動スコア
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                除外理由
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                アクション
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultStocks.length > 0 ? (
              resultStocks.map((stock) => (
                <TableRow
                  key={stock.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {`[${stock.stock_code}]${stock.name}`}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 text-right">
                    {stock.score}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 text-right">
                    {stock.manual_score}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {stock.filter_reason || "-"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white rounded-md px-3 py-1 shadow-sm"
                      onClick={() =>
                        // TODO: 遷移先を正しいURLに修正する
                        router.push(
                          `/stock/ChartTest?stockCode=${stock.stock_code}`
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
                  colSpan={5}
                  className="text-center py-4 text-gray-500"
                >
                  銘柄情報はありません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlanResultStocks;
