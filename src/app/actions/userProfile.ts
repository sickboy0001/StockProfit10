// app/actions/userProfile.ts
"use server";

import { createClient } from "@/util/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfileName(newName: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser(); // ユーザー取得時のエラーもハンドリング

  if (getUserError) {
    console.error(
      "Error fetching user in updateUserProfileName:",
      getUserError.message
    );
    return {
      error: "ユーザー情報の取得中にエラーが発生しました。",
      success: false,
    };
  }

  if (!user) {
    console.warn(
      "updateUserProfileName called but no authenticated user found."
    );
    return { error: "ユーザーが認証されていません。", success: false };
  }

  // 名前が空文字列でないことを確認（任意：必要に応じてバリデーションを追加）
  if (!newName || newName.trim() === "") {
    console.warn(
      `Attempted to update name with an empty string for user: ${user.id}`
    );
    return { error: "表示名は空にできません。", success: false };
  }

  const trimmedNewName = newName.trim();

  const { data, error: updateUserError } = await supabase.auth.updateUser({
    data: { name: trimmedNewName }, // user_metadata.name を更新。前後の空白は除去
  });

  if (updateUserError) {
    console.error(
      `Error updating user name for user ${user.id}:`,
      updateUserError.message,
      updateUserError
    );

    return {
      error: `表示名の更新に失敗しました。詳細はサーバーログを確認してください。`, // ユーザーには詳細なエラーメッセージを直接見せない方が良い場合もある

      success: false,
    };
  }

  // キャッシュを再検証してUIに即時反映させる
  revalidatePath("/"); // 現在のプロファイルページ
  // 他のページでもユーザー名を表示している場合は、それらのパスも追加
  //例: revalidatePath("/");
  console.log(
    `Successfully updated name to "${trimmedNewName}" for user ${user.id} and revalidated /user.`
  );

  return {
    success: true,
    data,
    message: "表示名が正常に更新されました。",
  };
}
