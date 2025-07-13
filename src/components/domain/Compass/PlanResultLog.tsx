import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  getResultLogByResultId,
  SimulationLog,
} from "@/app/actions/Compass/simulationDb";

interface PlanResultLogProps {
  resultId: number | null;
}

const PlanResultLog: React.FC<PlanResultLogProps> = ({ resultId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SimulationLog[]>([]);

  useEffect(() => {
    if (resultId === null) {
      setLoading(false);
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await getResultLogByResultId(resultId);
      if (error) {
        console.error("Failed to fetch logs:", error);
        setError(error);
        setLoading(false);
        return;
      }
      if (data === null) {
        setLogs([]);
      } else {
        setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [resultId]);

  if (loading) {
    return <div className="text-center p-4">ログを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">エラー: {error}</div>;
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
      <h3 className="text-xl font-semibold text-gray-700 mb-4">ログ</h3>
      <div className="overflow-x-auto">
        <Table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                タイムスタンプ
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                レベル
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                メッセージ
              </TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                処理時間 (ms)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {format(
                      new Date(log.completed_at || log.started_at), // Use completed_at if it exists, otherwise use started_at
                      "yyyy/MM/dd HH:mm:ss.SSS"
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {log.status.toUpperCase()}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800 break-all">
                    {log.step_name}{" "}
                    {log.details ? `(${JSON.stringify(log.details)})` : ""}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-gray-800">
                    {/* null と undefined の両方をチェック */}
                    {log.duration_ms != null
                      ? log.duration_ms.toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-4 text-gray-500"
                >
                  ログはありません。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlanResultLog;
