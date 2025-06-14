// src/components/domain/Stock/PageStockDataViewer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn/uiのButton
import { Input } from "@/components/ui/input"; // shadcn/uiのInput
import { DatePicker } from "@/components/ui/date-picker"; // 仮にDate Pickerがあるとして
import { DailyQuote } from "@/types/yFinance";
import { CompanyInfo } from "@/types/company"; // 企業情報型をインポート
import { getAndParseStockData, saveDailyQuotesToDb } from "@/app/actions/stock";
import { getCompanyInfo } from "@/app/actions/company";
import { dif_get_api_years } from "@/constants/common";
// import ActionYApiAndRegist from "./ActionYApiAndRegist";

export default function ActionYApiAndRegistOrg() {
  const [symbol, setSymbol] = useState<string>("7203"); // 初期値
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(
      new Date().setFullYear(new Date().getFullYear() - dif_get_api_years)
    )
  ); // 1年前
  const [endDate, setEndDate] = useState<Date | undefined>(new Date()); // 今日
  const [parsedData, setParsedData] = useState<DailyQuote[] | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoadingCompanyInfo, setIsLoadingCompanyInfo] = useState(false);
  const [companyInfoError, setCompanyInfoError] = useState("");
  const [companyInfoMessage, setCompanyInfoMessage] = useState("");

  const handleFetchData = async () => {
    setError("");
    setMessage("");
    setParsedData(null); // 既存データをクリア
    if (!symbol || !startDate || !endDate) {
      setError("銘柄コードと期間は必須です。");
      return;
    }
    if (startDate.getTime() >= endDate.getTime()) {
      setError("開始日は終了日より過去である必要があります。");
      return;
    }

    setIsLoadingApi(true);
    try {
      // Server Actionを呼び出し
      const { data, error: actionError } = await getAndParseStockData(
        symbol,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      if (actionError) {
        setError(actionError);
      } else if (data) {
        setParsedData(data);
        setMessage("株価データを取得しました。");
      }
    } catch (err: unknown) {
      let errorMessage = "予期せぬエラーが発生しました。";
      if (err instanceof Error) {
        errorMessage = `予期せぬエラーが発生しました: ${err.message}`;
      } else if (typeof error === "string") {
        errorMessage = `予期せぬエラーが発生しました: ${err}`;
      }
      console.error(errorMessage);
    } finally {
      setIsLoadingApi(false);
    }
  };
  const handleFetchCompanyInfo = async () => {
    setCompanyInfoError("");
    setCompanyInfoMessage("");
    setCompanyInfo(null);
    if (!symbol) {
      setCompanyInfoError("銘柄コードは必須です。");
      return;
    }

    setIsLoadingCompanyInfo(true);
    try {
      const { data, error: actionError } = await getCompanyInfo(symbol);
      if (actionError) {
        setCompanyInfoError(actionError);
      } else if (data) {
        setCompanyInfo(data);
        setCompanyInfoMessage("企業情報を取得しました。");
      }
    } catch (err: unknown) {
      let errorMessage = "企業情報の取得中に予期せぬエラーが発生しました。";
      if (err instanceof Error) {
        errorMessage = `企業情報の取得中に予期せぬエラーが発生しました: ${err.message}`;
      } else if (typeof err === "string") {
        errorMessage = `企業情報の取得中に予期せぬエラーが発生しました: ${err}`;
      }
      setCompanyInfoError(errorMessage);
      console.error("Error fetching company info:", err);
    } finally {
      setIsLoadingCompanyInfo(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setError("");
    setMessage("");
    if (!parsedData || parsedData.length === 0) {
      setError(
        "保存するデータがありません。まずAPIからデータを取得してください。"
      );
      return;
    }

    setIsLoadingDb(true);
    try {
      // Server Actionを呼び出し
      const {
        success,
        error: actionError,
        count,
      } = await saveDailyQuotesToDb(parsedData);

      if (actionError) {
        setError(actionError);
      } else if (success) {
        setMessage(`データベースに ${count} 件のデータを登録しました。`);
      }
    } catch (err: unknown) {
      let errorMessage = "データベース保存中に予期せぬエラーが発生しました。";
      if (err instanceof Error) {
        errorMessage = `データベース保存中に予期せぬエラーが発生しました: ${err.message}`;
      } else if (typeof err === "string") {
        errorMessage = `データベース保存中に予期せぬエラーが発生しました: ${err}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoadingDb(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* <ActionYApiAndRegist></ActionYApiAndRegist> */}
      <div className="mb-4 text-sm">
        <span className="font-semibold">参考: </span>
        <a
          href="https://www.sbisec.co.jp/ETGate/?OutSide=on&_ControlID=WPLETmgR001Control&_PageID=WPLETmgR001Mdtl20&_DataStoreID=DSWPLETmgR001Control&_ActionID=DefaultAID&getFlg=on&burl=search_market&cat1=market&cat2=none&dir=info&file=market_meigara_225.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          日経平均株価採用銘柄一覧 (SBI証券)
        </a>
      </div>
      <h1 className="text-2xl font-bold mb-6">APIデータ確認</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-end">
          <div>
            <label
              htmlFor="symbol"
              className="block text-sm font-medium text-gray-700"
            >
              銘柄コード
            </label>
            <Input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="例: 7203"
              className="mt-1"
            />
          </div>
          <div>
            <Button
              onClick={handleFetchCompanyInfo}
              disabled={isLoadingCompanyInfo || !symbol}
              className="w-full md:w-auto"
            >
              {isLoadingCompanyInfo ? "企業情報取得中..." : "企業情報取得"}
            </Button>
          </div>
        </div>
      </div>

      {/* 企業情報エラー/メッセージ表示 */}
      {companyInfoError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">企業情報エラー！</strong>
          <span className="block sm:inline"> {companyInfoError}</span>
        </div>
      )}
      {companyInfoMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">企業情報</strong>
          <span className="block sm:inline"> {companyInfoMessage}</span>
        </div>
      )}

      {/* 企業情報表示セクション */}
      {companyInfo && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            企業情報 ({companyInfo.symbol})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <strong>銘柄名:</strong>{" "}
              {companyInfo.shortName || companyInfo.longName || "-"}
            </div>
            <div>
              <strong>現在価格:</strong>{" "}
              {companyInfo.currentPrice
                ? `${companyInfo.currentPrice} ${companyInfo.currency || ""}`
                : "-"}
            </div>
            <div>
              <strong>取引所:</strong> {companyInfo.exchange || "-"}
            </div>
            <div>
              <strong>時価総額:</strong>{" "}
              {companyInfo.marketCap?.toLocaleString() || "-"}
            </div>
            <div>
              <strong>業種:</strong> {companyInfo.industry || "-"}
            </div>
            <div>
              <strong>セクター:</strong> {companyInfo.sector || "-"}
            </div>
            <div className="md:col-span-2">
              <strong>ウェブサイト:</strong>{" "}
              {companyInfo.website ? (
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {companyInfo.website}
                </a>
              ) : (
                "-"
              )}
            </div>
            <div className="md:col-span-2">
              <strong>住所:</strong>
              {[
                companyInfo.address1,
                companyInfo.city,
                companyInfo.state,
                companyInfo.zip,
                companyInfo.country,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </div>
            <div>
              <strong>電話番号:</strong> {companyInfo.phone || "-"}
            </div>
            <div>
              <strong>従業員数:</strong>{" "}
              {companyInfo.fullTimeEmployees?.toLocaleString() || "-"}
            </div>
            {companyInfo.longBusinessSummary && (
              <div className="md:col-span-2">
                <strong>事業概要:</strong>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {companyInfo.longBusinessSummary}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 株価データ取得セクション */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">株価時系列データ取得</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              銘柄コード (企業情報と共通)
            </label>
            <Input
              type="text"
              value={symbol}
              readOnly
              className="mt-1 bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              開始日
            </label>
            <DatePicker
              selectedDate={startDate}
              onDateChange={setStartDate}
              placeholder="開始日を選択"
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              終了日
            </label>
            <DatePicker
              selectedDate={endDate}
              onDateChange={setEndDate}
              placeholder="終了日を選択"
            />
          </div>
        </div>
        <Button
          onClick={handleFetchData}
          disabled={isLoadingApi || !symbol}
          className="w-full"
        >
          {isLoadingApi ? "株価データ取得中..." : "株価データAPI呼び出し"}
        </Button>
      </div>

      {/* 株価データエラー/メッセージ表示 */}
      {error &&
        !isLoadingApi && ( // ローディング中でない場合のみエラー表示
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">株価データエラー！</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

      {message &&
        !isLoadingApi && ( // ローディング中でない場合のみメッセージ表示
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">成功！</strong>
            <span className="block sm:inline"> {message}</span>
          </div>
        )}

      {/* 株価データプレビュー */}
      {parsedData && parsedData.length > 0 && !isLoadingApi && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            取得データプレビュー ({symbol})
          </h2>
          <div className="overflow-x-auto mb-4 max-h-96">
            {/* 高さを制限し、スクロール可能に */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                {/* ヘッダーを固定 */}
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    日付
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    始値
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    高値
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    安値
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    終値
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    出来高
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((data, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.open?.toFixed(2) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.high?.toFixed(2) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.low?.toFixed(2) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.close?.toFixed(2) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.volume?.toLocaleString() || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            onClick={handleSaveToDatabase}
            disabled={isLoadingDb}
            className="w-full mt-4"
          >
            {isLoadingDb ? "データベースに登録中..." : "データベースに登録"}
          </Button>
        </div>
      )}
    </div>
  );
}
