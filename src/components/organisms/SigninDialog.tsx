// src/components/organisms/SigninDialog.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { useRouter } from "next/navigation";
import { signUpAction } from "@/app/actions/auth"; // ★ サインアップ用サーバーアクションをインポート（別途作成想定）
import { showCustomToast } from "./CustomToast";

interface SigninDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void; // ★ ログインダイアログ表示切り替え用のコールバックを追加
}

export function SigninDialog({
  open,
  onOpenChange,
  onSwitchToLogin,
}: SigninDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // 表示名（ユーザー名）
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // const router = useRouter();

  const handleSignup = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // ★ サインアップ用サーバーアクションを呼び出し
    // options.data に name を含めることで、DBトリガーで spt_user.name に設定されることを想定
    const result = await signUpAction({
      email,
      password,
      options: { data: { name: name } },
    });

    setIsLoading(false);

    if (result?.error) {
      setErrorMessage(result.error);
      showCustomToast({
        message: "サインアップエラー",
        submessage: result.error,
        type: "error",
      });
    } else if (result?.success && result.data?.user) {
      // サインアップ成功時 (メール認証が必要な場合はその旨を伝える)
      onOpenChange(false); // ダイアログを閉じる
      showCustomToast({
        message: "サインアップ成功",
        submessage:
          "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
        type: "success",
      });
      // router.refresh(); // 必要に応じて
      // 通常、サインアップ後はメール確認を促し、自動ログインはしないか、
      // メール確認後にログインページへ誘導することが多いです。
    } else {
      // 予期せぬ応答
      setErrorMessage("サインアップ中に不明なエラーが発生しました。");
      showCustomToast({
        message: "サインアップエラー",
        submessage: "サインアップ中に不明なエラーが発生しました。",
        type: "error",
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !isLoading) {
      handleSignup();
    }
  };

  const handleSwitchDialog = () => {
    onOpenChange(false); // 現在のサインインダイアログを閉じる
    onSwitchToLogin(); // ログインダイアログを開く処理を呼び出す
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>サインアップ</DialogTitle>
          <DialogDescription>
            新しいアカウントを作成します。情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <p className="text-sm text-red-500 px-6 py-2 bg-red-50 border border-red-200 rounded-md">
            {errorMessage}
          </p>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-signup" className="text-right">
              表示名
            </Label>
            <Input
              id="name-signup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
              placeholder="例: 山田太郎"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email-signup" className="text-right">
              メールアドレス
            </Label>
            <Input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
              placeholder="email@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password-signup" className="text-right">
              パスワード
            </Label>
            <Input
              id="password-signup"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="半角英数8文字以上"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between items-center">
          <Button
            variant="link"
            className="text-sm text-blue-600 hover:underline p-0 h-auto justify-start"
            onClick={handleSwitchDialog}
            disabled={isLoading}
          >
            すでにアカウントをお持ちですか？ ログイン
          </Button>
          <Button type="button" onClick={handleSignup} disabled={isLoading}>
            {isLoading ? "処理中..." : "サインアップ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
