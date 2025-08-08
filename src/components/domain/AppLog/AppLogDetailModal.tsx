// components/domain/AppLog/AppLogDetailModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppLog } from "@/types/db/applog";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";

interface AppLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AppLog | null;
}

// AppLogTableからスタイル定義を拝借
const logLevelStyles: { [key: string]: string } = {
  error: "bg-red-100 text-red-800 border border-red-200",
  warn: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  info: "bg-blue-100 text-blue-800 border border-blue-200",
  debug: "bg-gray-200 text-gray-800 border border-gray-300",
};

const messageLineNumber = 7;

const AppLogDetailModal: React.FC<AppLogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  const [isMessageCollapsed, setIsMessageCollapsed] = useState(true);
  const [isContextCollapsed, setIsContextCollapsed] = useState(true);

  useEffect(() => {
    // When the log prop changes (i.e., a new log is viewed),
    // reset the collapsed state to its default.
    setIsMessageCollapsed(true);
    setIsContextCollapsed(true);
  }, [log]);

  if (!log) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp.replace(" ", "T") + "Z");
      return formatInTimeZone(date, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
    } catch {
      return "無効な日付";
    }
  };

  const messageLines = log.message.split("\n");
  const isLongMessage = messageLines.length > messageLineNumber;

  const displayedMessage =
    isLongMessage && isMessageCollapsed
      ? messageLines.slice(0, 10).join("\n")
      : log.message;

  const contextString = log.context
    ? JSON.stringify(log.context, null, 2)
    : "なし";
  const contextLines = contextString.split("\n");
  const isLongContext = contextLines.length > 5;
  const displayedContext =
    isLongContext && isContextCollapsed
      ? contextLines.slice(0, 5).join("\n")
      : contextString;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold text-gray-800">
            ログ詳細
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            ID: <span className="font-mono">{log.id}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            <div className="font-semibold text-gray-600">タイムスタンプ</div>
            <div className="col-span-2 font-mono text-gray-800">
              {formatTimestamp(log.timestamp)}
            </div>

            <div className="font-semibold text-gray-600">レベル</div>
            <div className="col-span-2">
              <span
                className={cn(
                  "inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                  logLevelStyles[log.level] || logLevelStyles.debug
                )}
              >
                {log.level}
              </span>
            </div>

            <div className="font-semibold text-gray-600">ユーザーID</div>
            <div className="col-span-2 font-mono text-gray-800">
              {log.user_id || "-"}
            </div>

            <div className="font-semibold text-gray-600">IPアドレス</div>
            <div className="col-span-2 font-mono text-gray-800">
              {log.ip_address || "-"}
            </div>

            <div className="font-semibold text-gray-600">パス</div>
            <div className="col-span-2 font-mono text-gray-800 break-all">
              {log.path || "-"}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-600 border-b pb-1">
              メッセージ
            </h3>
            <div className="p-2 bg-gray-50 rounded">
              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {displayedMessage}
                {isLongMessage && isMessageCollapsed && "..."}
              </p>
            </div>
            {isLongMessage && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsMessageCollapsed(!isMessageCollapsed)}
              >
                {isMessageCollapsed ? "すべて表示" : "折りたたむ"}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-600 border-b pb-1">
              コンテキスト
            </h3>
            <div className="p-2 bg-gray-900 text-white rounded font-mono text-sm">
              <pre className="whitespace-pre-wrap break-all">
                {displayedContext}
                {isLongContext && isContextCollapsed && "..."}
              </pre>
            </div>
            {isLongContext && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setIsContextCollapsed(!isContextCollapsed)}
              >
                {isContextCollapsed ? "すべて表示" : "折りたたむ"}
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppLogDetailModal;
