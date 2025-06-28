"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { readPortfoliosAction } from "@/app/actions/Portfolio";
import { showCustomToast } from "@/components/organisms/CustomToast";

interface FetchedPortfolio {
  id: string;
  name: string;
  stocks: { code: string; name: string }[];
}

interface PortfolioSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPortfolio: (portfolio: FetchedPortfolio) => void;
  currentSelectedPortfolioId: string | null; // To show which one is currently selected
}

// APIから返ってくるstockの型を定義
type ApiStock = {
  stock_code: string;
  stock_name: string | null; // stock_nameがnullになる可能性も考慮
  // 他にもAPIから返ってくるプロパティがあればここに追加
};

// APIから返ってくるポートフォリオの型を定義
interface PortfolioFromApi {
  id: string;
  name: string;
  stocks: ApiStock[];
}

export const PortfolioSelectionModal: React.FC<
  PortfolioSelectionModalProps
> = ({ isOpen, onClose, onSelectPortfolio, currentSelectedPortfolioId }) => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<FetchedPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    currentSelectedPortfolioId
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchPortfolios = async () => {
      if (!user?.id) {
        setError("ポートフォリオを表示するにはログインが必要です。");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await readPortfoliosAction(user.id);
        if (result.data) {
          // readPortfoliosActionの戻り値の型定義と実際のデータ構造が異なるため、
          // unknownを介した型アサーションで強制的に型を合わせる
          const mappedPortfolios = (
            result.data as unknown as PortfolioFromApi[]
          ).map((portfolio) => ({
            ...portfolio,
            // portfolio.stocksはApiStock[]なので、stockはApiStockと推論される
            stocks: portfolio.stocks.map((stock) => ({
              code: stock.stock_code,
              name: stock.stock_name || "",
            })),
          }));
          setPortfolios(mappedPortfolios);
        } else {
          setPortfolios([]);
          if (result.error) {
            setError(`ポートフォリオの読み込みに失敗しました: ${result.error}`);
            showCustomToast({
              message: "エラー",
              submessage: `ポートフォリオの読み込みに失敗しました: ${result.error}`,
              type: "error",
            });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(
          `ポートフォリオの読み込み中に予期せぬエラーが発生しました: ${errorMessage}`
        );
        showCustomToast({
          message: "システムエラー",
          submessage: `ポートフォリオの読み込み中に予期せぬエラーが発生しました。`,
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolios();
  }, [isOpen, user?.id]);

  useEffect(() => {
    setSelectedPortfolioId(currentSelectedPortfolioId);
  }, [currentSelectedPortfolioId]);

  const handleSelect = () => {
    if (selectedPortfolioId) {
      const selected = portfolios.find((p) => p.id === selectedPortfolioId);
      if (selected) {
        onSelectPortfolio(selected);
      }
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl rounded-lg border border-gray-200">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-800">
            ポートフォリオを選択
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500">読み込み中...</div>
          ) : error ? (
            <div className="text-center text-red-500">エラー: {error}</div>
          ) : portfolios.length === 0 ? (
            <div className="text-center text-gray-500">
              利用可能なポートフォリオがありません。
            </div>
          ) : (
            <RadioGroup
              value={selectedPortfolioId || ""}
              onValueChange={setSelectedPortfolioId}
              className="space-y-2 max-h-60 overflow-y-auto"
            >
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPortfolioId(portfolio.id)}
                >
                  <RadioGroupItem
                    value={portfolio.id}
                    id={`portfolio-${portfolio.id}`}
                  />
                  <Label
                    htmlFor={`portfolio-${portfolio.id}`}
                    className="flex-grow cursor-pointer"
                  >
                    <span className="font-medium">{portfolio.name}</span>
                    <p className="text-gray-500 text-sm">
                      銘柄数: {portfolio.stocks.length}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSelect}
              disabled={!selectedPortfolioId}
            >
              選択
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
