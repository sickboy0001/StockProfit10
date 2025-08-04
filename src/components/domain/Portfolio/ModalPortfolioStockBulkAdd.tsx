// src/components/domain/Portfolio/ModalPortfolioStockBulkAdd.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getSptStocksCache } from "@/app/actions/Cache/SptStocks";

interface ModalPortfolioStockBulkAddProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stockCodesString: string) => Promise<void>;
  isLoading: boolean;
}

const ModalPortfolioStockBulkAdd: React.FC<ModalPortfolioStockBulkAddProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [stockCodesInput, setStockCodesInput] = useState("");
  const [validStockCodes, setValidStockCodes] = useState<Set<string>>(
    new Set()
  );

  // モーダルが開かれた時に有効な銘柄コードをキャッシュから取得
  useEffect(() => {
    if (isOpen && validStockCodes.size === 0) {
      // 既に取得済みの場合は再取得しない
      const fetchValidCodes = async () => {
        const allStocks = await getSptStocksCache();
        const codes = new Set(allStocks.map((stock) => stock.code));
        setValidStockCodes(codes);
      };
      fetchValidCodes();
    }
  }, [isOpen, validStockCodes.size]);

  const handleSave = () => {
    onSave(stockCodesInput);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>銘柄をまとめて追加</DialogTitle>
          <DialogDescription>
            銘柄コードをカンマ、スペース、または改行で区切って入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="stock-codes-bulk">銘柄コード</Label>
          <Textarea
            id="stock-codes-bulk"
            placeholder="7203, トヨタ自動車&#10;<9984>&#10;「5801」&#10;文章の中から<6524>のように抽出することも可能です。（yahoo,株探など）"
            value={stockCodesInput}
            onChange={(e) => setStockCodesInput(e.target.value)}
            className="mt-2 h-40 font-mono"
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "追加中..." : "追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPortfolioStockBulkAdd;
