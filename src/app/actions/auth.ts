"use server";

import { createClient } from "@/util/supabase/server"; // サーバー用クライアントのパスを確認してください
import { headers } from "next/headers";

export async function signIn(username: string, password: string) {
  const supabase = await createClient(); // ★ server.ts の createClient を使う
  const { error } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    // エラーハンドリング: エラーメッセージを返すか、リダイレクトするなど
    return { error: "ログインに失敗しました。" }; // 例: エラーオブジェクトを返す
  }

  return { success: true }; // 成功を示すオブジェクトを返す
}

export async function signOut() {
  // const cookieStore = cookies();
  // const supabase = createServerActionClient<Database>({
  //   cookies: () => cookieStore,
  // }); // ★ 同様に cookies を渡す
  const supabase = await createClient(); // ★ 同様に server.ts の createClient を使う
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
  }
  // signOut 後は router.refresh() などでクライアントを更新する必要がある
}

interface SignUpOptions {
  emailRedirectTo?: string;
  data?: Record<string, unknown>;
  captchaToken?: string;
}

export async function signUpAction({
  email,
  password,
  options,
}: {
  email: string;
  password: string;
  options?: SignUpOptions;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options?.emailRedirectTo, // 確認メール内のリンク先URL
      data: options?.data, // ユーザーメタデータ (例: { name: "ユーザー表示名" })
    },
  });

  if (error) {
    console.error("Sign up error:", error.message);
    return { error: error.message, success: false };
  }

  // メール認証が有効な場合、data.user は存在するが session は null になることが多い
  // data.user が存在すれば、ユーザー作成自体は試みられたと考えられる
  if (data.user) {
    // メール認証が必要な場合、ここで特別な処理は不要。
    // Supabaseが自動で確認メールを送信する（設定による）
    return { success: true, data, error: null };
  }

  // 通常は user か error のどちらかがあるはずだが、念のため
  return { error: "不明なサインアップエラーが発生しました。", success: false };
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = await createClient();
  // const origin = headers().get("origin"); // リクエストのオリジンを取得
  const origin = (await headers()).get("origin"); // リクエストのオリジンを取得

  if (!origin) {
    // オリジンが取得できない場合のエラーハンドリング
    console.error("Origin not found in headers for password reset.");
    return {
      error: "リクエストの処理中にエラーが発生しました。",
      success: false,
    };
  }

  // パスワードリセット後のリダイレクト先を指定
  // このURLはSupabaseの許可リストに登録する必要があります
  const redirectTo = `${origin}/user/update-password`; // 例: /update-password ページ

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Error sending password reset email:", error.message);
    // ユーザーには具体的なエラーメッセージを隠蔽することも検討
    return {
      error: "パスワードリセットメールの送信に失敗しました。",
      success: false,
    };
  }

  return {
    success: true,
    message:
      "パスワードリセットメールを送信しました。メールボックスをご確認ください。",
  };
}
