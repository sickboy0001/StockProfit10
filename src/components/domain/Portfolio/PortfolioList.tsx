// components/domain/Portfolio/PortfolioList.tsx
"use client"; // クライアントコンポーネントとして宣言

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import Link from "next/link";
import { Portfolio } from "@/types/Portfolio"; // 型定義をインポート
import ModalPortfolioEdit from "./ModalPortfolioEdit"; // 新しいモーダルをインポート
import { showCustomToast } from "@/components/organisms/CustomToast";
import {
  createPortfolioAction,
  deletePortfolioAction, // deletePortfolioAction をインポート
  readPortfoliosAction,
  updatePortfolioAction, // updatePortfolioAction をインポート
  updatePortfolioOrderAction, // updatePortfolioOrderAction をインポート
} from "@/app/actions/Portfolio"; // Actions をインポート
import { useAuth } from "@/contexts/AuthContext"; // useAuth フックをインポート

// APIから返ってくるstockの型
interface ApiStock {
  stock_code: string;
  stock_name: string | null;
}

// APIから返ってくるポートフォリオの型
interface PortfolioFromApi {
  id: string;
  name: string;
  memo: string;
  createdAt: string;
  user_id: string; // Add user_id to PortfolioFromApi
  updatedAt: string;
  displayOrder: number;
  stocks: ApiStock[];
}
// interface PortfolioListProps { // initialPortfolios は不要になる
//   initialPortfolios: Portfolio[];
// }

export function PortfolioList(/*{ initialPortfolios }: PortfolioListProps*/) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]); // 初期値は空配列
  const [newPortfolioTitle, setNewPortfolioTitle] = useState(""); // 新規作成用
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(
    null
  ); // 編集対象
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 編集モーダルの開閉状態
  const [isSaving, setIsSaving] = useState(false); // 保存中のローディング状態
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true); // データ取得中のローディング状態
  const [portfoliosError, setPortfoliosError] = useState<string | null>(null); // データ取得エラー

  const { user } = useAuth(); // useAuth フックを呼び出す

  // ポートフォリオデータをサーバーから読み込む
  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!user?.id) {
        setPortfolios([]); // ユーザーがいない場合はポートフォリオをクリア
        setIsLoadingPortfolios(false);
        // 必要であれば、ログインを促すメッセージなどを表示
        // setPortfoliosError("ポートフォリオを表示するにはログインが必要です。");
        return;
      }

      setIsLoadingPortfolios(true);
      setPortfoliosError(null);
      try {
        const result = await readPortfoliosAction(user.id);
        console.log("portfoliolist:", result);
        if (result.error) {
          setPortfoliosError(result.error);
          setPortfolios([]);
          showCustomToast({
            message: "エラー",
            submessage: `ポートフォリオの読み込みに失敗しました: ${result.error}`,
            type: "error",
          });
        } else if (result.data) {
          // APIからのデータをフロントエンドの型にマッピング
          const mappedPortfolios = (
            result.data as unknown as PortfolioFromApi[]
          ).map((portfolio) => ({
            ...portfolio,
            // stockはApiStock型と推論されるため、anyは不要
            user_id: portfolio.user_id, // Map user_id from API response
            stocks: portfolio.stocks.map((stock) => ({
              code: stock.stock_code,
              name: stock.stock_name || "",
            })),
          }));
          setPortfolios(mappedPortfolios);
        } else {
          setPortfolios([]); // データがnullの場合も空配列に
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setPortfoliosError(errorMessage);
        setPortfolios([]);
        showCustomToast({
          message: "エラー",
          submessage: `ポートフォリオの読み込み中に予期せぬエラーが発生しました: ${errorMessage}`,
          type: "error",
        });
      } finally {
        setIsLoadingPortfolios(false);
      }
    };

    fetchPortfolios();
  }, [user?.id]); // user.id が変更されたら再フェッチ

  // Dndの並び替えロジック
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    // ローカルステートの並び替え
    const reorderedPortfolios = Array.from(portfolios);
    const [movedItem] = reorderedPortfolios.splice(result.source.index, 1);
    reorderedPortfolios.splice(result.destination.index, 0, movedItem);

    // 新しい表示順を更新
    const portfoliosWithNewOrder = reorderedPortfolios.map((p, index) => ({
      ...p,
      displayOrder: index + 1, // 1から始まる順序
    }));

    setPortfolios(portfoliosWithNewOrder); // UI即時反映

    // データベースの表示順を更新
    if (!user?.id) {
      showCustomToast({
        message: "エラー",
        submessage: "表示順の更新にはユーザー認証が必要です。",
        type: "error",
      });
      // 必要であれば、並び替え前の状態に戻すロジック
      // setPortfolios(portfolios); // 元の順序に戻す
      return;
    }

    setIsSaving(true);
    try {
      const portfoliosToUpdate = portfoliosWithNewOrder.map((p) => ({
        id: p.id,
        displayOrder: p.displayOrder,
      }));
      const updateResult = await updatePortfolioOrderAction(
        portfoliosToUpdate,
        user.id
      );

      if (updateResult.success) {
        showCustomToast({
          message: "成功",
          submessage: "ポートフォリオの表示順を更新しました。",
          type: "success",
        });
      } else {
        showCustomToast({
          message: "エラー",
          submessage: `表示順の更新に失敗しました: ${
            updateResult.error || "不明なエラー"
          }`,
          type: "error",
        });
        // エラー発生時は、サーバー側の状態とUIを同期させるため再フェッチするか、
        // またはUIを並び替え前の状態に戻すことを検討
        // fetchPortfolios(); // 再フェッチする場合
        // setPortfolios(portfolios); // 元の順序に戻す場合 (元のportfoliosを保持しておく必要がある)
      }
    } catch (error) {
      showCustomToast({
        message: "エラー",
        submessage: `表示順の更新中に予期せぬエラーが発生しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 新規ポートフォリオの追加 (タイトルのみ)
  const handleAddPortfolio = async () => {
    if (!newPortfolioTitle.trim()) return;

    setIsSaving(true); // 保存開始
    try {
      // createPortfolio Server Actionを呼び出す
      const result = await createPortfolioAction({
        userId: user?.id || "",
        name: newPortfolioTitle,
        memo: "", // 新規作成時はメモなし
        displayOrder: portfolios.length + 1, // 仮の表示順。実際のDBから再取得する方が堅牢
      });

      // サーバーアクションからのエラーを最初にチェック
      if (result.error) {
        console.error("ポートフォリオの作成に失敗しました:", result.error);
        showCustomToast({
          message: "エラー",
          submessage: `ポートフォリオの作成に失敗しました: ${result.error}`,
          type: "error",
        });
        // setIsSaving(false); // finallyブロックで処理されるため、ここでは不要な場合もある
        return;
      }

      // エラーがなく、データが存在する場合 (成功ケース)
      // result.data は createPortfolioAction によって Portfolio 型として返される
      if (result.data) {
        const newPortfolioFromServer: Portfolio = result.data;
        setPortfolios((prev) => [...prev, newPortfolioFromServer]);
        setNewPortfolioTitle("");
        showCustomToast({
          message: "成功",
          submessage: "新しいポートフォリオを作成しました。",
          type: "success",
        });
      } else {
        // エラーもデータもない場合 (サーバーアクションのレスポンスが予期しない形式)
        console.error(
          "ポートフォリオ作成後のレスポンスが予期しない形式です (データなし、エラーなし):",
          result
        );
        showCustomToast({
          message: "エラー",
          submessage: "ポートフォリオ作成後のレスポンス形式が不正です。",
          type: "error",
        });
      }
    } catch (error) {
      console.error(
        "ポートフォリオの追加中にクライアントサイドでエラーが発生しました:",
        error
      );
      showCustomToast({
        message: "エラー",
        submessage: `ポートフォリオの追加に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: "error",
      });
    } finally {
      setIsSaving(false); // 保存終了
    }
  };

  // ポートフォリオの削除
  const handleDeletePortfolio = async (id: string) => {
    if (window.confirm("本当にこのポートフォリオを削除しますか？")) {
      setIsSaving(true); // 保存開始 (削除も広義の保存処理と見なす)
      try {
        if (!user?.id) {
          showCustomToast({
            message: "エラー",
            submessage: "削除操作を行うにはユーザー認証が必要です。",
            type: "error",
          });
          return;
        }

        const result = await deletePortfolioAction(id, user.id);

        if (result.success) {
          showCustomToast({
            message: "成功",
            submessage: "ポートフォリオを削除しました。",
            type: "success",
          });
          setPortfolios((prev) => prev.filter((p) => p.id !== id));
        } else {
          console.error("ポートフォリオの削除に失敗しました:", result.error);
          showCustomToast({
            message: "エラー",
            submessage: `ポートフォリオの削除に失敗しました: ${
              result.error || "不明なエラー"
            }`,
            type: "error",
          });
        }
      } catch (error) {
        console.error(
          "ポートフォリオの削除中にクライアントサイドでエラーが発生しました:",
          error
        );
        showCustomToast({
          message: "エラー",
          submessage: `ポートフォリオの削除に失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
          type: "error",
        });
      } finally {
        setIsSaving(false); // 保存終了
      }
    }
  };

  // ポートフォリオの編集開始 (モーダルを開く)
  const handleEditClick = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setIsEditModalOpen(true);
  };

  // ポートフォリオの編集保存 (ModalPortfolioEditから呼ばれる)
  const handleSavePortfolioEdit = async (
    portfolioId: string,
    title: string,
    description: string
  ) => {
    setIsSaving(true); // 保存開始
    try {
      if (!user?.id) {
        showCustomToast({
          message: "エラー",
          submessage: "更新操作を行うにはユーザー認証が必要です。",
          type: "error",
        });
        return;
      }

      const result = await updatePortfolioAction({
        portfolioId: portfolioId,
        userId: user.id,
        name: title,
        memo: description,
      });

      if (result.data) {
        // 成功した場合、返されたデータでローカルステートを更新
        setPortfolios((prev) =>
          prev.map((p) => (p.id === portfolioId ? result.data! : p))
        );
        setIsEditModalOpen(false); // モーダルを閉じる
        setEditingPortfolio(null); // 編集対象をクリア
        showCustomToast({
          message: "成功",
          submessage: "ポートフォリオを更新しました。",
          type: "success",
        });
      } else {
        console.error("ポートフォリオの更新に失敗しました:", result.error);
        showCustomToast({
          message: "エラー",
          submessage: `ポートフォリオの更新に失敗しました: ${
            result.error || "不明なエラー"
          }`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(
        "ポートフォリオの更新中にクライアントサイドでエラーが発生しました:",
        error
      );
      showCustomToast({
        message: "エラー",
        submessage: `ポートフォリオの更新に失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: "error",
      });
    } finally {
      setIsSaving(false); // 保存終了
    }
  };

  // 銘柄リストを1行に整形するヘルパー関数
  const formatStocks = (stocks: { code: string; name: string }[]): string => {
    if (!stocks || stocks.length === 0) return "なし";
    // name がない場合でも code は表示されるように修正
    const formatted = stocks
      .map((s) => (s.name ? `[${s.code}] ${s.name}` : `[${s.code}]`))
      .join(", ");
    // 適切な長さにトリミングするなどのロジックを追加
    return formatted.length > 80
      ? formatted.substring(0, 77) + "..."
      : formatted;
  };

  // ローディング表示
  if (isLoadingPortfolios) {
    return <div className="text-center p-8">ポートフォリオを読み込み中...</div>;
  }

  // エラー表示
  if (portfoliosError) {
    return (
      <div className="text-center p-8 text-red-500">
        エラー: {portfoliosError}
      </div>
    );
  }

  // ユーザーがいない、かつエラーもない場合（例：ログインしていない）
  if (!user && !portfoliosError && !isLoadingPortfolios) {
    return (
      <div className="text-center p-8 text-gray-500">
        ポートフォリオを表示するにはログインしてください。
      </div>
    );
  }

  return (
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="portfolios">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {portfolios.length === 0 &&
                !isLoadingPortfolios &&
                !portfoliosError &&
                user && (
                  <div className="text-center p-4 my-4 bg-blue-50 text-blue-700 rounded-md">
                    ポートフォリオはまだありません。下のフォームから新しいポートフォリオを追加しましょう。
                  </div>
                )}
              {portfolios.map((portfolio, index) => (
                <Draggable
                  key={portfolio.id}
                  draggableId={portfolio.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        bg-white p-4 border rounded-lg shadow-sm
                        ${
                          snapshot.isDragging
                            ? "border-blue-500 shadow-lg"
                            : "border-gray-200"
                        }
                        flex items-center gap-4
                      `}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="text-gray-400 cursor-grab px-2"
                      >
                        {/* ドラッグハンドルアイコン */}
                        &#x22EE;{" "}
                        {/* Unicode for vertical ellipsis or a custom SVG icon */}
                      </div>
                      <div className="flex-grow">
                        <h2 className="text-xl font-semibold mb-1">
                          {portfolio.name}
                        </h2>
                        <p className="text-gray-600 text-sm mb-2">
                          {portfolio.memo || "説明なし"}{" "}
                          {/* description を memo に変更 */}
                        </p>{" "}
                        {/* 説明がない場合の表示 */}
                        <p className="text-gray-500 text-xs">
                          銘柄: {formatStocks(portfolio.stocks)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          作成日時:
                          {new Date(portfolio.createdAt).toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">
                          編集日時:{" "}
                          {new Date(portfolio.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleEditClick(portfolio)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded"
                          disabled={isSaving}
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeletePortfolio(portfolio.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
                          disabled={isSaving}
                        >
                          削除
                        </button>
                        <Link
                          href={`/Portfolio/${portfolio.id}`}
                          className="text-blue-500 hover:underline text-sm text-center"
                        >
                          詳細へ
                        </Link>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 新規ポートフォリオ追加エリア (タイトルのみ) */}
      <div className="mt-8 p-4 border rounded-lg bg-gray-50 flex items-end space-x-2">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-2">
            新規ポートフォリオを追加
          </h3>
          <label htmlFor="newTitle" className="sr-only">
            タイトル
          </label>
          <input
            type="text"
            id="newTitle"
            value={newPortfolioTitle}
            onChange={(e) => setNewPortfolioTitle(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ポートフォリオのタイトル"
            disabled={isSaving}
          />
        </div>
        <button
          onClick={handleAddPortfolio}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded h-10"
          disabled={isSaving || !newPortfolioTitle.trim()}
        >
          {isSaving ? "追加中..." : "追加"}
        </button>
      </div>

      {/* 編集モーダル */}
      <ModalPortfolioEdit
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPortfolio(null); // モーダルを閉じる際に編集対象をクリア
        }}
        portfolio={editingPortfolio}
        onSave={handleSavePortfolioEdit}
        isLoading={isSaving}
      />
    </div>
  );
}
