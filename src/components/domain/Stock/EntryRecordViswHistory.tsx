"use client"; // useEffectを使用するため、このコンポーネントはクライアントコンポーネントである必要があります

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { recordStockView } from "@/app/actions/stock";

interface StockChartProps {
  stockCode: string;
}

const EntryRecordViswHistory: React.FC<StockChartProps> = ({ stockCode }) => {
  const { user } = useAuth(); // ★ Context からユーザー情報とローディング状態を取得
  // console.log("user:", user);
  useEffect(() => {
    if (user?.id && stockCode && stockCode.length >= 4) {
      // コンポーネントがマウントされ、ユーザーと銘柄コードが利用可能なときに銘柄の閲覧履歴を記録
      recordStockView(user.id, stockCode)
        .then((response) => {
          if (response.success) {
            console.log("銘柄閲覧履歴が正常に記録されました！");
          } else {
            console.error("銘柄閲覧履歴の記録に失敗しました:", response.error);
          }
        })
        .catch((error) => {
          console.error(
            "recordStockViewサーバーアクションの呼び出しエラー:",
            error
          );
        });
    }
  }, [user, stockCode]); // userまたはstockCodeが変更された場合にエフェクトを再実行

  // ... チャートを描画するためのStockChartコンポーネントの残りのロジック
  return <></>;
};

export default EntryRecordViswHistory;
