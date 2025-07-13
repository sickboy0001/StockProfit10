"use client";
import { ImportCsv } from "@/app/actions/MarketCalendar/calendar";
import React, { useState } from "react";

// メインのAppコンポーネント
export function ImportMarketCalendar() {
  // CSVテキストを保持するステート
  const [csvText, setCsvText] = useState<string>("");
  // メッセージ（成功/エラー）を保持するステート
  const [message, setMessage] = useState<string>("");
  // ローディング状態を保持するステート
  const [loading, setLoading] = useState<boolean>(false);

  // インポートボタンがクリックされたときのハンドラー
  const handleImport = async () => {
    setMessage(""); // メッセージをクリア
    setLoading(true); // ローディングを開始
    console.log("handleImport", csvText);
    try {
      // サーバーアクションを呼び出し、CSVテキストを渡します。
      const result = await ImportCsv(csvText);
      // 結果に基づいてメッセージを設定
      if (result.success) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ エラー: ${result.message}`);
      }
    } catch (error: unknown) {
      // 予期せぬエラーが発生した場合
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setMessage(`❌ 予期せぬエラーが発生しました: ${errorMessage}`);
    } finally {
      setLoading(false); // ローディングを終了
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          CSVデータインポート
        </h1>

        <div className="mb-6">
          <label
            htmlFor="csvInput"
            className="block text-gray-700 text-sm font-medium mb-2"
          >
            ここにCSVデータを貼り付けてください:
            元データはこちらから「https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html」
          </label>
          <textarea
            id="csvInput"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-y min-h-[200px] shadow-sm"
            placeholder="例:&#10;国民の祝日・休日月日,国民の祝日・休日名称&#10;1955/1/1,元日&#10;1955/1/15,成人の日"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
          ></textarea>
        </div>

        <button
          onClick={handleImport}
          disabled={loading || !csvText.trim()} // ローディング中またはCSVが空の場合はボタンを無効化
          className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-md
            ${
              loading || !csvText.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              インポート中...
            </span>
          ) : (
            "CSVをインポート"
          )}
        </button>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg text-center font-medium ${
              message.startsWith("✅")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            } shadow-sm`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportMarketCalendar;
