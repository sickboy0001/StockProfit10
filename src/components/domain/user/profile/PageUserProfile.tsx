"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/util/supabase/client"; // クライアント用Supabase
import { useRouter } from "next/navigation";
import { showCustomToast } from "@/components/organisms/CustomToast"; // ★ SigninDialogから流用
import { updateUserProfileName } from "@/app/actions/userProfile";

const PageUserProfile = () => {
  const [userName, setUserName] = useState("");
  const [initialName, setInitialName] = useState(""); // 変更があったかどうかの比較用
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      setIsFetchingInitialData(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      // console.log("PageUserProfile user", user);
      if (error || !user) {
        showCustomToast({
          message: "エラー",
          submessage:
            "ユーザー情報の取得に失敗しました。ログインしてください。",
          type: "error",
        });
        router.push("/"); // またはログインページへ
        return;
      }

      const currentName = user.user_metadata?.name || "";
      // console.log("PageUserProfile currentName", currentName);
      setUserName(currentName);
      setInitialName(currentName);
      setIsFetchingInitialData(false);
    };

    fetchUser();
  }, [supabase, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (userName === initialName) {
      showCustomToast({
        message: "情報",
        submessage: "表示名に変更はありません。",
      });
      setIsLoading(false);
      return;
    }

    const result = await updateUserProfileName(userName);
    setIsLoading(false);

    if (result.success) {
      showCustomToast({
        message: "成功",
        submessage: result.message || "表示名が更新されました。",
        type: "success",
      });
      setInitialName(userName); // 更新後の名前を初期値として設定
      // router.refresh(); // revalidatePathがあるので通常は不要
      router.push("/"); // ★ 更新成功後、トップページへ遷移
    } else {
      showCustomToast({
        message: "エラー",
        submessage: result.error || "表示名の更新に失敗しました。",
        type: "error",
      });
      // エラー発生時は元の名前に戻すか、ユーザーに再入力を促す
      // setName(initialName); // 必要に応じて
    }
  };

  if (isFetchingInitialData) {
    return (
      <div className="container mx-auto p-4">ユーザー情報を読み込み中...</div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-semibold mb-6">プロフィール編集</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">表示名</Label>
          <Input
            id="name"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isLoading}
            placeholder="例: 山田太郎"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || userName === initialName}
          className="w-full"
        >
          {isLoading ? "更新中..." : "保存する"}
        </Button>
      </form>
    </div>
  );
};

export default PageUserProfile;
