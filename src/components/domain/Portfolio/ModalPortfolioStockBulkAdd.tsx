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
import { showCustomToast } from "@/components/organisms/CustomToast";
import { getSptStocksCache } from "@/app/actions/Cache/SptStocks";

interface ModalPortfolioStockBulkAddProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stockCodes: string[]) => Promise<void>;
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
    // 1. 括弧（<>,「」,()など）で囲まれた4桁または5桁の数字を抽出
    const bracketRegex = /[<「【『(](\d{4,5})[>」】』)]/g;
    const bracketMatches = [...stockCodesInput.matchAll(bracketRegex)];
    const codesFromBrackets = bracketMatches.map((match) => match[1]);

    // 2. 括弧で囲まれた部分を一時的に除去し、残りのテキストからコードを抽出
    const textForListParsing = stockCodesInput.replace(bracketRegex, " ");
    const codesFromList = textForListParsing
      .split(/[\s,、\r\n]+/) // カンマ、スペース、改行などで分割
      .map((code) => code.trim())
      .filter((code) => /^\d{4,5}$/.test(code)); // 4桁または5桁の数字のみを抽出

    // 3. 全てのコードを結合し、重複を排除
    const uniqueCodes = [
      ...new Set([...codesFromBrackets, ...codesFromList]),
    ].filter((code) => code.length > 0);

    // 4. spt_stocksに存在する銘柄コードのみにフィルタリング
    const codes = uniqueCodes.filter((code) => validStockCodes.has(code));

    if (codes.length === 0) {
      showCustomToast({
        message: "有効な銘柄コードが見つかりませんでした。",
        submessage: "入力内容を確認し、実在する銘柄コードを入力してください。",
        type: "error",
      });
      return;
    }

    onSave(codes);
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
