"use server";
import { Portfolio } from "@/types/Portfolio";

// サーバーアクションであることを示す
import { createClient } from "@/util/supabase/server";

// Database row type for spt_portfolio_stocks
interface SptPortfolioStockDbRow {
  code: string;
  name: string;
  // Add other columns from spt_portfolio_stocks if they are used or relevant
  // For Portfolio.stocks, only code and name are strictly needed by the Portfolio type.
  [key: string]: unknown; // Allows for other properties if `*` is selected
}

// Database row type for spt_portfolios when spt_portfolio_stocks are joined
interface SptPortfolioWithStocksDbRow {
  id: number; // Assuming id is a number from DB
  user_id: string;
  name: string;
  memo: string | null; // Assuming memo can be null in the DB
  display_order: number;
  created_at: string;
  updated_at: string;
  spt_portfolio_stocks: SptPortfolioStockDbRow[];
}

// Database row type for spt_portfolios (base, without joins or for simple selects)
interface SptPortfolioBaseDbRow {
  id: number;
  user_id: string;
  name: string;
  memo: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function readPortfoliosAction(userId: string): Promise<{
  data: Portfolio[] | null;
  error: string | null;
}> {
  const supabase = await createClient();
  if (!userId) {
    return { data: null, error: "User ID is required." };
  }
  try {
    const { data, error } = await supabase
      .from("spt_portfolios")
      .select("*, spt_portfolio_stocks(*)")
      .eq("user_id", userId) // ユーザーIDでフィルタリング
      .order("display_order");
    if (error) throw error;

    const portfolios: Portfolio[] = data.map(
      (dbRow: SptPortfolioWithStocksDbRow) => ({
        id: String(dbRow.id),
        user_id: dbRow.user_id,
        name: dbRow.name,
        memo: dbRow.memo ?? "", // Ensure memo is a string, defaulting to empty if null
        displayOrder: dbRow.display_order,
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at,
        stocks: dbRow.spt_portfolio_stocks || [], // 関連する株式情報
      })
    );

    return { data: portfolios, error: null };
  } catch (err: unknown) {
    let message = `Failed to read portfolios for user ${userId}`;
    if (err instanceof Error) message = err.message;
    return {
      data: null,
      error: message,
    };
  }
}

export async function createPortfolioAction(params: {
  userId: string;
  name: string;
  memo?: string;
  displayOrder: number;
}): Promise<{ data: Portfolio | null; error: string | null }> {
  const supabase = await createClient();
  const { userId, name, memo = "", displayOrder } = params; // Supabaseクライアント初期化後に移動
  if (!userId) {
    return { data: null, error: "User ID is required to create a portfolio." };
  }
  try {
    const { data: insertedData, error: dbError } = await supabase
      .from("spt_portfolios")
      .insert({
        user_id: userId,
        name: name,
        memo: memo,
        display_order: displayOrder,
        // stocks are associated via spt_portfolio_stocks table, not directly here
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating portfolio in Supabase:", dbError.message);
      return { data: null, error: dbError.message };
    }

    // insert後、RLSなどにより結果が返らない場合も考慮
    if (!insertedData) {
      console.error(
        "Portfolio created, but no data returned from Supabase. Check RLS or insert logic."
      );
      return {
        data: null,
        error: "Failed to retrieve portfolio data after creation.",
      };
    }

    const dbResult = insertedData as SptPortfolioBaseDbRow;
    const portfolioResult: Portfolio = {
      id: String(dbResult.id),
      user_id: dbResult.user_id,
      name: dbResult.name,
      memo: dbResult.memo ?? "",
      displayOrder: dbResult.display_order,
      createdAt: dbResult.created_at,
      updatedAt: dbResult.updated_at,
      stocks: [], // New portfolio has no stocks initially
    };

    console.log(
      "createPortfolioAction successful for user:",
      userId,
      "name:",
      name
    );
    return { data: portfolioResult, error: null };
  } catch (err: unknown) {
    let message = "Failed to create portfolio";
    if (err instanceof Error) message = err.message;
    return { data: null, error: message };
  }
}

export async function updatePortfolioAction(params: {
  portfolioId: string;
  userId: string; // 念のためユーザーIDも受け取り、権限チェックの材料にする (RLSで対応が主)
  name?: string;
  memo?: string;
  displayOrder?: number;
}): Promise<{ data: Portfolio | null; error: string | null }> {
  const supabase = await createClient();
  const { portfolioId, userId, name, memo, displayOrder } = params;

  if (!portfolioId) {
    return { data: null, error: "Portfolio ID is required to update." };
  }
  if (!userId) {
    return { data: null, error: "User ID is required for authorization." };
  }

  // 更新するデータオブジェクトを構築
  const updateData: {
    name?: string;
    memo?: string;
    display_order?: number;
    updated_at?: string; // DB側で自動更新されるなら不要な場合もある
  } = {};

  if (name !== undefined) updateData.name = name;
  if (memo !== undefined) updateData.memo = memo;
  if (displayOrder !== undefined) updateData.display_order = displayOrder;

  // 更新するフィールドが何もない場合はエラー
  if (Object.keys(updateData).length === 0) {
    return { data: null, error: "No fields to update were provided." };
  }

  // updated_at を手動で設定する場合
  updateData.updated_at = new Date().toISOString();

  try {
    const { data: updatedData, error: dbError } = await supabase
      .from("spt_portfolios")
      .update(updateData)
      .eq("id", portfolioId)
      .eq("user_id", userId) // 念のため、操作対象のユーザーIDも確認
      .select("*, spt_portfolio_stocks(*)") // 更新後のデータを取得、stocksも含む
      .single();

    if (dbError) {
      console.error(
        `Error updating portfolio ${portfolioId} in Supabase:`,
        dbError.message
      );
      return { data: null, error: dbError.message };
    }

    if (!updatedData) {
      return {
        data: null,
        error: `Failed to find or update portfolio with ID ${portfolioId}. It might not exist or you may not have permission.`,
      };
    }

    const dbResult = updatedData as SptPortfolioWithStocksDbRow;
    const portfolioResult: Portfolio = {
      id: String(dbResult.id),
      user_id: dbResult.user_id,
      name: dbResult.name,
      memo: dbResult.memo ?? "",
      displayOrder: dbResult.display_order,
      createdAt: dbResult.created_at,
      updatedAt: dbResult.updated_at,
      stocks: dbResult.spt_portfolio_stocks || [],
    };

    console.log(
      `updatePortfolioAction successful for portfolio: ${portfolioId}`
    );
    return { data: portfolioResult, error: null };
  } catch (err: unknown) {
    let message = `Failed to update portfolio ${portfolioId}`;
    if (err instanceof Error) message = err.message;
    return {
      data: null,
      error: message,
    };
  }
}

export async function deletePortfolioAction(
  portfolioId: string,
  userId: string // 権限チェックのため
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  if (!portfolioId) {
    return { success: false, error: "Portfolio ID is required to delete." };
  }
  if (!userId) {
    return { success: false, error: "User ID is required for authorization." };
  }

  try {
    const { error: dbError } = await supabase
      .from("spt_portfolios")
      .delete()
      .eq("id", portfolioId)
      .eq("user_id", userId); // 自分のポートフォリオのみ削除可能

    if (dbError) {
      console.error(
        `Error deleting portfolio ${portfolioId} in Supabase:`,
        dbError.message
      );
      // エラー内容によって、ユーザーに表示するメッセージを調整することも検討
      // (例: 関連データが存在するため削除できませんでした等)
      return { success: false, error: dbError.message };
    }

    console.log(
      `deletePortfolioAction successful for portfolio: ${portfolioId}`
    );
    return { success: true, error: null };
  } catch (err: unknown) {
    let message = `Failed to delete portfolio ${portfolioId}`;
    if (err instanceof Error) message = err.message;
    return {
      success: false,
      error: message,
    };
  }
}

export async function updatePortfolioOrderAction(
  portfoliosToUpdate: Array<{ id: string; displayOrder: number }>,
  userId: string
): Promise<{ success: boolean; error: string | null; updatedCount?: number }> {
  const supabase = await createClient();

  if (!userId) {
    return { success: false, error: "User ID is required for authorization." };
  }

  if (!portfoliosToUpdate || portfoliosToUpdate.length === 0) {
    return { success: false, error: "No portfolios provided to update order." };
  }

  let updatedCount = 0;
  const errors: string[] = [];

  // 注意: このループは個別の更新を実行します。
  // 大量の更新やアトミックな操作が求められる場合は、
  // SupabaseのDB関数（RPC）内でトランザクションとして処理することを検討してください。
  for (const portfolio of portfoliosToUpdate) {
    if (!portfolio.id || typeof portfolio.displayOrder !== "number") {
      errors.push(
        `Invalid data for portfolio: id=${portfolio.id}, displayOrder=${portfolio.displayOrder}`
      );
      continue;
    }

    try {
      const { error: dbError, count } = await supabase
        .from("spt_portfolios")
        .update({
          display_order: portfolio.displayOrder,
          updated_at: new Date().toISOString(), // 表示順更新時もupdated_atを更新
        })
        .eq("id", portfolio.id)
        .eq("user_id", userId); // 自分のポートフォリオのみ更新可能

      if (dbError) {
        errors.push(
          `Error updating order for portfolio ${portfolio.id}: ${dbError.message}`
        );
      } else if (count !== null && count > 0) {
        updatedCount++;
      }
    } catch (err: unknown) {
      let message = `Unexpected error updating order for portfolio ${portfolio.id}`;
      if (err instanceof Error) {
        message = `${message}: ${err.message}`;
      }
      errors.push(message);
    }
  }

  if (errors.length > 0) {
    console.error("Errors during portfolio order update:", errors.join("; "));
    return {
      success: false,
      error: `Failed to update order for some portfolios: ${errors.join("; ")}`,
      updatedCount,
    };
  }

  console.log(
    `updatePortfolioOrderAction successful. Updated ${updatedCount} portfolios for user ${userId}.`
  );
  return { success: true, error: null, updatedCount };
}
