"use server";
import { insertAppLog } from "@/app/actions/Applog/Action";

/**
 * ログ記録用の共通関数
 * @param level ログレベル
 * @param source ログ発生元
 * @param message メッセージ
 * @param context 任意の追加情報
 * @param userId ユーザーID（任意）
 * @param path パス（任意）
 */
export async function logAction(
  level: "info" | "warn" | "error",
  source: string,
  message: string,
  context?: unknown,
  userId?: string,
  path?: string
) {
  console.log(`logaction called [${level}] [${source}] ${message}`);
  await insertAppLog({
    level,
    message,
    context,
    user_id: userId,
    source,
    path,
  });
  console.log(`logaction end`);
}
