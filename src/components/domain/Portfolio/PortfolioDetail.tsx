// components/domain/Portfolio/PortfolioDetail.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import {
  PortfolioDetailData,
  PortfolioStockDetail,
} from "@/types/PortfolioDetail"; // 定義した型をインポート
import ModalPortfolioEdit from "./ModalPortfolioEdit";
import ModalPortfolioStockBulkAdd from "./ModalPortfolioStockBulkAdd"; // まとめて追加モーダル
import ModalPortfolioStockEdit from "./ModalPortfolioStockEdit"; // 個別銘柄編集モーダル
// Server Actions をインポート
import {
  updatePortfolioBasicInfo,
  addPortfolioStock,
  removePortfolioStock,
  updatePortfolioStock,
  updatePortfolioStockOrder,
  addPortfolioStocks,
} from "@/app/actions/PortfolioDetail";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns"; // date-fnsのformatとparseISOをインポート
import StockCodeSearchInput from "@/components/molecules/StockCodeSearchInput";
import { Loader2 } from "lucide-react";
import { insertAppLog } from "@/app/actions/Applog/Action";
import { getSptStocksCache } from "@/app/actions/Cache/SptStocks";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

type PortfolioDetailProps = {
  initialPortfolioDetail: PortfolioDetailData;
};

export function PortfolioDetail({
  initialPortfolioDetail,
}: PortfolioDetailProps) {
  const [portfolio, setPortfolio] = useState<PortfolioDetailData>(
    initialPortfolioDetail
  );
  const [isBasicInfoEditModalOpen, setIsBasicInfoEditModalOpen] =
    useState(false);
  const [isStockEditModalOpen, setIsStockEditModalOpen] = useState(false);
  const [editingPortfolioStock, setEditingPortfolioStock] =
    useState<PortfolioStockDetail | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false); // まとめて追加モーダル用
  const [newStockInput, setNewStockInput] = useState(""); // 銘柄コード入力フィールドのstate
  const [triggerAddStock, setTriggerAddStock] = useState(false); // 銘柄追加トリガー

  const [isSaving, setIsSaving] = useState(false); // グローバルなローディング状態

  const [validStockCodes, setValidStockCodes] = useState<Set<string>>(
    new Set()
  );

  const { user } = useAuth();
  const pathname = usePathname();

  // 銘柄追加ハンドラ
  const handleAddStock = useCallback(async () => {
    if (!newStockInput.trim()) return;
    console.log("handleAddStock called", newStockInput);

    setIsSaving(true);
    try {
      const result = await addPortfolioStock(
        portfolio.id,
        newStockInput.trim()
      );

      if (result && typeof result === "object" && "error" in result) {
        alert(`銘柄の追加に失敗しました: ${result.error}`);
      } else {
        // 追加された銘柄を再度フェッチしてUIを更新 (簡易のため全体を再フェッチ)
        // 理想的には、追加された銘柄の詳細情報のみをAPIから取得して追加
        // 強制的に画面をリロードする (Server Componentのデータを再フェッチ)
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to add stock:", e);
      alert("銘柄の追加中に予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  }, [newStockInput, portfolio.id]);

  // newStockInput が更新され、かつトリガーが設定されたら銘柄追加を実行
  useEffect(() => {
    if (triggerAddStock && newStockInput.trim()) {
      // trim() 後の値が空でないことを確認
      handleAddStock();
      setTriggerAddStock(false); // トリガーをリセット
    } else if (triggerAddStock && !newStockInput.trim()) {
      setTriggerAddStock(false); // 入力が空の場合はトリガーをリセットするだけ
    }
  }, [triggerAddStock, newStockInput, handleAddStock]);

  // コンポーネント表示時に有効な銘柄コードをキャッシュから取得
  useEffect(() => {
    const fetchValidCodes = async () => {
      const allStocks = await getSptStocksCache();
      const codes = new Set(allStocks.map((stock) => stock.code));
      console.log("Fetched valid stock codes:", codes);
      setValidStockCodes(codes);
    };
    fetchValidCodes();
  }, []);

  // ログ記録用の共通関数
  const logAction = useCallback(
    (
      level: "info" | "warn" | "error",
      source: string,
      message: string,
      context?: unknown
    ) => {
      insertAppLog({
        level,
        message,
        context,
        user_id: user?.id,
        source,
        path: pathname,
      });
    },
    [user?.id, pathname]
  );

  // 銘柄まとめて追加ハンドラ
  const handleBulkAddStocks = useCallback(
    async (stockCodesstring: string) => {
      setIsSaving(true);
      // 1. 括弧（<>,「」,()など）で囲まれた4桁または5桁の数字を抽出
      const bracketRegex = /[<＜「【『(](\d{4,5})[＞>」】』)]/g;
      const bracketMatches = [...stockCodesstring.matchAll(bracketRegex)];
      const codesFromBrackets = bracketMatches.map((match) => match[1]);

      // 2. 括弧で囲まれた部分を一時的に除去し、残りのテキストからコードを抽出
      const textForListParsing = stockCodesstring.replace(bracketRegex, " ");
      const codesFromList = textForListParsing
        .split(/[\s,、\r\n]+/) // カンマ、スペース、改行などで分割
        .map((code) => code.trim())
        .filter((code) => /^\d{4,5}$/.test(code)); // 4桁または5桁の数字のみを抽出

      // 3. 全てのコードを結合し、重複を排除
      const uniqueCodes = [
        ...new Set([...codesFromBrackets, ...codesFromList]),
      ].filter((code) => code.length > 0);

      // 4. spt_stocksに存在する銘柄コードのみにフィルタリング
      const stockCodes = uniqueCodes.filter((code) =>
        validStockCodes.has(code)
      );
      console.log("validStockCodes:", validStockCodes);
      if (stockCodes.length === 0) {
        logAction(
          "warn",
          "handleBulkAddStocks",
          `No valid stock codes found from input for portfolio.id: ${portfolio.id}`
        );
        return;
      }
      // console.log("handleBulkAddStocks:", portfolio.id);
      try {
        const result = await addPortfolioStocks(portfolio.id, stockCodes);

        if (result && typeof result === "object" && "error" in result) {
          alert(`銘柄の追加に失敗しました: ${result.error}`);
        } else {
          const context = {
            portfolioId: portfolio.id,
            action: "insert",
            stockCodes: stockCodes.join(", "),
          };
          logAction(
            "info",
            "handleBulkAddStocks",
            `Added ${stockCodes.length} stocks. stockcodeString: ${stockCodesstring}`,
            context
          );
          /*
            user_id?: string;
            source?: string;
            request_id?: string;
            ip_address?: string;
            user_agent?: string;
            path?: string;
          */

          // 成功したら画面をリロードして最新の状態を表示
          window.location.reload();
        }
      } catch (e: unknown) {
        logAction(
          "error",
          "handleBulkAddStocks",
          `Failed to add stocks in bulk for portfolio.id: ${portfolio.id}`
        );
        console.error("Failed to add stocks in bulk:", e);
        alert("銘柄のまとめて追加中に予期せぬエラーが発生しました。");
      } finally {
        // 成功時はリロードするのでモーダルは閉じる必要がない
        // 失敗時のみモーダルを閉じるか、ユーザーに再試行させるか
        setIsBulkAddModalOpen(false);
        setIsSaving(false);
      }
    },
    [portfolio.id, validStockCodes, logAction]
  );
  // ポートフォリオ基本情報の編集保存ハンドラ
  const handleSavePortfolioBasicInfo = async (
    portfolioId: string,
    title: string,
    description: string
  ) => {
    setIsSaving(true);
    try {
      const result = await updatePortfolioBasicInfo(
        portfolioId,
        title,
        description
      );
      if (result && typeof result === "object" && "error" in result) {
        alert(`ポートフォリオ情報の更新に失敗しました: ${result.error}`);
      } else {
        setPortfolio((prev) => ({
          ...prev,
          title: result.title,
          description: result.description,
          updatedAt: result.updatedAt,
        }));
        setIsBasicInfoEditModalOpen(false);
      }
    } catch (e) {
      console.error("Failed to update portfolio basic info:", e);
      alert("ポートフォリオ情報の更新中に予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 銘柄のDnd並び替えロジック
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedStocks = Array.from(portfolio.stocks);
    const [movedItem] = reorderedStocks.splice(result.source.index, 1);
    reorderedStocks.splice(result.destination.index, 0, movedItem);

    // 新しい表示順を更新
    const updatedWithOrder = reorderedStocks.map((s, index) => ({
      ...s,
      displayOrder: index + 1, // 1から始まる順序
    }));

    // UIを即座に更新 (Optimistic Update)
    setPortfolio((prev) => ({ ...prev, stocks: updatedWithOrder }));

    setIsSaving(true);
    try {
      // データベースのdisplay_orderを更新するAPIコールを実行
      const orderUpdates = updatedWithOrder.map((s) => ({
        id: s.id,
        displayOrder: s.displayOrder,
      }));
      const result = await updatePortfolioStockOrder(orderUpdates);

      if (typeof result === "object" && result.error) {
        alert(`銘柄の並び替えに失敗しました: ${result.error}`);
        // エラー時はUIを元の状態に戻す（またはデータを再フェッチ）
        setPortfolio(initialPortfolioDetail); // 簡単なロールバック
      }
    } catch (e) {
      console.error("Failed to update stock order:", e);
      alert("銘柄の並び替え中に予期せぬエラーが発生しました。");
      setPortfolio(initialPortfolioDetail); // ロールバック
    } finally {
      setIsSaving(false);
    }
  };

  // 銘柄削除ハンドラ
  const handleDeleteStock = async (stockId: number) => {
    if (!window.confirm("本当にこの銘柄をポートフォリオから削除しますか？")) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await removePortfolioStock(stockId);

      if (result && typeof result === "object" && "error" in result) {
        alert(`銘柄の削除に失敗しました: ${result.error}`);
      } else {
        const thisCode = portfolio.stocks.find(
          (s) => s.id === stockId
        )?.stockCode;

        setPortfolio((prev) => ({
          ...prev,
          stocks: prev.stocks.filter((s) => s.id !== stockId),
        }));

        const context = {
          portfolioId: portfolio.id,
          action: "delete",
          stockCode: thisCode,
        };
        logAction("info", "handleDeleteStock", `remove ${thisCode} `, context);
      }
    } catch (e) {
      console.error("Failed to delete stock:", e);
      alert("銘柄の削除中に予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 個別銘柄編集モーダルを開く
  const handleEditStockClick = (stock: PortfolioStockDetail) => {
    setEditingPortfolioStock(stock);
    setIsStockEditModalOpen(true);
  };

  // 個別銘柄編集モーダルからの保存ハンドラ
  const handleSavePortfolioStockEdit = async (
    portfolioStockId: number,
    updates: {
      holdingsQuantity: number;
      purchasePrice: number;
      groupName: string;
      memo: string;
    }
  ) => {
    setIsSaving(true);
    try {
      const result = await updatePortfolioStock(portfolioStockId, {
        holdingsQuantity: updates.holdingsQuantity,
        purchasePrice: updates.purchasePrice,
        groupName: updates.groupName,
        memo: updates.memo,
      });

      if (result && typeof result === "object" && "error" in result) {
        alert(`銘柄詳細の更新に失敗しました: ${result.error}`);
      } else {
        // UIを更新
        setPortfolio((prev) => ({
          ...prev,
          stocks: prev.stocks.map((s) =>
            s.id === portfolioStockId
              ? {
                  ...s,
                  holdingsQuantity: updates.holdingsQuantity,
                  purchasePrice: updates.purchasePrice,
                  groupName: updates.groupName,
                  memo: updates.memo,
                  // 最新価格や損益は再計算または再フェッチが必要
                }
              : s
          ),
        }));
        setIsStockEditModalOpen(false);
        setEditingPortfolioStock(null);
      }
    } catch (e) {
      console.error("Failed to update portfolio stock:", e);
      alert("銘柄詳細の更新中に予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 銘柄リストの各行のデータを整形するヘルパー関数
  const formatStockRowData = (stock: PortfolioStockDetail) => {
    const formatCurrency = (value: number | null | undefined) =>
      value != null ? value.toLocaleString() : "N/A";
    const formatPercent = (value: number | null | undefined) =>
      value != null ? `${value.toFixed(2)}%` : "N/A";

    return {
      codeNameMarket: `${stock.stockCode} ${
        stock.market ? `(${stock.market})` : ""
      } ${stock.name}`,
      currentPrice:
        stock.currentPrice != null // nullとundefinedをチェック
          ? `${formatCurrency(stock.currentPrice)} [${
              stock.latestDailyQuote?.date
                ? format(parseISO(stock.latestDailyQuote.date), "yyyy/MM/dd") // yyyy/MM/dd 形式で0埋め
                : ""
            }]`
          : "N/A",
      previousDayChange:
        stock.previousDayChange != null && stock.previousDayChangeRate != null
          ? `${formatCurrency(stock.previousDayChange)} (${formatPercent(
              stock.previousDayChangeRate
            )})`
          : "N/A",
      previousDayClose: formatCurrency(stock.previousDayClose),
      holdingsQuantity:
        stock.holdingsQuantity != null
          ? stock.holdingsQuantity.toLocaleString()
          : "N/A",
      purchasePrice: formatCurrency(stock.purchasePrice),
      profitLoss:
        stock.profitLoss != null && stock.profitLossRate != null
          ? `${formatCurrency(stock.profitLoss)} (${formatPercent(
              stock.profitLossRate
            )})`
          : "N/A",
    };
  };

  const handleStockCodeSelectedFromSearch = (selectedCode: string) => {
    setNewStockInput(selectedCode); // 親コンポーネントのstockCodeを更新
    // 検索選択後、必要であればフォーム送信ボタンにフォーカスを移動
    // newStockInput の更新を待ってから handleAddStock を実行するためにトリガーを設定
    setTriggerAddStock(true);
  };

  return (
    <div className="container mx-auto p-4">
      {isSaving && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="flex items-center space-x-3 bg-white p-5 rounded-lg shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-gray-700">処理中...</p>
          </div>
        </div>
      )}

      {/* 画面タイトル */}
      <h1 className="text-3xl font-bold mb-6">
        ポートフォリオ名: {portfolio.title} (ID: {String(portfolio.id)}
        ...)
      </h1>

      {/* ポートフォリオ基本情報エリア */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">基本情報</h2>
          <Button
            onClick={() => setIsBasicInfoEditModalOpen(true)}
            disabled={isSaving}
          >
            編集
          </Button>
        </div>
        <p className="text-gray-700 mb-2">**タイトル:** {portfolio.title}</p>
        <p className="text-gray-700 mb-2">
          **説明:** {portfolio.description || "なし"}
        </p>
        <p className="text-gray-500 text-sm">
          作成日時: {new Date(portfolio.createdAt).toLocaleString()}
        </p>
        <p className="text-gray-500 text-sm">
          編集日時: {new Date(portfolio.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* 銘柄検索・追加エリア */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">銘柄検索・追加</h2>
        <div className="flex items-center gap-4">
          {/* <Input
            type="text"
            placeholder="銘柄コードまたは銘柄名を入力"
            value={newStockInput}
            onChange={(e) => setNewStockInput(e.target.value)}
            className="flex-grow"
            disabled={isSaving}
          /> */}
          <StockCodeSearchInput
            value={newStockInput}
            onValueChange={setNewStockInput} // 入力フィールドの変更を親に伝える
            onStockSelected={handleStockCodeSelectedFromSearch} // 検索結果からの選択を親に伝える
            isLoadingForm={false} // 親フォームのローディング状態を子に伝える
          />

          <Button
            onClick={handleAddStock}
            disabled={isSaving || !newStockInput.trim()}
          >
            銘柄追加
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBulkAddModalOpen(true)}
            disabled={isSaving}
          >
            まとめて追加
          </Button>
          <span className="text-gray-600 text-sm">
            {portfolio.stocks.length}/50件
          </span>
        </div>
      </div>

      {/* ポートフォリオ銘柄一覧エリア */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">ポートフォリオ銘柄一覧</h2>
        {portfolio.stocks.length === 0 ? (
          <p className="text-gray-600">
            このポートフォリオにはまだ銘柄がありません。
          </p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="portfolio-stocks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="overflow-x-auto"
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        {/* Dndハンドル用 */}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          編集
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          削除
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          コード・市場・名称
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          チャート
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          前日終値
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          前日比
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          現在値
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {portfolio.stocks.map((stock, index) => {
                        const rowData = formatStockRowData(stock);
                        return (
                          <Draggable
                            key={stock.id}
                            draggableId={String(stock.id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${
                                  snapshot.isDragging
                                    ? "bg-blue-50 shadow-lg"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <td
                                  {...provided.dragHandleProps}
                                  className="px-2 py-2 text-gray-400 cursor-grab"
                                >
                                  &#x22EE; {/* Dndハンドルアイコン */}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditStockClick(stock)}
                                    disabled={isSaving}
                                  >
                                    <span className="text-yellow-600">
                                      &#9998;
                                    </span>{" "}
                                    {/* 鉛筆アイコン */}
                                  </Button>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteStock(stock.id)}
                                    disabled={isSaving}
                                  >
                                    <span className="text-red-600">
                                      &#10005;
                                    </span>{" "}
                                    {/* Xアイコン */}
                                  </Button>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {rowData.codeNameMarket}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                  <Link
                                    href={`/stock/ChartTest?stockCode=${stock.stockCode}`}
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`https://finance.yahoo.co.jp/chart-image-proxy/ex/v1/common/chart/image?code=${stock.stockCode}.T&chartSize=50x32`}
                                      alt={`${stock.name}のチャート`}
                                      width={150}
                                      height={96}
                                      className="inline-block"
                                    ></img>
                                  </Link>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right font-mono">
                                  {rowData.previousDayClose}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right font-mono">
                                  {rowData.previousDayChange}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right font-mono">
                                  {rowData.currentPrice}
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </tbody>
                  </table>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* 外部サービスリンク / シミュレーション設定への導線 */}
      {/* <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">関連機能</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`https://finance.yahoo.co.jp/quote/${
              portfolio.stocks[0]?.stockCode || "AAPL"
            }.T/`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            disabled={isSaving || portfolio.stocks.length === 0}
          >
            Yahoo!ファイナンスへ
          </Link>
          <Link
            href={`https://kabutan.jp/stock/chart?code=${
              portfolio.stocks[0]?.stockCode || "7203"
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            disabled={isSaving || portfolio.stocks.length === 0}
          >
            StockChartへ
          </Link>
          <Button
            onClick={() => alert("監視条件設定画面へ遷移します (未実装)")}
            disabled={isSaving}
          >
            監視条件指定へ
          </Button>
          <Button
            onClick={() =>
              alert("ポートフォリオ条件指定画面へ遷移します (未実装)")
            }
            disabled={isSaving}
          >
            ポートフォリオ条件指定へ
          </Button>
          <Button
            onClick={() =>
              alert("このポートフォリオでシミュレーション実行 (未実装)")
            }
            disabled={isSaving}
          >
            このポートフォリオでシミュレーション実行
          </Button>
        </div>
      </div> */}

      {/* ポートフォリオ基本情報編集モーダル */}
      <ModalPortfolioEdit
        isOpen={isBasicInfoEditModalOpen}
        onClose={() => setIsBasicInfoEditModalOpen(false)}
        portfolio={
          portfolio
            ? {
                id: portfolio.id,
                name: portfolio.title,
                memo: portfolio.description,
              }
            : null
        }
        onSave={handleSavePortfolioBasicInfo}
        isLoading={isSaving}
      />

      {/* 個別銘柄編集モーダル */}
      <ModalPortfolioStockEdit
        isOpen={isStockEditModalOpen}
        onClose={() => {
          setIsStockEditModalOpen(false);
          setEditingPortfolioStock(null);
        }}
        stock={editingPortfolioStock}
        onSave={handleSavePortfolioStockEdit}
        isLoading={isSaving}
      />

      {/* 銘柄まとめて追加モーダル */}
      <ModalPortfolioStockBulkAdd
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onSave={handleBulkAddStocks}
        isLoading={isSaving}
      />
    </div>
  );
}
