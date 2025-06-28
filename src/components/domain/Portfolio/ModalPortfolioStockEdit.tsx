// components/domain/Portfolio/ModalPortfolioStockEdit.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PortfolioStockDetail } from "./types"; // 定義した型をインポート
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ModalPortfolioStockEditProps {
  isOpen: boolean;
  onClose: () => void;
  stock: PortfolioStockDetail | null; // 編集対象の銘柄データ
  onSave: (
    portfolioStockId: number,
    updates: {
      holdingsQuantity: number;
      purchasePrice: number;
      groupName: string;
      memo: string;
    }
  ) => Promise<void>;
  isLoading: boolean;
}

const ModalPortfolioStockEdit: React.FC<ModalPortfolioStockEditProps> = ({
  isOpen,
  onClose,
  stock,
  onSave,
  isLoading,
}) => {
  const [editedQuantity, setEditedQuantity] = useState(0);
  const [editedPurchasePrice, setEditedPurchasePrice] = useState(0);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedMemo, setEditedMemo] = useState("");

  useEffect(() => {
    if (stock) {
      setEditedQuantity(stock.holdingsQuantity || 0);
      setEditedPurchasePrice(stock.purchasePrice || 0);
      setEditedGroupName(stock.groupName || "");
      setEditedMemo(stock.memo || "");
    } else {
      setEditedQuantity(0);
      setEditedPurchasePrice(0);
      setEditedGroupName("");
      setEditedMemo("");
    }
  }, [stock]);

  const handleSave = useCallback(async () => {
    if (stock) {
      await onSave(stock.id, {
        holdingsQuantity: editedQuantity,
        purchasePrice: editedPurchasePrice,
        groupName: editedGroupName,
        memo: editedMemo,
      });
    }
  }, [
    stock,
    editedQuantity,
    editedPurchasePrice,
    editedGroupName,
    editedMemo,
    onSave,
  ]);

  if (!stock) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            銘柄を編集: {stock.name} ({stock.stockCode})
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            この銘柄の保有情報と詳細を編集します。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 保有数 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="quantity"
              className="text-right font-medium text-gray-700"
            >
              保有数:
            </Label>
            <Input
              id="quantity"
              type="number"
              value={editedQuantity}
              onChange={(e) => setEditedQuantity(Number(e.target.value))}
              className="col-span-3"
              disabled={isLoading}
              min="0"
            />
          </div>

          {/* 購入価格 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="purchasePrice"
              className="text-right font-medium text-gray-700"
            >
              購入価格:
            </Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              value={editedPurchasePrice}
              onChange={(e) => setEditedPurchasePrice(Number(e.target.value))}
              className="col-span-3"
              disabled={isLoading}
              min="0"
            />
          </div>

          {/* グループ名 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="groupName"
              className="text-right font-medium text-gray-700"
            >
              グループ名:
            </Label>
            <Input
              id="groupName"
              value={editedGroupName}
              onChange={(e) => setEditedGroupName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>

          {/* メモ */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label
              htmlFor="memo"
              className="text-right font-medium text-gray-700 pt-2"
            >
              メモ:
            </Label>
            <Textarea
              id="memo"
              value={editedMemo}
              onChange={(e) => setEditedMemo(e.target.value)}
              rows={3}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
        </div>

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
            disabled={
              isLoading || editedQuantity < 0 || editedPurchasePrice < 0
            }
            className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPortfolioStockEdit;
