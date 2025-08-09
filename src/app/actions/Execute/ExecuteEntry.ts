"use server";

// import { createClient } from "@/util/supabase/server";
import { sendEmailActionDirect } from "../send-email/action";
import { logAction } from "@/lib/applog";

interface EntryResult {
  success: boolean;
  error?: string;
  result?: string;
}

/**
 * すべての実行設定を取得します。
 * (注: 実行結果（利益率など）はこの関数では取得しません)
 * @returns 実行設定の配列
 * @throws エラーが発生した場合
 */
export async function executeEntry(): Promise<EntryResult> {
  // const supabase = await createClient();

  const context = {
    action: "executeEntry",
  };
  logAction("info", "executeEntry", `called CronJob`, context);

  // 処理が完了したら成功を返す
  const to = "syunjyu0001@gmail.com";
  const subject = "定期実行の確認メール";
  const nowJST = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const message = `このメールは定期的に実行されるCronジョブからの確認メールです。\n日本時間: ${nowJST}`;
  await sendEmailActionDirect(to, subject, message);

  // ここで必要な処理を実装（例: データ取得など）
  // 今はダミーで成功のみ返す
  return {
    success: true,
    result: "executeEntry completed",
  };
}
