// getRefreshToken.js

// J-Quants APIのメールアドレスとパスワードを設定
// ★★★ ここをあなたのJ-Quantsのメールアドレスとパスワードに置き換えてください ★★★
const JQUANTS_EMAIL = "syunjyu0001@gmail.com";
const JQUANTS_PASSWORD = "ｘｘｘｘ";

// getJQuantsRefreshToken関数を定義 (jquantsAuthUser.tsからコピー)
// 実際にはモジュールとしてインポートしますが、単体実行のためにここに記述します
async function getJQuantsRefreshToken(mailaddress: string, password: string) {
  const JQUANTS_USER_AUTH_ENDPOINT =
    "https://api.jquants.com/v1/token/auth_user";

  if (!mailaddress || !password) {
    console.error(
      "Error: Mailaddress and password are required to get J-Quants RefreshToken."
    );
    return null;
  }

  try {
    console.log("Attempting to get J-Quants RefreshToken...");
    const response = await fetch(JQUANTS_USER_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailaddress: mailaddress,
        password: password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      let errorBodyText = "Unknown error structure";
      try {
        // Attempt to parse as JSON first, as some errors might be structured
        const errorJson = await response.json();
        errorBodyText = JSON.stringify(errorJson);
      } catch (e) {
        // If JSON parsing fails, read as text
        errorBodyText = await response.text();
      }
      console.error(
        `Failed to get J-Quants RefreshToken: ${response.status} ${response.statusText}`,
        `Response Body: ${errorBodyText}`
      );
    }

    const data = await response.json();

    if (
      !data.refreshToken ||
      typeof data.refreshToken !== "string" ||
      (data.idToken && typeof data.idToken !== "string") // idTokenが存在する場合はstring型かチェック
      // !data.idToken のチェックを削除し、idToken がなくてもエラーにしない
    ) {
      console.error(
        "Invalid token response from J-Quants API (missing refreshToken or idToken):",
        data
      );
      throw new Error(
        "Invalid token response format from J-Quants user auth API."
      );
    }

    console.log(
      `J-Quants RefreshToken obtained. RefreshToken expires in ${
        data.refreshTokenExpiresIn / (60 * 60 * 24)
      } days.`
    );

    return {
      refreshToken: data.refreshToken,
      idToken: data.idToken || null, // idToken がなければ null を設定
      refreshTokenExpiresIn: data.refreshTokenExpiresIn,
      idTokenExpiresIn: data.idTokenExpiresIn || null, // idTokenExpiresIn がなければ null を設定
    };
  } catch (error) {
    console.error("Error during J-Quants RefreshToken acquisition:", error);
    return null;
  }
}

// スクリプトの実行部分
async function run() {
  const tokens = await getJQuantsRefreshToken(JQUANTS_EMAIL, JQUANTS_PASSWORD);

  if (tokens) {
    console.log("\n--- J-Quants Tokens ---");
    console.log("Refresh Token:", tokens.refreshToken);
    if (tokens.idToken) {
      // idToken があれば表示
      console.log("ID Token:", tokens.idToken);
    }
    console.log("-----------------------");
    console.log(
      "\n↑↑↑ この Refresh Token を Vercel の環境変数 'JQUANTS_REFRESH_TOKEN' に設定してください ↑↑↑"
    );
  } else {
    console.error("Failed to obtain J-Quants tokens.");
  }
}

// 非同期関数を実行
run();
