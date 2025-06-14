// src/components/domain/Stock/StockChartForm.tsx
"use client";

import React, { useEffect, useRef, useState } from "react"; // Added useEffect, useState

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  // fetchRecentViewedStockCodes,
  // RecentViewedStockInfo,
  searchStocksByName, // ★ 銘柄名検索アクションをインポート
  SearchedStockInfo, // ★ 検索結果の型をインポート
} from "@/app/actions/stock"; // ★ 閲覧履歴取得アクションをインポート
import { useAuth } from "@/contexts/AuthContext";
import StockChartViewHistory from "./StockChartViewHistory"; // ★ 新しいコンポーネントをインポート

interface StockChartSelectCodeProps {
  stockCode: string;
  startDate: string;
  endDate: string;
  onStockCodeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const StockChartSelectCode: React.FC<StockChartSelectCodeProps> = ({
  // Renamed component

  stockCode,
  startDate,
  endDate,
  onStockCodeChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  isLoading,
}) => {
  // 「最近見た銘柄」関連のstateはStockChartViewHistoryへ移動

  const { user } = useAuth();

  // 銘柄名検索用
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedStockInfo[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const searchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // ポップアップの位置調整用
  const searchResultsRef = useRef<(HTMLDivElement | null)[]>([]); // Ref for search result items
  const searchPopupRef = useRef<HTMLDivElement>(null); // ポップアップのコンテナdivのref
  const submitButtonRef = useRef<HTMLButtonElement>(null); // 送信ボタンのref

  const currentUserId = user?.id;

  useEffect(() => {
    // searchTermが実際のstockCodeと異なる場合（例えば、ユーザーが名前で検索し始めた場合）、
    // 初期表示ではpropsのstockCodeをsearchTermに反映する。
    // ただし、ユーザーが既に入力を始めている場合は上書きしない。
    if (stockCode !== searchTerm && searchTerm === "") {
      setSearchTerm(stockCode);
    }
  }, [stockCode, searchTerm]); // searchTerm を依存配列に追加

  // 銘柄コード入力時の処理 (デバウンス付き検索)
  useEffect(() => {
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
    }
    // 数字のみの場合は検索しない、2文字未満の非数字も検索しない
    const nonNumericChars = searchTerm.replace(/[0-9]/g, "");
    if (/^[0-9]+$/.test(searchTerm) || nonNumericChars.length < 2) {
      setSearchResults([]);
      setIsSearchPopupOpen(false); // ポップアップを閉じる
      setIsSearchLoading(false); // ローディング状態も解除
      return;
    }

    // 条件を満たす場合、デバウンス後に検索実行
    setIsSearchLoading(true); // デバウンス開始時にローディング開始
    // searchTermが有効な場合、API呼び出し前にポップアップを開く
    // これにより、ユーザーがタイプをやめて検索が始まるまでの間にポップアップが維持される
    if (!isSearchPopupOpen && nonNumericChars.length >= 2) {
      setIsSearchPopupOpen(true);
    }

    searchDebounceTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`[StockChartSelectCode] Searching for: "${searchTerm}"`); // ★ 検索実行前のログ
        const response = await searchStocksByName(searchTerm);
        console.log(
          "[StockChartSelectCode] API Response:",
          JSON.stringify(response, null, 2)
        ); // ★ API応答全体のログ

        if (response.success && response.data && response.data.length > 0) {
          console.log("[StockChartSelectCode] Found stocks:", response.data); // ★ 検索成功時のデータログ

          setSearchResults(response.data);
          searchResultsRef.current = response.data.map(() => null); // Reset refs array
          setIsSearchPopupOpen(true); // データがあれば必ずポップアップを開く/維持する
        } else if (
          response.success &&
          response.data &&
          response.data.length === 0
        ) {
          // 検索成功だが結果0件
          setSearchResults([]);
          setIsSearchPopupOpen(true); // ポップアップは開いたまま「該当なし」を表示
        } else {
          // APIエラー、またはデータなし
          setSearchResults([]);
          setIsSearchPopupOpen(false); // データがなければポップアップを閉じる
          if (response.error) {
            console.error("Search error:", response.error);
          }
        }
      } catch (error) {
        console.error("Error during searchStocksByName:", error);
        setSearchResults([]);
        setIsSearchPopupOpen(false); // 例外発生時もポップアップを閉じる
      } finally {
        setIsSearchLoading(false);
      }
    }, 1000); // 1秒後に検索実行

    return () => {
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
      }
    };
  }, [searchTerm, isSearchPopupOpen]);
  const handleHistorySelection = (selectedCode: string) => {
    if (selectedCode) {
      onStockCodeChange(selectedCode);
      setSearchTerm(selectedCode); // 検索用入力も更新
      setIsSearchPopupOpen(false); // 履歴選択時はポップアップを閉じる
      searchInputRef.current?.focus();
    }
  };
  const handleSearchSelection = (selectedStock: SearchedStockInfo) => {
    onStockCodeChange(selectedStock.code);
    setSearchTerm(selectedStock.code); // 検索用入力も更新 (または名前にするなどUX次第)
    setIsSearchPopupOpen(false);
    if (submitButtonRef.current) {
      submitButtonRef.current.focus();
    } else {
      // 通常は発生しないはずですが、念のため警告
      console.warn("StockChartSelectCode: Could not find form to submit.");
    }
  };

  const handleStockCodeInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onStockCodeChange(newValue); // 親コンポーネントにも即時反映
  };
  const handleStockCodeInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      if (isSearchPopupOpen && searchResults.length > 0) {
        e.preventDefault(); // フォームのデフォルト送信を防ぐ
        searchResultsRef.current[0]?.focus(); // ポップアップの最初のアイテムにフォーカス
      } else if (searchResults.length > 0) {
        // ポップアップが非表示でも結果がある場合、最初のものを選択
        e.preventDefault();
        handleSearchSelection(searchResults[0]);
      }
      // ポップアップも検索結果もない場合は、通常のフォーム送信（onSubmit）に任せる
    }
  };

  const handleInputBlur = () => {
    // setTimeoutを使用して、クリックやフォーカス移動が先に処理されるのを待つ
    // document.activeElement がポップアップ内にあるか、またはポップアップ自体かを確認
    // 0msのsetTimeoutは、現在のJavaScriptの実行キューの最後にこの関数を配置し、
    // ブラウザがフォーカス変更などのUI更新を処理する機会を与える。
    setTimeout(() => {
      if (
        searchPopupRef.current &&
        searchPopupRef.current.contains(document.activeElement)
      ) {
        // フォーカスがポップアップ内に留まっているので、ポップアップを閉じない
        return;
      }
      setIsSearchPopupOpen(false);
    }, 0);
  };
  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <Label htmlFor="stockCodeForm">銘柄コード</Label>
          <div className="relative">
            <Input
              id="stockCodeForm"
              ref={searchInputRef}
              type="text"
              value={searchTerm} // 常にsearchTermを使用
              onChange={handleStockCodeInputChange}
              onKeyDown={handleStockCodeInputKeyDown}
              onFocus={() => {
                // フォーカス時に条件を満たせばポップアップを開く
                const nonNumericChars = searchTerm.replace(/[0-9]/g, "");

                if (
                  (searchResults.length > 0 || isSearchLoading) && // ローディング中でも開くように変更
                  nonNumericChars.length >= 2
                ) {
                  setIsSearchPopupOpen(true);
                }
              }}
              onBlur={() => {
                handleInputBlur();
              }}
              placeholder="コードまたは銘柄名"
              className="w-60"
              autoComplete="off" // ブラウザのオートコンプリートを無効化
            />
            {isSearchPopupOpen &&
              (searchResults.length > 0 || isSearchLoading) && (
                <div
                  ref={searchPopupRef} // ポップアップコンテナにrefを割り当て
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  role="listbox" // ARIAロールを追加
                >
                  {" "}
                  {isSearchLoading && (
                    <div className="p-2 text-sm text-gray-500">検索中...</div>
                  )}
                  {!isSearchLoading &&
                    searchResults.map(
                      (
                        stock,
                        index // index を使用
                      ) => (
                        <div
                          key={stock.code}
                          ref={(el) => {
                            searchResultsRef.current[index] = el;
                          }} // Refを割り当て、voidを返すように修正
                          tabIndex={0} // フォーカス可能にする
                          role="option" // ARIAロールを追加
                          aria-selected={false} // 必要に応じて選択状態を管理
                          className="p-2 text-sm hover:bg-gray-100 cursor-pointer focus:bg-gray-200 outline-none" // focusスタイル追加
                          onMouseDown={() => handleSearchSelection(stock)} // onMouseDownでblurより先にイベント発火
                          onKeyDown={(e) => {
                            // Enterキーでの選択
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchSelection(stock);
                            }
                            // ここで矢印キーのナビゲーションも追加可能
                            // 矢印キーでのナビゲーション
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              const currentIndex = searchResults.indexOf(stock);
                              const aNextIndex =
                                (currentIndex + 1) % searchResults.length;

                              searchResultsRef.current[aNextIndex]?.focus();
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              const currentIndex = searchResults.indexOf(stock);
                              const aPrevIndex =
                                (currentIndex - 1 + searchResults.length) %
                                searchResults.length;
                              searchResultsRef.current[aPrevIndex]?.focus();
                            } else if (e.key === "Escape") {
                              // Escapeキーでポップアップを閉じる
                              setIsSearchPopupOpen(false);
                              searchInputRef.current?.focus();
                            }
                          }}
                        >
                          {stock.code}: {stock.name}
                        </div>
                      )
                    )}
                  {!isSearchLoading &&
                    searchResults.length === 0 &&
                    searchTerm.replace(/[0-9]/g, "").length >= 2 && (
                      <div className="p-2 text-sm text-gray-500">該当なし</div>
                    )}
                </div>
              )}
          </div>
        </div>

        <div className="flex flex-col">
          <Label htmlFor="startDateForm">開始日</Label>
          <Input
            id="startDateForm"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            tabIndex={-1} // タブキーでのフォーカスを無効化
            className="w-40"
          />
        </div>
        <div className="flex flex-col">
          <Label htmlFor="endDateForm">終了日</Label>
          <Input
            id="endDateForm"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            tabIndex={-1} // タブキーでのフォーカスを無効化
            className="w-40"
          />
        </div>
        <Button
          type="submit"
          ref={submitButtonRef} // 送信ボタンにrefを設定
          disabled={isLoading}
        >
          {" "}
          {isLoading ? "読み込み中..." : "チャート表示"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-end pt-1">
        {/* StockChartViewHistoryコンポーネントを配置 */}
        <StockChartViewHistory
          userId={currentUserId}
          onSelectStock={handleHistorySelection}
        />
      </div>
    </form>
  );
};

export default StockChartSelectCode;
