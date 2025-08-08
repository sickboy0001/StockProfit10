// app/api/cron-job/route.js

import { NextResponse } from "next/server";
import { sendEmailActionDirect } from "@/app/actions/send-email/action";

export async function POST(request: Request) {
  const data = await request.json();
  const { secret } = data;

  // 環境変数から認証シークレットキーを取得
  const API_AUTH_SECRET = process.env.API_AUTH_SECRET;

  // シークレットキーの検証
  if (!API_AUTH_SECRET || secret !== API_AUTH_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // ここに定期的に実行したい処理を記述します
    // 例:
    console.log("Cron job started at:", new Date().toISOString());
    // - データベースの更新
    // - 外部APIの呼び出し
    // - キャッシュのクリア
    // - データの集計処理

    // 処理が完了したら成功を返す
    const to = "syunjyu0001@gmail.com";
    const subject = "定期実行の確認メール";
    const nowJST = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    const message = `このメールは定期的に実行されるCronジョブからの確認メールです。\n日本時間: ${nowJST}`;
    await sendEmailActionDirect(to, subject, message);

    return NextResponse.json(
      { message: "Cron job executed successfully!" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
  }
}
