// src/components/domain/Stock/StockDatabaseInfo.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CompanyStockDetail, StockDetails } from "@/types/stock";
import { format, parseISO } from "date-fns"; // getCompanyStockDetail の import は不要に
import DetailItem from "./DetailItem";
import { GetDetailItemDescription } from "@/constants/stockWord";
import { readAndRegistStockCompanyDetails } from "@/app/actions/readAndRegistStockCompanyDetails";

// Interface for individual detail items
interface DetailItemData {
  label: string;
  value: string;
  unit?: string;
  className?: string;
}

// Interface for categories
interface CategoryData {
  title: string;
  description: string;
  items: DetailItemData[];
}

interface DetailItemData {
  label: string;
  value: string;
  description?: string;
  unit?: string;
}
interface StockCompanyDetailProps {
  stockCode: string;
  isOpen: boolean; // ★ 親から開閉状態を受け取る
}

const StockCompanyDetail: React.FC<StockCompanyDetailProps> = ({
  stockCode,
}) => {
  const [stockInfo, setStockInfo] = useState<StockDetails | null>(null);
  const [stockDetail, setStockDetail] = useState<CompanyStockDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockCode) {
      setStockInfo(null);
      setError(null);
      setStockDetail(null);
      setIsLoading(false);
      return;
    }

    const loadStockInfo = async () => {
      setIsLoading(true);
      setError(null);
      setStockInfo(null); // 既存情報をクリア
      setStockDetail(null); // ★ 既存情報をクリア

      try {
        // サーバー側でデータをマージして返すようにしたため、呼び出しは1つに
        const stockDetailsResponse = await readAndRegistStockCompanyDetails(
          stockCode
        );

        if (stockDetailsResponse.data) {
          // 基本情報と詳細情報をそれぞれstateにセット
          setStockInfo(stockDetailsResponse.data);
          setStockDetail(stockDetailsResponse.data.company_detail);
        } else {
          setError((prevError) =>
            prevError
              ? `${prevError}\n${stockDetailsResponse.error}`
              : stockDetailsResponse.error
          );
        }
      } catch (e: unknown) {
        let errorMessage = "データの取得中に予期せぬエラーが発生しました。";
        if (e instanceof Error) {
          errorMessage = e.message;
        } else if (typeof e === "string") {
          errorMessage = e;
        }
        setError((prevError) =>
          prevError ? `${prevError}\n${errorMessage}` : errorMessage
        );
        setStockInfo(null);
        setStockDetail(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStockInfo();
  }, [stockCode]);

  if (isLoading) {
    return (
      <div className="p-4 my-4 border rounded-md text-center animate-pulse">
        銘柄情報を読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 my-4 border border-red-300 bg-red-50 rounded-md text-red-700">
        エラー: {error}
      </div>
    );
  }

  if (!stockInfo) {
    // stockCode があるが情報がない場合 (エラーなし) は、ロード前か該当なし
    return stockCode ? (
      <div className="p-4 my-4 border rounded-md text-gray-500">
        銘柄情報を表示できません。
      </div>
    ) : null;
  }

  const formatNumber = (
    value: number | null | undefined,
    fractionDigits: number = 0
  ) => {
    if (value === null || value === undefined) return "情報なし";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  };
  const categories: CategoryData[] = [];
  let lastUpdatedItem: DetailItemData | null = null;

  if (stockInfo && stockDetail) {
    categories.push(
      {
        title: "基本的な情報・企業規模・健全性",
        description: "",
        items: [
          {
            label: "取引可能",
            value:
              stockInfo.tradable === null || stockInfo.tradable === undefined
                ? "情報なし"
                : stockInfo.tradable
                ? "はい"
                : "いいえ",
          },
          {
            label: "上場日",
            value: stockInfo.listing_date
              ? format(parseISO(stockInfo.listing_date), "yyyy年M月d日")
              : "情報なし",
            unit: "",
          },
          {
            label: "最低購入代金",
            value: formatNumber(stockDetail.min_price),
            unit: "円",
          },
          {
            label: "単元株数",
            value: formatNumber(stockDetail.unit_shares),
            unit: "",
          },
          {
            label: "時価総額",
            value: formatNumber(stockDetail.market_cap),
            unit: "百万円",
          },
          {
            label: "発行済株式数",
            value: formatNumber(stockDetail.issued_shares),
            unit: "",
          },
          {
            label: "フリーCF",
            value: formatNumber(stockDetail.free_cash_flow),
            unit: "百万円",
          },
        ],
      },
      {
        title: "財務指標",
        description: "",

        items: [
          {
            label: "PER",
            value:
              typeof stockDetail.per === "number"
                ? stockDetail.per.toFixed(2)
                : "情報なし",
            unit: "倍",
          },
          {
            label: "PBR",
            value:
              typeof stockDetail.pbr === "number"
                ? stockDetail.pbr.toFixed(2)
                : "情報なし",
            unit: "倍",
          },
          {
            label: "EPS",
            value:
              typeof stockDetail.eps === "number"
                ? stockDetail.eps.toFixed(2)
                : "情報なし",
            unit: "円",
          },
          {
            label: "BPS",
            value:
              typeof stockDetail.bps === "number"
                ? stockDetail.bps.toFixed(2)
                : "情報なし",
            unit: "円",
          },
          {
            label: "ROE",
            value:
              typeof stockDetail.roe === "number"
                ? stockDetail.roe.toFixed(2)
                : "情報なし",
            unit: "%",
          },
          {
            label: "ROA",
            value:
              typeof stockDetail.roa === "number"
                ? stockDetail.roa.toFixed(2)
                : "情報なし",
            unit: "%",
          },
          {
            label: "自己資本比率",
            value:
              typeof stockDetail.equity_ratio === "number"
                ? stockDetail.equity_ratio.toFixed(2)
                : "情報なし",
            unit: "%",
          },
          {
            label: "営業利益率",
            value:
              typeof stockDetail.operating_margin === "number"
                ? stockDetail.operating_margin.toFixed(2)
                : "情報なし",
            unit: "%",
          },
          {
            label: "PEGレシオ",
            value:
              typeof stockDetail.peg_ratio === "number"
                ? stockDetail.peg_ratio.toFixed(2)
                : "情報なし",
          },
          {
            label: "ICR",
            value:
              typeof stockDetail.interest_coverage === "number"
                ? stockDetail.interest_coverage.toFixed(2)
                : "情報なし",
          },
          {
            label: "ベータ値",
            value:
              typeof stockDetail.beta === "number"
                ? stockDetail.beta.toFixed(2)
                : "情報なし",
          },
        ],
      },
      {
        title: "株価情報",
        description: "",

        items: [
          {
            label: "年初来高値",
            value: formatNumber(stockDetail.high_price_ytd),
            unit: "円",
          },
          {
            label: "年初来安値",
            value: formatNumber(stockDetail.low_price_ytd),
            unit: "円",
          },
        ],
      },
      {
        title: "配当情報",
        description: "",

        items: [
          {
            label: "配当利回り",
            value:
              typeof stockDetail.div_yield === "number"
                ? stockDetail.div_yield.toFixed(2)
                : "情報なし",
            unit: "%",
          },
          {
            label: "1株配当",
            value:
              typeof stockDetail.dividend === "number"
                ? stockDetail.dividend.toFixed(2)
                : "情報なし",
            unit: "円",
          },
        ],
      }
    );

    // lastUpdatedItem を categories 配列とは別に設定
    lastUpdatedItem = {
      label: "最終更新日",
      value: stockDetail.updated_at
        ? format(parseISO(stockDetail.updated_at), "yyyy年M月d日")
        : "情報なし",
      className: "md:col-span-4", // Span across all columns in a 4-column grid
    };

    // description の設定は categories 配列に対してのみ行う
    // 副作用のみなので .map の代わりに .forEach を使用
    categories.forEach((category) => {
      category.items.forEach((item) => {
        item.description = GetDetailItemDescription(item.label);
      });
    });
  }
  return (
    <div className="pt-2 pb-1 px-1 border-t border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-x-3 gap-y-1 text-sm text-gray-900">
        {categories.map((category) => (
          <React.Fragment key={category.title}>
            <h3 className="md:col-span-5 text-base font-semibold text-gray-700 mt-2 mb-1 pt-2 border-b border-slate-600">
              {category.title}
            </h3>
            {category.items.map((item) => (
              <DetailItem
                key={item.label}
                label={item.label}
                value={item.value}
                description={item.description}
                unit={item.unit}
              />
            ))}
          </React.Fragment>
        ))}

        {lastUpdatedItem && (
          <>
            <h3 className="md:col-span-4 text-base font-semibold text-gray-500 mt-3 mb-1 pt-2 border-slate-600">
              {lastUpdatedItem.label} {lastUpdatedItem.value}
            </h3>
          </>
        )}
        {/* stockDetailがロードされておらず、エラーもないが、companyDetailItemsが空の場合の表示 */}
        {!isLoading && !error && stockInfo && !stockDetail && (
          <div className="md:col-span-4 text-gray-500">
            企業詳細データは現在利用できません。
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCompanyDetail;
