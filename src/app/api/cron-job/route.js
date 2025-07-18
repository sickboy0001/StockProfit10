// app/api/cron-job/route.js

import { NextResponse } from 'next/server';

export async function POST(request) {
  const data = await request.json();
  const { secret } = data;

  // 環境変数から認証シークレットキーを取得
  const API_AUTH_SECRET = process.env.API_AUTH_SECRET;

  // シークレットキーの検証
  if (!API_AUTH_SECRET || secret !== API_AUTH_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ここに定期的に実行したい処理を記述します
    // 例:
    console.log('Cron job started at:', new Date().toISOString());
    // - データベースの更新
    // - 外部APIの呼び出し
    // - キャッシュのクリア
    // - データの集計処理

    // 処理が完了したら成功を返す
    return NextResponse.json({ message: 'Cron job executed successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Error during cron job:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}