// app/action/UserRole.ts
"use server"; // Server Actionであることを示す

import { User as AppUser } from "@/types/user"; // User型をAppUserとしてインポート
import { createClient } from "@/util/supabase/server";

// Supabaseクライアントの初期化
// Server Actionはサーバーサイドで実行されるため、安全に環境変数を利用できます。
// ただし、Next.jsのServer Actionでは、通常NEXT_PUBLIC_プレフィックスなしの環境変数も利用可能ですが、
// ここではフロントエンドと共有するためにNEXT_PUBLIC_を使用します。
// 実際のデプロイ時には、Vercelのプロジェクト設定でこれらの環境変数を設定してください。

// ユーザー情報と役割の型定義
export interface UserWithRoles {
  user_id: string;
  user_name: string | null;
  user_email: string;
  user_roles: string[]; // ロール名の配列
  is_active: boolean; // ユーザーの有効/無効ステータス
  registered_at: string; // 登録日時
  last_signed_in_at: string | null; // 最終ログイン日時
  total_count: number; // フィルタリング後の総ユーザー数 (ページネーション用)
}

// 役割の型定義
export interface Role {
  id: number;
  name: string;
  short_name: string;
  description: string | null;
}

// ユーザーデータ取得のパラメータ型定義
export interface GetUsersParams {
  userName?: string | null;
  email?: string | null;
  roleIds?: number[] | null;
  status?: boolean | null; // true: 有効, false: 無効
  limit: number;
  offset: number;
}

/**
 * ユーザー一覧と役割情報を取得するServer Action。
 * Supabaseのget_users_with_roles_and_status PostgreSQL関数を呼び出します。
 *
 * @param params ユーザー取得のためのフィルタリングとページネーションのパラメータ。
 * @returns ユーザーデータの配列、総ユーザー数、またはエラーメッセージ。
 */
export async function fetchUsersAction(params: GetUsersParams): Promise<{
  data: UserWithRoles[];
  totalCount: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "get_users_with_roles_and_status",
      {
        p_user_name: params.userName || null,
        p_email: params.email || null,
        p_role_ids: params.roleIds || null,
        p_status: params.status,
        p_limit: params.limit,
        p_offset: params.offset,
      }
    );

    if (error) {
      console.error(
        "RPC Error (get_users_with_roles_and_status):",
        error.message
      );
      return {
        data: [],
        totalCount: 0,
        error: "ユーザーリストの取得に失敗しました。",
      };
    }

    const users: UserWithRoles[] = data || [];
    // PostgreSQL関数から返されるtotal_countは、結果セットの各行に含まれるため、
    // 最初の要素から取得するか、データが空の場合は0とします。
    const totalCount = users.length > 0 ? users[0].total_count : 0;

    return { data: users, totalCount, error: null };
  } catch (err: unknown) {
    console.error("Server Action 'fetchUsersAction' で予期せぬエラー:", err);
    let errorMessage = "不明なエラー";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return {
      data: [],
      totalCount: 0,
      error: `サーバーエラー: ${errorMessage}`,
    };
  }
}

/**
 * 全ての役割情報を取得するServer Action。
 * Supabaseのget_all_roles PostgreSQL関数を呼び出します。
 *
 * @returns 役割データの配列、またはエラーメッセージ。
 */
export async function fetchAllRolesAction(): Promise<{
  data: Role[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // roles テーブルから全ての列を選択 (SELECT * FROM roles と同等)
    const { data, error } = await supabase.from("roles").select("*");

    if (error) {
      console.error("Error fetching roles from 'roles' table:", error.message);
      return { data: [], error: "役割リストの取得に失敗しました。" };
    }

    return { data: data as Role[], error: null };
  } catch (err: unknown) {
    console.error("Server Action 'fetchAllRolesAction' で予期せぬエラー:", err);
    let errorMessage = "不明なエラー";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return {
      data: [],
      error: `サーバーエラー: ${errorMessage}`,
    };
  }
}

/**
 * 全ての役割情報に加えて、固定の管理者ロール情報を追加して取得するServer Action。
 * "Administrator" (ADMIN) ロールをリストの先頭に追加します。
 *
 * @returns 役割データの配列（管理者ロール追加済み）、またはエラーメッセージ。
 */
export async function fetchAllRolesAddAdminAction(): Promise<{
  data: Role[];
  error: string | null;
}> {
  try {
    // まず既存のロールを取得
    const { data: existingRoles, error: fetchError } =
      await fetchAllRolesAction();

    if (fetchError) {
      // fetchAllRolesAction でエラーが発生した場合はそのまま返す
      return { data: [], error: fetchError };
    }

    // 追加する管理者ロール情報
    // IDは既存のロールと衝突しないように、またクライアント側で特別扱いできるように負の値を割り当てる例
    const adminRole: Role = {
      id: -1, // このIDはクライアント側でのみ意味を持つ一時的なもの
      name: "Administrator",
      short_name: "ADMIN",
      description: "システム全体の管理者権限を持ちます。",
    };

    // 既存のロールリストの先頭に管理者ロールを追加
    const rolesWithAdmin = [adminRole, ...existingRoles];

    return { data: rolesWithAdmin, error: null };
  } catch (err: unknown) {
    console.error(
      "Server Action 'fetchAllRolesAddAdminAction' で予期せぬエラー:",
      err
    );
    let errorMessage = "不明なエラー";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return {
      data: [],
      error: `サーバーエラー: ${errorMessage}`,
    };
  }
}
/**
 * ユーザーの役割を更新するServer Action。
 * 既存の役割を全て削除し、新しい役割を挿入します。
 *
 * @param userId 更新対象のユーザーID。
 * @param roleIds 設定する役割IDの配列。
 * @returns 成功/失敗を示すオブジェクト。
 */
export async function updateUserRolesAction(
  userId: string,
  roleIds: number[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    // 1. 既存のユーザー役割を削除
    // user_roles テーブルから指定された user_id に紐づくレコードを全て削除します。
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error(
        `Error deleting existing roles for user ${userId}:`,
        deleteError.message
      );
      return {
        success: false,
        error: "ユーザー役割の更新準備（既存役割の削除）に失敗しました。",
      };
    }

    // 2. 新しい役割を挿入 (roleIdsが空配列やnullでない場合)
    // roleIds が提供されている場合のみ、新しい役割を挿入します。
    // roleIds が空の場合は、ユーザーの役割は全て削除された状態になります。
    if (roleIds && roleIds.length > 0) {
      const newRolesToInsert = roleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
      }));

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(newRolesToInsert);

      if (insertError) {
        console.error(
          `Error inserting new roles for user ${userId}:`,
          insertError.message
        );
        // 注意: この時点で一部の役割が削除されたままになる可能性があります。
        // 本番環境では、このような複数ステップの操作はデータベースのトランザクション内で実行することが推奨されます。
        // SupabaseのJSクライアントで直接トランザクションを制御するのは複雑なため、
        // 必要であればデータベース関数（RPC）側でトランザクションを管理する方が堅牢です。
        return {
          success: false,
          error: "新しいユーザー役割の設定に失敗しました。",
        };
      }
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error(
      "Server Action 'updateUserRolesAction' で予期せぬエラー:",
      err
    );
    let errorMessage = "不明なエラー";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return {
      success: false,
      error: `サーバーエラー: ${errorMessage}`,
    };
  }
}

/// 遅いようなら、専用のDB関数を作る
export async function getUserByEmail(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_users_with_roles_and_status",
    {
      p_email: email,
      p_limit: 1,
      p_offset: 0,
    }
  );

  if (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }

  // 取得したデータは配列なので、最初の要素を返す
  return data && data.length > 0 ? data[0] : null;
}

/**
 * メールアドレスでユーザー情報を取得し、スーパーユーザーであれば"Administrator"ロールを追加するServer Action。
 *
 * @param authUser AuthContextから取得するようなユーザーオブジェクト。emailとisSuperUserプロパティを持つことを期待。
 * @returns 加工後のUserWithRolesオブジェクト、またはnull。
 */
export async function getUserByEmailAddRoleAdmin(
  authUser: AppUser | null // 型をAppUserに変更
): Promise<UserWithRoles | null> {
  if (!authUser || !authUser.email) {
    console.error(
      "[getUserByEmailAddRoleAdmin] Invalid authUser or email is missing."
    );
    return null;
  }

  try {
    const userDetail = await getUserByEmail(authUser.email);

    if (userDetail && authUser.isSuperUser) {
      // user_roles が配列でなければ初期化
      if (!Array.isArray(userDetail.user_roles)) {
        userDetail.user_roles = [];
      }
      // "Administrator" がまだ含まれていなければ追加
      if (!userDetail.user_roles.includes("Administrator")) {
        userDetail.user_roles.push("Administrator");
      }
    }
    return userDetail;
  } catch (error) {
    console.error(
      "[getUserByEmailAddRoleAdmin] Error processing user details:",
      error
    );
    return null;
  }
}
