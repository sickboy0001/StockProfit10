# app_logs
システム全般のログをもつ。
ユーザー限定でなく、全体のログを想定
ログ参照画面で状況は確認できること。

| カラム名        | データ型      | 必須 | 説明                                                 |
| ----------- | --------- | -- | -------------------------------------------------- |
| id          | uuid      | ○  | ログの一意識別子。自動生成（`gen_random_uuid()`）される。             |
| timestamp   | timestamp | ○  | ログの発生日時。デフォルトで現在時刻（`now()`）が入る。                    |
| level       | text      | ○  | ログレベル。`info`, `error`, `warn`, `debug` のいずれか。      |
| message     | text      | ○  | ログの主メッセージ内容。                                       |
| context     | jsonb     | ×  | 任意の追加情報。JSON形式で柔軟に詳細データを格納可能。                      |
| user_id    | uuid      | ×  | ログに関連するユーザーのID（存在すれば）。                             |
| source      | text      | ×  | ログ発生元の名称（例: `frontend`, `api`, `server-function`）。 |
| request_id | text      | ×  | 同一リクエストを識別するID。複数ログの紐付けに利用可能。                      |
| ip_address | inet      | ×  | クライアントのIPアドレス。PostgreSQLの`inet`型で保存。               |
| user_agent | text      | ×  | ブラウザやクライアント端末のユーザーエージェント情報。                        |
| path        | text      | ×  | ログが発生したAPIやページのパスまたはURL。                           |




## ddl
```
create table public.app_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamp not null default now(),
  level text not null check (level in ('info', 'error', 'warn', 'debug')),
  message text not null,
  context jsonb,
  user_id uuid,
  source text,
  request_id text,
  ip_address inet,           -- IPアドレス保存用（PostgreSQLのinet型）
  user_agent text,          -- ブラウザなどの端末情報
  path text                 -- APIやページのパス・URL保存用
);

```


---

## ① Server FunctionsからSupabaseにログを挿入する際の留意点

* **環境変数は必ずサーバー専用（`process.env.SUPABASE_SERVICE_ROLE_KEY`など）を使う**
* クライアントにはSupabaseのService Roleキーを渡さない（秘匿）
* Server Functionは基本的にサーバー側で実行されるため、API Routesよりもシンプルに使える
* **IPアドレスなどクライアント情報は取得しにくいので、必要ならクライアントから引き渡す設計が必要**

---

## ② ログ挿入のヘルパー関数（Server Function用）

```ts
// lib/supabaseServerClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);
```

```ts
// lib/logHelperServer.ts
import { supabaseServer } from './supabaseServerClient';

export async function insertAppLogServer({
  level,
  message,
  context = {},
  user_id,
  source = 'server-function',
  request_id,
  ip_address,
  user_agent,
  path,
}: {
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  context?: Record<string, any>;
  user_id?: string;
  source?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
  path?: string;
}) {
  const { error } = await supabaseServer.from('app_logs').insert([
    {
      level,
      message,
      context,
      user_id,
      source,
      request_id,
      ip_address,
      user_agent,
      path,
    },
  ]);
  if (error) {
    console.error('Failed to insert app_log:', error);
  }
}
```

---

## ③ Server Function 内での利用例（例: Next.js App Router の `app/api/log/route.ts`）

```ts
import { NextResponse } from 'next/server';
import { insertAppLogServer } from '@/lib/logHelperServer';

export async function POST(request: Request) {
  const body = await request.json();

  await insertAppLogServer({
    level: body.level,
    message: body.message,
    context: body.context,
    user_id: body.user_id,
    source: 'server-function',
    request_id: body.request_id,
    ip_address: body.ip_address,
    user_agent: body.user_agent,
    path: body.path,
  });

  return NextResponse.json({ success: true });
}
```
