// src/components/domain/Stock/PortfolioButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { readPortfoliosAction } from "@/app/actions/Portfolio";
import { Portfolio } from "@/types/Portfolio";
import { addPortfolioStock } from "@/app/actions/PortfolioDetail";
import { showCustomToast } from "@/components/organisms/CustomToast";
interface PortfolioButtonProps {
  stockCode: string;
  stockName: string;
  userId?: string;
}

const PortfolioButton: React.FC<PortfolioButtonProps> = ({
  stockCode,
  stockName,
  userId,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ドロップダウンが開かれるタイミングでポートフォリオを読み込む
  useEffect(() => {
    // ドロップダウンが開き、まだデータが読み込まれていない場合に実行
    if (isDropdownOpen && !portfolios.length && !isLoading) {
      const fetchPortfolios = async () => {
        if (!userId) {
          setError("ログインが必要です。");
          return;
        }

        setIsLoading(true);
        setError(null);
        try {
          const result = await readPortfoliosAction(userId);
          if (result.error) {
            setError(`読込失敗: ${result.error}`);
            setPortfolios([]);
            // 必要に応じてトースト通知などでユーザーにエラーを知らせるとより親切です
            console.error(
              `ポートフォリオの読み込みに失敗しました: ${result.error}`
            );
          } else if (result.data) {
            setPortfolios(result.data);
          } else {
            setPortfolios([]); // データがnullの場合も空配列に設定
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setError(`予期せぬエラー: ${errorMessage}`);
          setPortfolios([]);
          console.error(
            `ポートフォリオの読み込み中に予期せぬエラーが発生しました: ${errorMessage}`
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchPortfolios();
    }
  }, [isDropdownOpen, userId, portfolios.length, isLoading]);

  const handlePortfolioSelect = async (portfolioId: string) => {
    if (!userId) {
      alert("ログインが必要です。");
      return;
    }
    setIsSaving(true);
    setIsDropdownOpen(false); // 選択後すぐにドロップダウンを閉じる

    try {
      const result = await addPortfolioStock(portfolioId, stockCode);

      if ("error" in result) {
        alert(`銘柄の追加に失敗しました: ${result.error}`);
      } else {
      }
      showCustomToast({
        message: "成功",
        submessage: `銘柄「${stockName}」をポートフォリオに追加しました。`,
        type: "success",
      });
    } catch (e) {
      console.error("Failed to add stock:", e);
      alert("銘柄の追加中に予期せぬエラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userId) {
    return null; // ログインしていないユーザーにはボタンを表示しない
  }

  // ドロップダウンの中身を状況に応じてレンダリングする関数
  const renderDropdownContent = () => {
    if (isLoading) {
      return <DropdownMenuItem disabled>読み込み中...</DropdownMenuItem>;
    }

    if (error) {
      return (
        <DropdownMenuItem disabled className="text-red-500">
          {error}
        </DropdownMenuItem>
      );
    }

    if (portfolios.length > 0) {
      return portfolios.map((portfolio) => (
        <DropdownMenuItem
          key={portfolio.id}
          onSelect={() => handlePortfolioSelect(portfolio.id.toString())}
          disabled={isSaving}
        >
          {portfolio.name}
        </DropdownMenuItem>
      ));
    }

    return (
      <DropdownMenuItem disabled>ポートフォリオがありません</DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isSaving}
          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
        >
          {isSaving ? "追加中..." : "ポートフォリオに追加"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {renderDropdownContent()}
        <DropdownMenuSeparator />
        {/* ポートフォリオ作成への誘導 (例) */}
        <DropdownMenuItem asChild>
          <Link
            href="/Portfolio/List" // ポートフォリオ管理ページへのリンク
            className="text-blue-600 hover:underline w-full cursor-pointer"
          >
            ポートフォリオを管理
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PortfolioButton;
