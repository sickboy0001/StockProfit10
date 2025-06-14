// src/components/domain/Stock/ActionYApiAndRegist.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn/uiのButton
import { Input } from "@/components/ui/input"; // shadcn/uiのInput
import { DatePicker } from "@/components/ui/date-picker"; // 仮にDate Pickerがあるとして
import { DailyQuote } from "@/types/yFinance";
import { CompanyInfo } from "@/types/company"; // 企業情報型をインポート
import { dif_get_api_years } from "@/constants/common";
import { readAndRegistStockInfo } from "@/app/actions/readAndRegistStockInfo";
import { useRouter } from "next/navigation"; // ★ useRouterをインポート
import { Checkbox } from "@/components/ui/checkbox"; // ★ Checkboxをインポート

export default function ActionYApiAndRegist() {
  const router = useRouter(); // ★ routerインスタンスを取得

  const [symbol, setSymbol] = useState<string>("7203"); // 初期値
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(
      new Date().setFullYear(new Date().getFullYear() - dif_get_api_years)
    )
  ); // 1年前
  const [endDate, setEndDate] = useState<Date | undefined>(new Date()); // 今日

  const [parsedData, setParsedData] = useState<DailyQuote[] | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  const [isLoadingAll, setIsLoadingAll] = useState(false); // 一括取得用ローディング
  // const [isLoadingDb, setIsLoadingDb] = useState(false);

  const [allMessage, setAllMessage] = useState(""); // 一括取得用メッセージ
  const [allError, setAllError] = useState(""); // 一括取得用エラー

  const [shouldRedirect, setShouldRedirect] = useState(true); // ★ ページ遷移するかどうかのstate

  // APIからのデータ取得とDB登録をまとめて行う関数
  const handleProcessAll = async () => {
    setAllError("");
    setAllMessage("");
    setCompanyInfo(null); // 既存の企業情報をクリア
    setParsedData(null); // 既存データをクリア
    if (!symbol || !startDate || !endDate) {
      setAllError("銘柄コードと期間は必須です。");
      return;
    }
    if (startDate.getTime() >= endDate.getTime()) {
      setAllError("開始日は終了日より過去である必要があります。");
      return;
    }

    setIsLoadingAll(true);
    // let fetchedStockData: DailyQuote[] | null = null; // DB保存用の株価データを保持

    try {
      // ★ サーバーアクションを呼び出し
      const result = await readAndRegistStockInfo(
        symbol,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
      let errors: string[] = [];
      let successes: string[] = [];

      if (result.errorMessages && result.errorMessages.length > 0) {
        errors = result.errorMessages;
      }
      if (result.successMessages && result.successMessages.length > 0) {
        successes = result.successMessages;
      }

      if (errors.length > 0) {
        setAllError(errors.join("\n"));
        // エラーがある場合でも、部分的な成功メッセージがあればコンソールに出力またはUIに追記
        if (successes.length > 0) {
          console.log("Partial success messages:", successes.join("\n"));
          // 必要に応じて allMessage にも表示
          // setAllMessage(currentMsg => currentMsg ? `${currentMsg}\n${successes.join("\n")}` : successes.join("\n"));
        }
      } else if (successes.length > 0) {
        setAllMessage(successes.join("\n"));
      } else {
        // エラーも成功メッセージもない場合
        setAllMessage("処理は完了しましたが、特に報告する情報はありません。");
      }

      setCompanyInfo(result.companyInfo);
      setParsedData(result.stockData);

      if (
        shouldRedirect && // ★ チェックボックスの状態を確認
        errors.length === 0 &&
        result.stockData &&
        result.stockData.length > 0 &&
        startDate &&
        endDate
      ) {
        const startDateString = startDate.toISOString().split("T")[0];
        const endDateString = endDate.toISOString().split("T")[0];
        const chartUrl = `/stock/ChartTest?stockCode=${symbol}&startDate=${startDateString}&endDate=${endDateString}`;
        router.push(chartUrl);
      } else if (errors.length === 0 && successes.length > 0) {
        // データはなかったが、何らかの成功メッセージがある場合（例：企業情報のみ取得成功）
        // ここでは遷移しない、または別のメッセージを出すなど検討可能
      }
    } catch (err: unknown) {
      let errorMessage = "サーバー処理中に予期せぬエラーが発生しました。";
      if (err instanceof Error) {
        errorMessage = `サーバー処理エラー: ${err.message}`;
      } else if (typeof err === "string") {
        // typeof error ではなく err を参照
        errorMessage = `サーバー処理エラー: ${err}`;
      }
      setAllError((prev) => (prev ? `${prev}\n${errorMessage}` : errorMessage));
      console.error("Error calling readAndRegistStockInfo server action:", err);
    } finally {
      setIsLoadingAll(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
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
      <h1 className="text-2xl font-bold mb-6">
        企業・株価データ一括取得＆登録
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
          <div className="md:col-span-1">
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
          <div className="md:col-span-1">
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
          <div className="md:col-span-1">
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
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="redirect-checkbox"
            checked={shouldRedirect}
            onCheckedChange={(checked) => setShouldRedirect(checked as boolean)}
          />
          <label htmlFor="redirect-checkbox" className="text-sm">
            取得後にチャートページへ遷移する
          </label>
        </div>
        <Button
          onClick={handleProcessAll}
          disabled={isLoadingAll || !symbol}
          className="w-full"
        >
          {isLoadingAll ? "処理中..." : "企業・株価取得＆DB登録"}
        </Button>
      </div>

      {/* エラー/メッセージ表示 */}
      {allError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">エラー！</strong>
          <span className="block sm:inline whitespace-pre-line">
            {" "}
            {allError}
          </span>
        </div>
      )}

      {allMessage &&
        !allError && ( // エラーがなく、メッセージがある場合のみ表示
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <strong className="font-bold">情報</strong>
            <span className="block sm:inline whitespace-pre-line">
              {" "}
              {allMessage}
            </span>
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

      {/* 株価データプレビュー */}
      {parsedData && parsedData.length > 0 && (
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
        </div>
      )}
    </div>
  );
}
