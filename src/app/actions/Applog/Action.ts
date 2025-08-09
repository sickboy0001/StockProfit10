"use server";

import { AppLog } from "@/types/db/applog";
import { createClient } from "@/util/supabase/server";
import { headers } from "next/headers";
export interface AppLogProps {
  level: "info" | "error" | "warn" | "debug";
  message: string;
  context?: Record<string, unknown> | unknown;
  user_id?: string;
  source?: string;
  path?: string;
}

export interface AppLogResult {
  success: boolean;
  error: string | null;
}

export async function insertAppLog(props: AppLogProps): Promise<AppLogResult> {
  console.log("insertAppLog called");
  let ip_address: string | undefined = undefined;
  let user_agent: string | undefined = undefined;
  let request_id: string | undefined = undefined;
  try {
    const headersList = await headers();
    ip_address =
      headersList.get("x-forwarded-for") ??
      headersList.get("x-real-ip") ??
      undefined;
    user_agent = headersList.get("user-agent") ?? undefined;
    request_id = headersList.get("x-vercel-id") ?? undefined;
  } catch (e) {
    // headers()が失敗した場合はundefinedのまま進める
    console.warn("headers() failed or not available in this context.", e);
  }
  // ヘッダーからの値を取得し、必要に応じてデフォルト値を設定
  const { context = {}, source = "server-function", ...clientProps } = props;

  if (!props.level) {
    //throw new Error("level is required")
    console.error("level is required:", props.level);
  }

  try {
    const supabase = await createClient();
    const logToInsert = {
      ...clientProps,
      level: props.level ?? "info", // スプレッドの後ろで必ずlevelを上書き
      context,
      source,
      ip_address: ip_address ?? undefined,
      user_agent: user_agent ?? undefined,
      request_id: request_id ?? undefined,
    };

    console.log(logToInsert);

    const { error } = await supabase.from("app_logs").insert([logToInsert]);

    if (error) {
      console.error("Failed to insert app_log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred.";
    console.error("Unexpected error in insertAppLog:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

interface GetAppLogsParams {
  startDate?: string | null;
  endDate?: string | null;
  level?: string | null;
  searchText?: string | null;
}

export const getAppLogsAction = async ({
  startDate,
  endDate,
  level,
  searchText,
}: GetAppLogsParams): Promise<AppLog[] | { error: string }> => {
  try {
    const supabase = await createClient();
    let query = supabase.from("app_logs").select("*");

    // 日付フィルタ
    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      // 終了日はその日の終わりまでを含むように調整
      const endOfDay = new Date(endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query = query.lt("timestamp", endOfDay.toISOString());
    }

    // レベルフィルタ
    if (level && level !== "all") {
      query = query.eq("level", level);
    }

    // 検索フィルタ（メッセージとコンテキストを対象に）
    if (searchText) {
      // データベースの検索機能（例: `ilike`）を使用
      // 複数の列を対象に検索する場合、PostgreSQLの全文検索機能などを利用するとより効率的です
      query = query.or(
        `message.ilike.%${searchText}%,context::text.ilike.%${searchText}%`
      );
    }

    query = query.order("timestamp", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error);
      return { error: error.message };
    }

    return data as AppLog[];
  } catch (err) {
    console.error("Server action error:", err);
    return { error: "An unexpected error occurred." };
  }
};
