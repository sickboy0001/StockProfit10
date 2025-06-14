// src/app/providers.tsx または同様のクライアントコンポーネントファイル
"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// オプション: React Query Devtools を使用する場合
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// クライアントを作成します。
// クライアントインスタンスをコンポーネントの外で作成するのが良い方法です。
// これにより、レンダリングのたびに再作成されるのを防ぎます。
// ただし、Next.js App Router のクライアントコンポーネントの場合、
// クライアントでユーザーセッションまたはリクエストごとに一度作成されるようにしたい場合があります。
// 簡単な方法は、useState を使用してクライアントで一度だけ作成されるようにすることです。
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ここですべてのクエリのデフォルトオプションを設定できます
        // staleTime: 60 * 1000, // 1分
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // サーバー: 常に新しいクエリクライアントを作成
    return makeQueryClient();
  } else {
    // ブラウザ: まだ持っていない場合は新しいクエリクライアントを作成
    // これは非常に重要です。Reactが初期レンダリング中に
    // サスペンドした場合に新しいクライアントを再作成しないようにするためです。
    // クエリクライアントの作成の下にサスペンスバウンダリがある場合は、
    // これが必要ない場合があります。
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // 注: このプロバイダーの下にサスペンスバウンダリを使用している場合は、
  // クエリクライアントを初期化する際に useState を避けてください。
  // そうでない場合、このパターンで問題ありません。
  const [queryClient] = React.useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* オプション: デバッグ用に React Query Devtools を追加 */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
