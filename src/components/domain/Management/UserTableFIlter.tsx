import { GetUsersParams, Role } from "@/app/actions/UserRole";
import React, { useState, useEffect, useCallback } from "react";

interface UserFilterProps {
  onFilterChange: (filters: Omit<GetUsersParams, "limit" | "offset">) => void;
  currentFilters: Omit<GetUsersParams, "limit" | "offset">;
  allRoles: Role[]; // 全ての役割リスト（ドロップダウン用）
  loading: boolean; // 検索中かどうか
}

const UserTableFilter: React.FC<UserFilterProps> = ({
  onFilterChange,
  currentFilters,
  // allRoles,
  loading,
}) => {
  // フィルターの内部状態
  const [userName, setUserName] = useState(currentFilters.userName || "");
  const [email, setEmail] = useState(currentFilters.email || "");
  // 複数選択のためのselectedRoleIds
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    currentFilters.roleIds || []
  );
  const [status, setStatus] = useState<string>(
    currentFilters.status === true
      ? "active"
      : currentFilters.status === false
      ? "inactive"
      : "all"
  );

  // 親コンポーネントのフィルター変更を内部状態に同期
  useEffect(() => {
    setUserName(currentFilters.userName || "");
    setEmail(currentFilters.email || "");
    setSelectedRoleIds(currentFilters.roleIds || []);
    setStatus(
      currentFilters.status === true
        ? "active"
        : currentFilters.status === false
        ? "inactive"
        : "all"
    );
  }, [currentFilters]);

  // 検索ボタンクリック時のハンドラ
  const handleSearch = useCallback(() => {
    const filtersToSend: Omit<GetUsersParams, "limit" | "offset"> = {
      userName: userName.trim() || null, // 空文字の場合はnullにする
      email: email.trim() || null,
      roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : null, // 選択がなければnull
      status: status === "active" ? true : status === "inactive" ? false : null, // 'all'の場合はnull
    };
    onFilterChange(filtersToSend);
  }, [userName, email, selectedRoleIds, status, onFilterChange]);

  // フォーム送信時 (Enterキーなど) のハンドラ
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault(); // デフォルトのフォーム送信を防ぐ
      handleSearch();
    },
    [handleSearch]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 p-6 border rounded-xl bg-gradient-to-r from-gray-50 to-white shadow-sm"
    >
      <h2 className="text-xl font-semibold mb-5 text-gray-700">
        検索フィルター
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
        {/* ユーザー名入力 */}
        <div>
          <label
            htmlFor="userName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ユーザー名
          </label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-base focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            placeholder="ユーザー名を入力"
            disabled={loading}
          />
        </div>
        {/* メールアドレス入力 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 text-base focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            placeholder="メールアドレスを入力"
            disabled={loading}
          />
        </div>
        {/* 検索ボタン */}
        <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-4">
          <button
            type="submit" // type="submit" にすることでEnterキーでの送信も可能に
            disabled={loading} // ロード中はボタンを無効化
            className={`px-8 py-2.5 rounded-full font-semibold text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
          >
            {loading ? "検索中..." : "検索"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default UserTableFilter;
