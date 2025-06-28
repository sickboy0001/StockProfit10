// components/domain/Portfolio/ModalPortfolioEdit.tsx
import React, { useState, useEffect, useCallback } from "react";

// shadcn/ui の Dialog コンポーネントを想定
// インストール済みであることを前提とします
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // shadcn/ui の Button をインポート
import { Input } from "@/components/ui/input"; // shadcn/ui の Input をインポート
import { Textarea } from "@/components/ui/textarea"; // shadcn/ui の Textarea をインポート
import { Label } from "@/components/ui/label"; // shadcn/ui の Label をインポート
import { PortfolioEditData } from "@/types/PortfolioEdit"; // 汎用的な型をインポート

interface ModalPortfolioEditProps {
  isOpen: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じるハンドラ
  portfolio: PortfolioEditData | null; // 編集対象のポートフォリオデータ (null の可能性あり)
  onSave: (
    portfolioId: string,
    title: string,
    description: string
  ) => Promise<void>; // 保存処理を実行するハンドラ
  isLoading: boolean; // 保存中のローディング状態
}

const ModalPortfolioEdit: React.FC<ModalPortfolioEditProps> = ({
  isOpen,
  onClose,
  portfolio,
  onSave,
  isLoading,
}) => {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  // portfolio データが変更された時に、編集フォームの値を初期化
  useEffect(() => {
    if (portfolio) {
      setEditedTitle(portfolio.name || "");
      setEditedDescription(portfolio.memo || "");
    } else {
      // portfolio が null の場合はフォームをクリア
      setEditedTitle("");
      setEditedDescription("");
    }
  }, [portfolio]);

  // 保存ボタンクリック時のハンドラ
  const handleSave = useCallback(async () => {
    if (portfolio) {
      await onSave(portfolio.id, editedTitle, editedDescription);
      // onSaveが完了すると、親コンポーネントでisLoadingがfalseになり、モーダルが閉じられることを想定しています
    }
  }, [portfolio, editedTitle, editedDescription, onSave]);

  // portfolio が null の場合はモーダルを表示しないか、ローディング状態を表示するなどの考慮が必要
  if (!portfolio) return null;

  return (
    // DialogコンポーネントのopenとonOpenChangeはshadcn/uiの標準的な使い方
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            ポートフォリオを編集
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            ポートフォリオ `{portfolio.name}` の詳細情報を編集します。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* ポートフォリオID表示（任意） */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="portfolioId"
              className="text-right font-medium text-gray-700"
            >
              ID:
            </Label>
            <span
              id="portfolioId"
              className="col-span-3 text-gray-800 font-mono text-sm"
            >
              {portfolio.id}...
            </span>
          </div>

          {/* タイトル入力フィールド */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="title"
              className="text-right font-medium text-gray-700"
            >
              タイトル:
            </Label>
            <Input
              id="title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
              required
            />
          </div>

          {/* 説明入力フィールド */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label
              htmlFor="description"
              className="text-right font-medium text-gray-700 pt-2"
            >
              説明:
            </Label>
            <Textarea
              id="description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="col-span-3 h-24"
              disabled={isLoading}
            />
          </div>

          {/* その他の詳細情報（例: 銘柄リストなど）はここにさらに追加可能 */}
          {/*
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-medium text-gray-700 pt-2">
              含まれる銘柄:
            </Label>
            <div className="col-span-3 text-gray-800 text-sm">
              {portfolio.stocks && portfolio.stocks.length > 0
                ? portfolio.stocks.map(s => `[${s.code}] ${s.name}`).join(', ')
                : '銘柄がありません'}
            </div>
          </div>
          */}
        </div>

        {/* フッターのボタン */}
        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-md border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isLoading || !editedTitle || !editedTitle.trim()} // タイトルが空の場合は保存ボタンを無効化
            className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPortfolioEdit;
