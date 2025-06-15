// c:\work\dev\spa\stockprofit10-app\src\app\update-password\page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/util/supabase/client";
import { showCustomToast } from "@/components/organisms/CustomToast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null); // 成功メッセージ用
  const [error, setError] = useState<string | null>(null); // エラーメッセージ用
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // このページはパスワード回復フローの一部としてアクセスされることを想定
    // SupabaseはURLのフラグメントからセッションを回復しようとします
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          // ユーザーがリセットリンクから来て、セッションが回復された
          showCustomToast({
            message: "情報",
            submessage: "新しいパスワードを設定してください。",
            type: "success", // or "info"
          });
        } else if (event === "USER_UPDATED" && message) {
          // messageがあるのは更新成功後
          // パスワードが正常に更新された後
          showCustomToast({
            message: "成功",
            submessage:
              "パスワードが正常に更新されました。ログインしてください。",
            type: "success",
          });
          router.push("/"); // ログインページまたはホームページへ
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router, message]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      const errMsg = "パスワードが一致しません。";
      setError(errMsg);
      showCustomToast({ message: "エラー", submessage: errMsg, type: "error" });
      return;
    }
    // Supabaseのデフォルト最小長は6文字ですが、プロジェクトの設定に合わせる
    if (password.length < 6) {
      const errMsg = "パスワードは6文字以上である必要があります。";
      setError(errMsg);
      showCustomToast({ message: "エラー", submessage: errMsg, type: "error" });
      return;
    }

    setIsLoading(true);

    // ユーザーは既にパスワードリセットフローで認証されているはず
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (updateError) {
      const errMsg = `パスワードの更新に失敗しました: ${updateError.message}`;
      setError(errMsg);
      showCustomToast({ message: "エラー", submessage: errMsg, type: "error" });
    } else {
      setMessage("パスワードが正常に更新されました。"); // このメッセージをトリガーにuseEffectでリダイレクト
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            新しいパスワードを設定
          </h2>
        </div>
        {error && (
          <p className="my-2 text-center text-sm text-red-600">{error}</p>
        )}
        {/* {message && <p className="my-2 text-center text-sm text-green-600">{message}</p>} */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div className="mb-4">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="新しいパスワード"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="新しいパスワード（確認）"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative mt-6 flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? "更新中..." : "パスワードを更新"}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-sm text-center">
          <Link
            href="/"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
