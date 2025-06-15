// app/admin/users/page.tsx
"use client"; // クライアントコンポーネントであることを宣言

import React, { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import "react-toastify/dist/ReactToastify.css"; // ToastifyのCSSをインポート

// Server Actionsのインポート
import {
  fetchUsersAction,
  fetchAllRolesAction,
  updateUserRolesAction,
  UserWithRoles,
  Role,
  GetUsersParams,
} from "@/app/actions/UserRole"; // パスを適切に設定してください
import UserTableFilter from "./UserTableFIlter";
import UserTable from "./UserTable";
import ModalUserRoleEdit from "./ModalUserRoleEdit";
import { Skeleton } from "@/components/ui/skeleton";
import { showCustomToast } from "@/components/organisms/CustomToast";

const ITEMS_PER_PAGE = 10; // 1ページあたりの表示件数

// スケルトンヘッダーの定義 (UserTable.tsx のカラム構成を参考)
const SKELETON_TABLE_HEADERS = [
  {
    key: "userId",
    label: "User ID",
    skeletonWidth: "w-24",
    thClassName: "px-6 py-3 text-left",
  },
  {
    key: "username",
    label: "Username",
    skeletonWidth: "w-32",
    thClassName: "px-6 py-3 text-left",
  },
  {
    key: "email",
    label: "Email",
    skeletonWidth: "w-48",
    thClassName: "px-6 py-3 text-left",
  },
  // 役割カラムはスケルトンでは固定数で表示
  {
    key: "role1",
    label: "Role 1",
    skeletonWidth: "w-10",
    thClassName: "px-2 py-3 text-center",
  },
  {
    key: "role2",
    label: "Role 2",
    skeletonWidth: "w-10",
    thClassName: "px-2 py-3 text-center",
  },
  {
    key: "status",
    label: "Status",
    skeletonWidth: "w-16",
    thClassName: "px-6 py-3 text-left",
  },
  {
    key: "registeredAt",
    label: "Registered At",
    skeletonWidth: "w-28",
    thClassName: "px-6 py-3 text-left",
  },
  {
    key: "lastSignedIn",
    label: "Last Signed In",
    skeletonWidth: "w-28",
    thClassName: "px-6 py-3 text-left",
  },
  {
    key: "actions",
    label: "Actions",
    skeletonWidth: "w-20",
    thClassName: "px-6 py-3 text-left",
  }, // UserTableではtext-rightだがスケルトンではleftでも可
];

export default function AdminUserList() {
  // const router = useRouter(); // ルーティングフック

  // 状態管理
  const [users, setUsers] = useState<UserWithRoles[]>([]); // ユーザーリスト
  const [allRoles, setAllRoles] = useState<Role[]>([]); // 全ての役割リスト（フィルターやモーダルで使用）
  const [loading, setLoading] = useState(true); // データ読み込み中フラグ
  const [error, setError] = useState<string | null>(null); // エラーメッセージ
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ
  // const [totalUsers, setTotalUsers] = useState(0); // フィルタリング後の総ユーザー数
  // const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE); // 総ページ数

  // フィルターの状態
  const [filters, setFilters] = useState<
    Omit<GetUsersParams, "limit" | "offset">
  >({
    userName: null,
    email: null,
    roleIds: null, // 選択された役割IDの配列
    status: null, // true: 有効, false: 無効
  });

  // モーダル関連の状態
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダルの開閉状態
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null); // 編集対象のユーザー
  const [userRolesSaving, setUserRolesSaving] = useState(false); // 役割保存中のローディング状態

  // ユーザーデータと役割データをフェッチする共通関数
  const fetchUserData = useCallback(async () => {
    setLoading(true); // ロード開始
    setError(null); // エラーをリセット

    try {
      // ページネーションのオフセットを計算
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      // ユーザー一覧と総数を取得するServer Actionを呼び出す
      const {
        data: usersData,
        // totalCount: _totalcount,
        error: usersError,
      } = await fetchUsersAction({
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset: offset,
      });

      if (usersError) throw new Error(usersError); // エラーがあればスロー

      setUsers(usersData); // ユーザーリストをセット
      // setTotalUsers(totalCount); // 総ユーザー数をセット

      // 全ての役割リストを一度取得 (通常はアプリケーションのライフサイクルで一度で良い)
      // フィルターやモーダルで使うため、常に取得しておく
      const { data: rolesData, error: rolesError } =
        await fetchAllRolesAction();
      if (rolesError)
        console.error("役割データの取得に失敗しました:", rolesError); // ロール取得エラーはコンソールに出力
      setAllRoles(rolesData || []); // 役割リストをセット
    } catch (err: unknown) {
      const errorMessage =
        "ユーザーリストの取得中にエラーが発生しました。時間をおいて再度お試しください。";
      if (err instanceof Error) {
        console.error("ユーザーリストの取得エラー:", err.message);
        // 必要であれば、err.message を errorMessage に含めることも検討
      } else {
        console.error("ユーザーリストの取得エラー (不明な型):", err);
      }
      setError(errorMessage);
      showCustomToast({
        message: "取得エラー",
        submessage: errorMessage, // エラーメッセージを統一
        type: "error",
      });
    } finally {
      setLoading(false); // ロード終了
    }
  }, [currentPage, filters]); // 依存配列にcurrentPageとfiltersを追加

  // コンポーネントマウント時、またはfetchUserDataの依存が変更された時に実行
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // フィルター条件が変更された時のハンドラ
  const handleFilterChange = useCallback(
    (newFilters: Omit<GetUsersParams, "limit" | "offset">) => {
      setFilters(newFilters);
      setCurrentPage(1); // フィルター適用時は1ページ目に戻す
    },
    []
  );

  // ページが変更された時のハンドラ
  // const handlePageChange = useCallback((page: number) => {
  //   setCurrentPage(page);
  // }, []);

  // ユーザー編集モーダルを開くハンドラ
  const handleEditUser = useCallback((user: UserWithRoles) => {
    setSelectedUser(user); // 編集対象ユーザーを設定
    setIsModalOpen(true); // モーダルを開く
  }, []);

  // ユーザー役割を保存するハンドラ (UserRoleEditModalから呼び出される)
  const handleSaveUserRoles = useCallback(
    async (userId: string, newRoleIds: number[]) => {
      setUserRolesSaving(true); // 保存開始ローディング
      try {
        // ユーザー役割を更新するServer Actionを呼び出す
        const { error: updateError } = await updateUserRolesAction(
          userId,
          newRoleIds
        );
        if (updateError) throw new Error(updateError); // エラーがあればスロー

        showCustomToast({
          message: "更新成功",
          submessage: "ユーザーの役割を更新しました。",
          type: "success",
        });
        setIsModalOpen(false); // モーダルを閉じる
        fetchUserData(); // リストを最新の状態に更新するためにデータを再フェッチ
      } catch (err: unknown) {
        console.error("役割更新エラー:", err);
        let subMsg = "不明なエラー";
        if (err instanceof Error) {
          subMsg = err.message;
        }
        showCustomToast({
          message: "更新失敗",
          submessage: `役割の更新に失敗しました: ${subMsg}`,
          type: "error",
        });
      } finally {
        setUserRolesSaving(false); // 保存終了ローディング
      }
    },
    [fetchUserData]
  ); // fetchUserDataを依存配列に追加し、更新後に再フェッチを確実にする

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter">
      {/* ToastContainer はアプリケーションのルートレイアウト（app/layout.tsx）に配置することが推奨されます */}

      {/* Header (共通ヘッダー) はLayoutコンポーネントでラップされていることを想定 */}
      <main className="container mx-auto bg-white p-6 rounded-lg shadow-xl my-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
          ユーザー管理 &gt; ユーザー一覧
        </h1>

        {/* 検索フィルターコンポーネント */}
        <UserTableFilter
          onFilterChange={handleFilterChange}
          currentFilters={filters}
          allRoles={allRoles} // 全役割をフィルターコンポーネントに渡す
          loading={loading} // 検索中はフィルターを無効化
        />

        {/* ロード状態、エラー、データなしの表示 */}
        {loading ? (
          <div className="mt-6">
            {/* Table Skeleton */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {SKELETON_TABLE_HEADERS.map((header) => (
                      <th
                        key={header.key}
                        className={`${header.thClassName} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                      >
                        <Skeleton className={`h-4 ${header.skeletonWidth}`} />
                      </th>
                    ))}
                    {/* Actions */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-full" />
                      </td>
                      {/* ... 他のtd要素 ... */}
                      <td className="px-2 py-4 whitespace-nowrap text-center">
                        <Skeleton className="h-5 w-6 mx-auto" />
                      </td>
                      {/* ← このような空白やコメントが原因の可能性があります */}
                      {/* Role Check Placeholder */}
                      {/* ... */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : error ? (
          <p className="text-red-600 text-center text-lg mt-8 p-4 bg-red-50 rounded-md border border-red-200">
            {error}
          </p>
        ) : users.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
            該当するユーザーはいません。
          </p>
        ) : (
          <>
            {/* ユーザーリストテーブルコンポーネント */}
            <UserTable
              users={users}
              onEditUser={handleEditUser} // 編集ボタンクリックハンドラを渡す
              allRoles={allRoles} // 役割名表示用に渡す
            />
          </>
        )}
      </main>

      {/* ユーザー役割編集モーダル */}
      {selectedUser && ( // 編集対象ユーザーが選択されている場合のみモーダルを表示
        <ModalUserRoleEdit
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} // モーダルを閉じるハンドラ
          user={selectedUser} // 編集対象ユーザー
          allRoles={allRoles} // 全役割リスト
          onSave={handleSaveUserRoles} // 保存ハンドラを渡す
          isLoading={userRolesSaving} // 保存中のローディング状態
        />
      )}
      {/* Footer (共通フッター) はLayoutコンポーネントでラップされていることを想定 */}
    </div>
  );
}
