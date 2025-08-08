// components/AppLogTable.tsx
import React from "react";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppLog } from "@/types/db/applog";
import { formatContextForDisplay } from "./AppLogHelper";

interface AppLogTableProps {
  logList: AppLog[];
  onRowClick: (log: AppLog) => void;
}

// ログレベルに応じたスタイルを定義
const logLevelStyles: { [key: string]: string } = {
  error: "bg-red-100 text-red-800 border border-red-200",
  warn: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  info: "bg-blue-100 text-blue-800 border border-blue-200",
  debug: "bg-gray-200 text-gray-800 border border-gray-300",
};

const AppLogTable: React.FC<AppLogTableProps> = ({ logList, onRowClick }) => {
  return (
    <div className="mt-6 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 hover:bg-gray-100">
            <TableHead className="w-[180px]">タイムスタンプ</TableHead>
            <TableHead className="w-[90px]">レベル</TableHead>
            <TableHead>メッセージ</TableHead>
            <TableHead>コンテキスト</TableHead>
            <TableHead className="w-[120px]">ユーザーID</TableHead>
            <TableHead className="w-[120px]">IPアドレス</TableHead>
            <TableHead className="w-[200px]">パス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logList.map((log) => (
            <TableRow
              key={log.id}
              className="hover:bg-blue-50 cursor-pointer"
              onClick={() => onRowClick(log)}
            >
              <TableCell className="font-mono text-sm">
                {formatInTimeZone(
                  // タイムスタンプ文字列(UTC)をISO 8601形式に変換してからDateオブジェクトを生成します。
                  // これにより、ブラウザや環境に依存しない安定したパースが可能になります。
                  // 例: '2023-01-01 10:00:00' -> '2023-01-01T10:00:00Z'
                  new Date(log.timestamp.replace(" ", "T") + "Z"),
                  "Asia/Tokyo",
                  "yyyy/MM/dd HH:mm:ss"
                )}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                    logLevelStyles[log.level] || logLevelStyles.debug
                  )}
                >
                  {log.level}
                </span>
              </TableCell>
              <TableCell className="max-w-xs truncate">{log.message}</TableCell>
              <TableCell className="text-xs max-w-sm truncate font-mono">
                {formatContextForDisplay(log.context)}
              </TableCell>
              <TableCell className="text-xs max-w-[120px] truncate">
                {log.user_id || "-"}
              </TableCell>
              <TableCell className="text-xs font-mono">
                {log.ip_address || "-"}
              </TableCell>
              <TableCell className="text-xs max-w-[200px] truncate">
                {log.path || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AppLogTable;
