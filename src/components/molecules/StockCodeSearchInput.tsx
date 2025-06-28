// src/components/domain/Stock/StockCodeSearchInput.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchStocksByName, SearchedStockInfo } from "@/app/actions/stock"; // 銘柄名検索アクションをインポート

interface StockCodeSearchInputProps {
  value: string; // 親コンポーネントから渡される現在の銘柄コード（表示用）
  onValueChange: (newValue: string) => void; // 入力フィールドの値が変更されたときのコールバック
  onStockSelected: (stockCode: string) => void; // 検索結果から銘柄が選択されたときのコールバック
  isLoadingForm?: boolean; // 親フォームがロード中かどうかを示す（任意）
}

const StockCodeSearchInput: React.FC<StockCodeSearchInputProps> = ({
  value,
  onValueChange,
  onStockSelected,
  isLoadingForm = false,
}) => {
  // ユーザーが入力している検索語句
  const [searchTerm, setSearchTerm] = useState(value);
  // 検索結果
  const [searchResults, setSearchResults] = useState<SearchedStockInfo[]>([]);
  // 検索中かどうか
  const [isSearching, setIsSearching] = useState(false);
  // 検索結果ポップアップが表示されているかどうか
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  // デバウンス用のタイマー参照
  const searchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 入力フィールドのDOM要素への参照
  const searchInputRef = useRef<HTMLInputElement>(null);
  // 検索結果アイテムのDOM要素への参照の配列
  const searchResultsRef = useRef<(HTMLDivElement | null)[]>([]);
  // 検索ポップアップ全体のDOM要素への参照
  const searchPopupRef = useRef<HTMLDivElement>(null);

  // 親コンポーネントの 'value' が変更されたときに 'searchTerm' を同期する
  useEffect(() => {
    // valueがsearchTermと異なる場合のみ更新（ユーザー入力中に上書きしないため）
    if (value !== searchTerm && value !== "") {
      setSearchTerm(value);
    }
  }, [value, searchTerm]);

  // searchTermの変更を監視し、デバウンスをかけて検索を実行する
  useEffect(() => {
    // 既存のデバウンスタイマーがあればクリア
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
    }

    // 数字のみの入力、または2文字未満の非数字の場合は検索を行わない
    const nonNumericChars = searchTerm.replace(/[0-9]/g, "");
    if (/^[0-9]+$/.test(searchTerm) || nonNumericChars.length < 2) {
      setSearchResults([]);
      setIsSearchPopupOpen(false); // ポップアップを閉じる
      setIsSearching(false); // ローディング状態も解除
      return;
    }

    // デバウンス開始時にローディングを開始
    setIsSearching(true);
    // 検索条件を満たす場合、API呼び出し前にポップアップを開く
    if (!isSearchPopupOpen) {
      setIsSearchPopupOpen(true);
    }

    // 1秒後に検索を実行するデバウンスタイマーを設定
    searchDebounceTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`[StockCodeSearchInput] Searching for: "${searchTerm}"`);
        const response = await searchStocksByName(searchTerm);
        console.log(
          "[StockCodeSearchInput] API Response:",
          JSON.stringify(response, null, 2)
        );

        if (response.success && response.data) {
          setSearchResults(response.data);
          // 検索結果があればポップアップを開く（または開いたままにする）
          setIsSearchPopupOpen(true);
          searchResultsRef.current = response.data.map(() => null); // Ref配列をリセット
        } else {
          // 検索失敗または結果なし
          setSearchResults([]);
          setIsSearchPopupOpen(false); // ポップアップを閉じる
          if (response.error) {
            console.error("Search error:", response.error);
          }
        }
      } catch (error) {
        console.error("Error during searchStocksByName:", error);
        setSearchResults([]);
        setIsSearchPopupOpen(false); // 例外発生時もポップアップを閉じる
      } finally {
        setIsSearching(false); // 検索完了
      }
    }, 1000); // 1秒後に検索実行

    // クリーンアップ関数
    return () => {
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
      }
    };
  }, [searchTerm, isSearchPopupOpen]); // isSearchPopupOpenも依存配列に追加

  // 検索結果アイテムが選択されたときのハンドラ
  const handleSearchSelection = (selectedStock: SearchedStockInfo) => {
    setSearchTerm(selectedStock.code); // 入力フィールドの表示をコードに更新
    onStockSelected(selectedStock.code); // 親コンポーネントに選択されたコードを通知
    setIsSearchPopupOpen(false); // ポップアップを閉じる
    searchInputRef.current?.focus(); // 入力フィールドにフォーカスを戻す
  };

  // 入力フィールドの値が変更されたときのハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onValueChange(newValue); // 親コンポーネントにも値を即時反映
  };

  // 入力フィールドからフォーカスが外れたときのハンドラ（ポップアップの自動クローズ）
  const handleInputBlur = () => {
    // setTimeoutを使用して、クリックやフォーカス移動が先に処理されるのを待つ
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

  // 入力フィールドでのキーボード操作ハンドラ
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // フォームのデフォルト送信を防ぐ
      if (isSearchPopupOpen && searchResults.length > 0) {
        searchResultsRef.current[0]?.focus(); // ポップアップの最初のアイテムにフォーカス
      } else if (searchResults.length > 0) {
        // ポップアップが非表示でも結果がある場合、最初のものを選択
        handleSearchSelection(searchResults[0]);
      }
      // ポップアップも検索結果もない場合は、EnterキーでonSubmitが発火するはず
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); // デフォルトのスクロールを防ぐ
      if (searchResults.length > 0) {
        searchResultsRef.current[0]?.focus(); // ポップアップの最初のアイテムにフォーカス
      }
    }
  };

  return (
    <div className="relative flex flex-col">
      <Input
        id="stockCodeForm"
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onFocus={() => {
          // フォーカス時に条件を満たせばポップアップを開く
          const nonNumericChars = searchTerm.replace(/[0-9]/g, "");
          if (
            (searchResults.length > 0 || isSearching) && // ローディング中でも開く
            nonNumericChars.length >= 2
          ) {
            setIsSearchPopupOpen(true);
          }
        }}
        onBlur={handleInputBlur}
        placeholder="コードまたは銘柄名"
        className="w-60"
        autoComplete="off" // ブラウザのオートコンプリートを無効化
        disabled={isLoadingForm} // 親フォームのローディング状態を反映
      />
      {/* 検索結果ポップアップ */}
      {isSearchPopupOpen &&
        (isSearching ||
          searchResults.length > 0 ||
          searchTerm.replace(/[0-9]/g, "").length >= 2) && (
          <div
            ref={searchPopupRef}
            className="absolute z-10 w-full mt-11 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
            role="listbox" // ARIAロールを追加
          >
            {isSearching && (
              <div className="p-2 text-sm text-gray-500">検索中...</div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <>
                {searchResults.map((stock, index) => (
                  <div
                    key={stock.code}
                    ref={(el) => {
                      searchResultsRef.current[index] = el;
                    }}
                    tabIndex={0} // フォーカス可能にする
                    role="option" // ARIAロールを追加
                    aria-selected={false} // 必要に応じて選択状態を管理
                    className="p-2 text-sm hover:bg-gray-100 cursor-pointer focus:bg-gray-200 outline-none"
                    onMouseDown={() => handleSearchSelection(stock)} // onMouseDownでblurより先にイベント発火
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSelection(stock);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const nextIndex = (index + 1) % searchResults.length;
                        searchResultsRef.current[nextIndex]?.focus();
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        const prevIndex =
                          (index - 1 + searchResults.length) %
                          searchResults.length;
                        searchResultsRef.current[prevIndex]?.focus();
                      } else if (e.key === "Escape") {
                        setIsSearchPopupOpen(false);
                        searchInputRef.current?.focus();
                      }
                    }}
                  >
                    {stock.code}: {stock.name}
                  </div>
                ))}
              </>
            )}
            {!isSearching &&
              searchResults.length === 0 &&
              searchTerm.replace(/[0-9]/g, "").length >= 2 && (
                <div className="p-2 text-sm text-gray-500">該当なし</div>
              )}
          </div>
        )}
    </div>
  );
};

export default StockCodeSearchInput;
