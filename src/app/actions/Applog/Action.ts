"use server";

import { createClient } from "@/util/supabase/server";

export interface AppLogProps {
  level: "info" | "error" | "warn" | "debug";
  message: string;
  context?: Record<string, unknown>;
  user_id?: string;
  source?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
  path?: string;
}

export interface AppLogResult {
  success: boolean;
  error: string | null;
}

export async function insertAppLog(props: AppLogProps): Promise<AppLogResult> {
  const { context = {}, source = "server-function", ...rest } = props;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("app_logs").insert([
      {
        context,
        source,
        ...rest,
      },
    ]);

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
