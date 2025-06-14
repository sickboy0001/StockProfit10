"use server";
// src/lib/api/jquantsAuth.ts

// 認証情報をキャッシュするための変数
// アクセストークンと有効期限（Unixタイムスタンプ、ミリ秒単位）を保持
let cachedAccessToken: {
  token: string;
  expiresAt: number;
} | null = null;

// 複数のリクエストが同時に発生した際に、アクセストークン更新処理が多重に走るのを防ぐためのPromise
let tokenRefreshPromise: Promise<string | null> | null = null;

// J-Quants APIの認証エンドポイント
const JQUANTS_AUTH_ENDPOINT = "https://api.jquants.com/v1/token/auth";

/**
 * J-Quants APIのアクセストークンを取得または更新する関数。
 * トークンが有効な場合はキャッシュから返し、期限切れの場合は新しいトークンを取得する。
 *
 * @returns 有効なアクセストークン文字列、または認証失敗の場合はnull。
 */
export async function getJQuantsAccessToken(): Promise<string | null> {
  // 環境変数からJ-Quantsのリフレッシュトークンを取得
  // Vercelにデプロイする際は、Vercelのプロジェクト設定で環境変数として設定してください。
  const JQUANTS_REFRESH_TOKEN = process.env.JQUANTS_REFRESH_TOKEN;

  // リフレッシュトークンが設定されていない場合はエラーとして処理
  if (!JQUANTS_REFRESH_TOKEN) {
    console.error(
      "Error: Environment variable JQUANTS_REFRESH_TOKEN is not set."
    );
    return null;
  }

  // 1. キャッシュされたアクセストークンの有効性チェック
  // 現在時刻から、バッファとして5秒後の時点でもトークンが有効かを確認。
  // これにより、トークンが期限切れ間近の場合に早めに更新を試みる。
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 5000) {
    console.log("Using cached J-Quants access token.");
    return cachedAccessToken.token;
  }

  // 2. トークンが有効期限切れ、または存在しない、あるいは現在更新中ではない場合
  // 複数リクエストが同時に来ても、リフレッシュ処理が一度だけ実行されるように制御
  if (!tokenRefreshPromise) {
    console.log(
      "[DEBUG JQuantsAuth] Attempting to fetch new token with JQUANTS_REFRESH_TOKEN:",
      JQUANTS_REFRESH_TOKEN?.substring(0, 10) + "..." // 安全のため一部のみ表示
    );
    console.log(
      "J-Quants access token expired or not available. Fetching new token..."
    );
    // 新しいトークン取得処理をPromiseとして保持
    tokenRefreshPromise = (async () => {
      try {
        const response = await fetch(JQUANTS_AUTH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: JQUANTS_REFRESH_TOKEN,
          }),
          // Next.jsのfetchでキャッシュを使わないようにする設定 (認証トークンは常に最新が必要)
          cache: "no-store",
        });

        // HTTPステータスコードが2xx系以外の場合（エラーの場合）
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `Failed to get J-Quants access token: ${response.status} ${response.statusText}`,
            `Details: ${errorBody}`
          );
          throw new Error(
            `J-Quants authentication failed: ${response.statusText}`
          );
        }

        const data = await response.json();
        // ★修正点1: 'accessToken' ではなく 'idToken' を使用
        const accessToken = data.idToken;
        // ★修正点2: 'accessTokenExpiresInSeconds' ではなく 'idTokenExpiresIn' を使用
        const expiresInSeconds = data.idTokenExpiresIn; // アクセストークンの有効期限（秒）

        if (!accessToken || typeof accessToken !== "string") {
          console.error(
            "Invalid access token format in J-Quants API response:",
            data
          );
          throw new Error(
            "Invalid access token format received from J-Quants API."
          );
        }

        // アクセストークンをキャッシュし、有効期限を記録
        // 現在時刻に有効期限（秒をミリ秒に変換）を加算し、さらにバッファ（例: 10秒）を引いて早めに更新を試みる
        cachedAccessToken = {
          token: accessToken,
          expiresAt: Date.now() + expiresInSeconds * 1000 - 10 * 1000,
        };
        console.log(
          `J-Quants access token obtained. Expires in approximately ${
            expiresInSeconds / 60
          } minutes.`
        );

        return accessToken;
      } catch (error) {
        console.error(
          "Error during J-Quants access token acquisition process:",
          error
        );
        // エラー時はキャッシュをクリアし、現在のプロミスもクリア
        cachedAccessToken = null;
        return null;
      } finally {
        // トークンリフレッシュが完了したら、プロミスをクリアし、次のリクエストが新たにリフレッシュを開始できるようにする
        // ただし、エラー時にもクリアすることで、無限ループを防ぐ
        tokenRefreshPromise = null;
      }
    })();
  }

  // 現在進行中のトークンリフレッシュプロミスを待機して結果を返す
  return tokenRefreshPromise;
}

// Next.jsのServer ActionやServer Componentで利用される場合、
// このファイル自体を 'use server' ディレクティブでマークする必要はありません。
// ただし、この関数を呼び出すServer ActionやAPI Routeが 'use server' でマークされている必要があります。
