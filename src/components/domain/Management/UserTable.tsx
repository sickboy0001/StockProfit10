// components/UserManagement/UserTable.tsx
import React from "react";
import { UserWithRoles, Role } from "@/app/actions/UserRole"; // 型定義をインポート

interface UserTableProps {
  users: UserWithRoles[]; // 表示するユーザーデータ
  onEditUser: (user: UserWithRoles) => void; // 編集ボタンクリック時のハンドラ
  allRoles: Role[]; // 全ての役割リスト (テーブルヘッダーの短縮名表示やチェックマーク判断用)
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onEditUser,
  allRoles,
}) => {
  // 役割の短縮名（short_name）をIDで素早く検索するためのMapを作成
  // const roleShortNameMap = new Map(allRoles.map(role => [role.id, role.short_name || role.name]));

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              ユーザーID (UUID先頭8桁)
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              ユーザー名
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              メールアドレス
            </th>
            {/* 動的な役割ヘッダー (ショートネームを使用) */}
            {allRoles.map((role) => (
              <th
                key={role.id}
                scope="col"
                className="px-2 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                {role.short_name || role.name.substring(0, 3).toUpperCase()}{" "}
                {/* short_nameがなければ名前の頭3文字 */}
              </th>
            ))}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              ステータス
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              登録日時
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              最終ログイン
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr
              key={user.user_id}
              className="hover:bg-blue-50 transition duration-150 ease-in-out"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.user_id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {user.user_name || "未設定"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {user.user_email}
              </td>
              {/* 各ユーザーの役割チェックマーク */}
              {allRoles.map((role) => (
                <td
                  key={`${user.user_id}-${role.id}`}
                  className="px-2 py-4 whitespace-nowrap text-center text-sm"
                >
                  {user.user_roles && user.user_roles.includes(role.name) ? (
                    <span className="text-green-500">✔</span> // 役割があればチェックマーク
                  ) : (
                    <span className="text-gray-300">－</span> // なければハイフン
                  )}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.is_active ? "有効" : "無効"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(user.registered_at).toLocaleDateString("ja-JP")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {user.last_signed_in_at
                  ? new Date(user.last_signed_in_at).toLocaleDateString("ja-JP")
                  : "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEditUser(user)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
                >
                  編集
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default UserTable;
