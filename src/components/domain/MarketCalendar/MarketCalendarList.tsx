"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  format,
  getDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import React, { useState, useEffect, useMemo } from "react";
import {
  getYearMarketCalendar,
  updateMarketRecord, // サーバーアクションをインポート
} from "@/app/actions/MarketCalendar/calendar";

// カレンダーレコードの型定義
interface MarketRecord {
  date: string;
  is_open: boolean;
  note: string | null;
}

// 一覧画面（年指定）
export function MarketCalendarList() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [calendarData, setCalendarData] = useState<MarketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 曜日表示用の配列 (日曜日始まり)
  const dayOfWeekLabels = ["日", "月", "火", "水", "木", "金", "土"];

  // 指定された年のカレンダーデータをフェッチ
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getYearMarketCalendar(year);
        setCalendarData(data || []);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "データの取得に失敗しました。"
        );
        setCalendarData([]); // エラー時はデータを空にする
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [year]);

  // カレンダーデータを月ごとに整理するメモ化されたデータ
  const organizedCalendar = useMemo(() => {
    const dataMap = new Map<string, MarketRecord>();
    calendarData.forEach((record) => {
      dataMap.set(record.date, record);
    });

    const months: { [key: number]: MarketRecord[] } = {}; // 月ごとの日付配列

    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(new Date(year, i, 1));
      const monthEnd = endOfMonth(monthStart);
      const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
      });

      const monthArray: MarketRecord[] = [];

      daysInMonth.forEach((date) => {
        const formattedDate = format(date, "yyyy-MM-dd");
        monthArray.push(
          dataMap.get(formattedDate) || {
            date: formattedDate,
            is_open: true, // データがない場合はデフォルトで開いていると仮定
            note: null,
          }
        );
      });
      months[i + 1] = monthArray; // 1-indexedの月で格納
    }
    return months;
  }, [year, calendarData]);

  // 〇×クリック時のハンドラ
  const handleToggleOpen = async (date: string) => {
    // 元のデータを保持しておく
    const originalData = [...calendarData];

    // オプティミスティックUI更新: UIを即座に更新
    const updatedData = calendarData.map((record) => {
      if (record.date === date) {
        return { ...record, is_open: !record.is_open };
      }
      return record;
    });
    setCalendarData(updatedData);

    try {
      // データベースの更新
      const targetRecord = originalData.find((r) => r.date === date);
      if (targetRecord) {
        await updateMarketRecord(date, !targetRecord.is_open);
      }
    } catch (e) {
      // エラーが発生した場合はUIを元の状態に戻す
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
      setCalendarData(originalData); // ロールバック
    }
  };

  return (
    <Card className="max-w-6xl mx-auto my-8 p-6 bg-white shadow-xl rounded-xl">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">市場カレンダー</h1>
          <div className="flex items-center gap-4">
            <label
              htmlFor="yearInput"
              className="text-lg font-medium text-gray-700"
            >
              年指定：
            </label>
            <Input
              id="yearInput"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-32 p-2 border border-gray-300 rounded-lg text-lg text-center"
            />
          </div>
        </div>

        {loading && (
          <p className="text-center text-blue-600 text-lg">読み込み中...</p>
        )}
        {error && (
          <p className="text-center text-red-500 text-lg">エラー: {error}</p>
        )}

        {!loading && !error && Object.keys(organizedCalendar).length === 0 && (
          <p className="text-center text-gray-600 text-lg">
            指定された年のデータが見つかりません。
          </p>
        )}

        {!loading && !error && Object.keys(organizedCalendar).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(organizedCalendar).map(([monthNumStr, days]) => {
              const monthNum = parseInt(monthNumStr);
              return (
                <div
                  key={monthNum}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    {monthNum}月
                  </h2>
                  <div className="w-full text-sm">
                    {" "}
                    {/* 1列表示のためにグリッドを削除 */}
                    {/* 曜日ヘッダーは不要 */}
                    {days.map((record) => {
                      const isHoliday = !record.is_open; // is_openがfalseなら休日
                      const dateObj = parseISO(record.date);
                      const dayOfMonth = format(dateObj, "d");
                      const dayOfWeek = dayOfWeekLabels[getDay(dateObj)]; // 曜日を取得

                      let textColorClass = "text-gray-800";
                      if (getDay(dateObj) === 0) {
                        // 日曜日
                        textColorClass = "text-red-600";
                      } else if (getDay(dateObj) === 6) {
                        // 土曜日
                        textColorClass = "text-blue-600";
                      }

                      const rowBgClass = isHoliday ? "bg-red-50" : "bg-white"; // 休日なら薄い赤の背景

                      return (
                        <div
                          key={record.date} // 日付をキーにする
                          className={`flex items-center p-1 border-b border-gray-200 last:border-b-0
                            ${rowBgClass}
                            ${isHoliday ? "font-bold" : ""}
                          `}
                        >
                          <div className={`w-5/6 text-left ${textColorClass}`}>
                            {`${dayOfMonth}日(${dayOfWeek})`}
                            {record.note ? ` [${record.note}]` : ""}
                          </div>
                          <div
                            className={`w-1/6 text-left cursor-pointer ${textColorClass}`}
                            onClick={() => handleToggleOpen(record.date)}
                          >
                            {record.is_open ? `〇` : "×"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
