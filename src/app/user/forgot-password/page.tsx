// c:\work\dev\spa\stockprofit10-app\src\app\forgot-password\page.tsx
"use client";

import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordResetEmail } from "@/app/actions/auth"; // 作成したアクション
import { showCustomToast } from "@/components/organisms/CustomToast";
import Link from "next/link";
// import { useRouter } from "next/navigation"; // useRouter をインポート

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter(); // router を初期化

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const result = await sendPasswordResetEmail(email);
    setIsLoading(false);

    if (result.success) {
      showCustomToast({
        message: "送信完了",
        submessage:
          result.message || "パスワードリセットメールを送信しました。",
        type: "success",
      });
      setEmail(""); // フォームをクリア
      // 任意: ログインページやトップページにリダイレクト
      // router.push("/");
    } else {
      showCustomToast({
        message: "送信エラー",
        submessage: result.error || "メールの送信に失敗しました。",
        type: "error",
      });
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            パスワードをお忘れですか？
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <Label htmlFor="email-address" className="sr-only">
                メールアドレス
              </Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="メールアドレス"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? "送信中..." : "パスワードリセットメールを送信"}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center">
          <Link
            href="/"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
