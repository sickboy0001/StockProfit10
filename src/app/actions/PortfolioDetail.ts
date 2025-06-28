// app/actions/portfolio-detail.ts
"use server";
import { createClient } from "@/util/supabase/server";

import {
  PortfolioDetailData,
  PortfolioStockDetail,
} from "@/types/PortfolioDetail"; // 定義した型をインポート

// get_portfolio_stock_details RPCが返す行の型
interface PortfolioStockRpcResult {
  id: number;
  stock_code: string;
  stock_name: string;
  stock_market: string | null;
  current_price: number | null;
  previous_day_close_price: number | null;
}

/**
 * 指定されたポートフォリオIDの詳細データを取得します。
 * 関連する銘柄情報、最新の株価データもフェッチします。
 *
 * @param portfolioId ポートフォリオのID
 * @returns ポートフォリオ詳細データ、またはエラー
 */
export async function readPortfolioDetailAction(
  portfolioId: string
): Promise<PortfolioDetailData | { error: string }> {
  const supabase = await createClient();

  try {
    // 1. ポートフォリオの基本情報を取得
    const { data: portfolioData, error: portfolioError } = await supabase
      .from("spt_portfolios")
      .select("id, name, memo, created_at, updated_at")
      // SupabaseのIDはtext/uuid型ですが、PostgreSQL関数の引数はINTEGERなので変換が必要です。
      // ただし、spt_portfoliosのidがINTEGER型である前提で進めます。
      // もしUUID型の場合は、別途DB側でUUID->INTEGERの変換ロジックや、
      // ポートフォリオIDをUUIDとして扱う関数が必要です。
      // 現状のテーブル定義が 'id SERIAL PRIMARY KEY' (INTEGER) のため、ここではparseIntを使用。
      .eq("id", parseInt(portfolioId))
      .single();

    if (portfolioError) {
      console.error(
        "ポートフォリオ基本情報の取得に失敗しました:",
        portfolioError.message
      );
      return { error: "ポートフォリオが見つからないか、アクセスできません。" };
    }

    // 2. PostgreSQL関数 `get_portfolio_stock_details` を呼び出して銘柄の詳細情報を取得
    const { data: stocksRpcData, error: stocksRpcError } = await supabase.rpc(
      "get_portfolio_stock_details",
      {
        p_portal_id: parseInt(portfolioId),
      }
    );

    if (stocksRpcError) {
      console.error(
        "PostgreSQL関数呼び出しエラー (get_portfolio_stock_details):",
        stocksRpcError.message
      );
      return {
        error: `銘柄詳細の取得に失敗しました: ${stocksRpcError.message}`,
      };
    }

    // RPCから取得したデータをPortfolioStockDetail型に整形
    // RPCの結果には保有数や購入価格が含まれないため、spt_portfolio_stocksから別途取得、またはRPC関数を拡張する必要があります。
    // ここでは簡易的に、RPCで取得できるデータのみで構成します。
    // complete `PortfolioStockDetail` will need additional fields like quantity and purchasePrice
    // which are not returned by the RPC function based on its RETURNS TABLE clause.
    // If these fields are critical for display/calculations, they need to be added to the RPC function's RETURN TABLE.
    const stocks: PortfolioStockDetail[] = (stocksRpcData || []).map(
      (rpcStock: PortfolioStockRpcResult) => {
        const currentPrice = rpcStock.current_price;
        const previousDayClosePrice = rpcStock.previous_day_close_price;
        let previousDayChange: number | null = null;
        let previousDayChangeRate: number | null = null;

        if (currentPrice !== null && previousDayClosePrice !== null) {
          previousDayChange = currentPrice - previousDayClosePrice;
          if (previousDayClosePrice !== 0) {
            previousDayChangeRate =
              (previousDayChange / previousDayClosePrice) * 100;
          }
        }

        return {
          id: rpcStock.id,
          stockCode: rpcStock.stock_code,
          name: rpcStock.stock_name,
          market: rpcStock.stock_market,
          groupName: null, // RPCにgroup_nameが含まれないため一旦null
          memo: null, // RPCにmemoが含まれないため一旦null
          displayOrder: 0, // RPCにdisplay_orderが含まれないため一旦0
          holdingsQuantity: 0, // RPCに保有数がないため一旦0
          purchasePrice: 0, // RPCに購入価格がないため一旦0
          latestDailyQuote: {
            date: new Date().toISOString().split("T")[0], // 最新株価の日付は簡易的に現在日
            open: null,
            high: null,
            low: null,
            close: currentPrice,
            volume: null,
          },
          previousDayClose: previousDayClosePrice,
          currentPrice: currentPrice,
          previousDayChange: previousDayChange,
          previousDayChangeRate: previousDayChangeRate,
          profitLoss: null, // クライアント側で計算が必要
          profitLossRate: null, // クライアント側で計算が必要
        };
      }
    );

    // ポートフォリオ全体の集計値を計算 (銘柄の保有数と購入価格が必要なため、ここでは仮の値または0)
    // 実際のアプリケーションでは、RPC関数を拡張してquantityとpurchase_priceも返すようにするか、
    // またはクライアント側で別途これらの値を考慮した計算ロジックが必要です。
    const totalCurrentValue = stocks.reduce(
      (sum, stock) => sum + (stock.currentPrice ? stock.currentPrice : 0),
      0
    );
    const totalPurchaseValue = 0; // 保有数と購入価格がないため計算不可
    const totalProfitLoss = 0; // 保有数と購入価格がないため計算不可
    const totalProfitLossRate = 0; // 保有数と購入価格がないため計算不可

    return {
      id: portfolioData.id.toString(), // IDをstringに変換して返す
      title: portfolioData.name,
      description: portfolioData.memo,
      createdAt: portfolioData.created_at,
      updatedAt: portfolioData.updated_at,
      stocks: stocks,
      totalCurrentValue,
      totalPurchaseValue,
      totalProfitLoss,
      totalProfitLossRate,
    };
  } catch (err: unknown) {
    console.error("getPortfolioDetail で予期せぬエラー:", err);
    let errorMessage =
      "ポートフォリオ詳細の取得中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `ポートフォリオ詳細の取得中にサーバーエラーが発生しました: ${err.message}`;
    }
    return { error: errorMessage };
  }
}

/**
 * ポートフォリオに新しい銘柄を追加します。
 *
 * @param portalId ポートフォリオID
 * @param stockCode 銘柄コード
 * @returns 成功した場合は追加された銘柄のID、またはエラー
 */
export async function addPortfolioStock(
  portalId: string,
  stockCode: string
): Promise<{ id: number } | { error: string }> {
  const supabase = await createClient();

  try {
    // stock_code が spt_stocks に存在するか確認 (参照整合性)
    const { data: stockExists, error: stockError } = await supabase
      .from("spt_stocks")
      .select("code")
      .eq("code", stockCode)
      .single();

    if (stockError || !stockExists) {
      return { error: "指定された銘柄コードは存在しません。" };
    }

    // ポートフォリオ内の既存銘柄の最大display_orderを取得
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from("spt_portfolio_stocks")
      .select("display_order")
      .eq("portal_id", portalId)
      .order("display_order", { ascending: false })
      .limit(1);

    if (maxOrderError) {
      console.error(
        "銘柄の最大表示順の取得に失敗しました:",
        maxOrderError.message
      );
      return { error: `銘柄追加に失敗しました: ${maxOrderError.message}` };
    }

    const newDisplayOrder =
      maxOrderData && maxOrderData.length > 0
        ? maxOrderData[0].display_order + 1
        : 1;

    // spt_portfolio_stocks に挿入
    const { data, error } = await supabase
      .from("spt_portfolio_stocks")
      .insert({
        portal_id: portalId,
        stock_code: stockCode,
        display_order: newDisplayOrder,
        // group_name, memo は任意なので、初期追加時はnullまたは空文字列
      })
      .select("id")
      .single();

    if (error) {
      console.error("ポートフォリオへの銘柄追加に失敗しました:", error.message);
      return { error: `銘柄の追加に失敗しました: ${error.message}` };
    }

    return { id: data.id };
  } catch (err: unknown) {
    console.error("addPortfolioStock で予期せぬエラー:", err);
    let errorMessage =
      "ポートフォリオへの銘柄追加中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `ポートフォリオへの銘柄追加中にサーバーエラーが発生しました: ${err.message}`;
    }
    return { error: errorMessage };
  }
}

/**
 * ポートフォリオから銘柄を削除します。
 *
 * @param portfolioStockId spt_portfolio_stocks のID
 * @returns 成功した場合は true、またはエラー
 */
export async function removePortfolioStock(
  portfolioStockId: number
): Promise<boolean | { error: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("spt_portfolio_stocks")
      .delete()
      .eq("id", portfolioStockId);

    if (error) {
      console.error(
        "ポートフォリオからの銘柄削除に失敗しました:",
        error.message
      );
      return { error: `銘柄の削除に失敗しました: ${error.message}` };
    }
    return true;
  } catch (err: unknown) {
    console.error("removePortfolioStock で予期せぬエラー:", err);
    let errorMessage =
      "ポートフォリオからの銘柄削除中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `ポートフォリオからの銘柄削除中にサーバーエラーが発生しました: ${err.message}`;
    }
    return { error: errorMessage };
  }
}

/**
 * ポートフォリオ内の銘柄情報を更新します。
 *
 * @param portfolioStockId spt_portfolio_stocks のID
 * @param updates 更新するデータ (例: quantity, purchase_price, group_name, memo)
 * @returns 成功した場合は更新された銘柄データ、またはエラー
 */
export async function updatePortfolioStock(
  portfolioStockId: number,
  updates: Partial<
    Omit<
      PortfolioStockDetail,
      | "id"
      | "stockCode"
      | "name"
      | "market"
      | "latestDailyQuote"
      | "addedAt"
      | "currentPrice"
      | "previousDayChange"
      | "previousDayChangeRate"
      | "profitLoss"
      | "profitLossRate"
    >
  >
): Promise<PortfolioStockDetail | { error: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("spt_portfolio_stocks")
      .update({
        quantity: updates.holdingsQuantity,
        purchase_price: updates.purchasePrice,
        group_name: updates.groupName,
        memo: updates.memo,
        display_order: updates.displayOrder, // display_orderも更新できるように含める
      })
      .eq("id", portfolioStockId)
      .select(
        `
        id,
        stock_code,
        display_order,
        group_name,
        memo,
        added_at,
        quantity,
        purchase_price,
        spt_stocks (name, market)
      `
      )
      .single();

    if (error) {
      console.error("ポートフォリオ銘柄の更新に失敗しました:", error.message);
      return { error: `銘柄情報の更新に失敗しました: ${error.message}` };
    }

    // 最新の日次株価データは別途取得するか、クライアント側で対応
    // ここでは簡易的に、更新された基本情報とダミーの最新株価情報で返す
    return {
      id: data.id,
      stockCode: data.stock_code,
      name: (data.spt_stocks as { name: string }).name,
      market: (data.spt_stocks as { market: string }).market,
      groupName: data.group_name,
      memo: data.memo,
      displayOrder: data.display_order,
      addedAt: data.added_at,
      holdingsQuantity: data.quantity,
      purchasePrice: data.purchase_price,
      // その他の計算される値は含まない、またはダミー値
      latestDailyQuote: null,
      currentPrice: null,
      previousDayChange: null,
      previousDayChangeRate: null,
      profitLoss: null,
      profitLossRate: null,
    } as PortfolioStockDetail;
  } catch (err: unknown) {
    console.error("updatePortfolioStock で予期せぬエラー:", err);
    let errorMessage =
      "ポートフォリオ銘柄の更新中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `ポートフォリオ銘柄の更新中にサーバーエラーが発生しました: ${err.message}`;
    }
    return { error: errorMessage };
  }
}

/**
 * ポートフォリオ内の銘柄の表示順を一括更新します。
 *
 * @param stocksOrderList 更新する銘柄IDとdisplayOrderの配列
 * @returns 成功した場合は true、またはエラー
 */
export async function updatePortfolioStockOrder(
  stocksOrderList: { id: number; displayOrder: number }[]
): Promise<boolean | { error: string }> {
  const supabase = await createClient();

  try {
    // 複数のレコードを更新
    // エラーが発生した場合に一部だけ更新されるのを避けるため、
    // 本来はDBのトランザクション内で実行するのが望ましい。
    // SupabaseのJSクライアントで直接トランザクションを制御するのは難しいため、
    // 個別にUPDATEを実行し、エラーがあれば最初のものだけを返す。
    // より堅牢にするにはRPC関数化を検討。
    for (const stock of stocksOrderList) {
      const { error } = await supabase
        .from("spt_portfolio_stocks")
        .update({
          display_order: stock.displayOrder,
          updated_at: new Date().toISOString(), // 表示順更新時もupdated_atを更新
        })
        .eq("id", stock.id);

      if (error) {
        console.error(
          `ポートフォリオ銘柄(ID: ${stock.id})の表示順更新に失敗しました:`,
          error.message
        );
        // 最初のエラーで処理を中断し、エラーを返す
        return { error: `表示順の更新に失敗しました: ${error.message}` };
      }
    }
    return true;
  } catch (err: unknown) {
    console.error("updatePortfolioStockOrder で予期せぬエラー:", err);
    let errorMessage =
      "ポートフォリオ銘柄の表示順更新中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `ポートフォリオ銘柄の表示順更新中にサーバーエラーが発生しました: ${err.message}`;
    }
    return { error: errorMessage };
  }
}

/**
 * ポートフォリオの基本情報（タイトル、説明）を更新します。
 *
 * @param portfolioId ポートフォリオID
 * @param title 新しいタイトル
 * @param description 新しい説明
 * @returns 成功した場合は更新されたポートフォリオデータ、またはエラー
 */
export async function updatePortfolioBasicInfo(
  portfolioId: string,
  title: string,
  description: string
): Promise<
  | { id: string; title: string; description: string; updatedAt: string }
  | { error: string }
> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("spt_portfolios")
      .update({
        name: title,
        memo: description,
      })
      .eq("id", portfolioId)
      .select("id, name, memo, updated_at")
      .single();

    if (error) {
      console.error(
        "ポートフォリオ基本情報の更新に失敗しました:",
        error.message
      );
      return { error: `ポートフォリオの更新に失敗しました: ${error.message}` };
    }

    return {
      id: data.id,
      title: data.name,
      description: data.memo,
      updatedAt: data.updated_at,
    };
  } catch (err: unknown) {
    console.error("updatePortfolioBasicInfo で予期せぬエラー:", err);
    let errorMessage =
      "ポートフォリオ基本情報の更新中にサーバーエラーが発生しました。";
    if (err instanceof Error) {
      errorMessage = `ポートフォリオ基本情報の更新中にサーバーエラーが発生しました: ${err.message}`;
    }
    return { error: errorMessage };
  }
}
