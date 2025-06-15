import React, { useState, useEffect, useCallback } from "react";
import { UserWithRoles, Role } from "@/app/actions/UserRole"; // 型定義をインポート
// shadcn/ui の Dialog コンポーネントを想定
// インストール済みであることを前提とします
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // shadcn/ui の Button をインポート

interface UserRoleEditModalProps {
  isOpen: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じるハンドラ
  user: UserWithRoles; // 編集対象のユーザーデータ
  allRoles: Role[]; // 全ての役割リスト（チェックボックス表示用）
  onSave: (userId: string, roleIds: number[]) => Promise<void>; // 保存処理を実行するハンドラ
  isLoading: boolean; // 保存中のローディング状態
}

const ModalUserRoleEdit: React.FC<UserRoleEditModalProps> = ({
  isOpen,
  onClose,
  user,
  allRoles,
  onSave,
  isLoading,
}) => {
  // ユーザーが現在持っている役割のIDを状態として保持
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // ユーザーまたは全役割データが変更された時に、選択状態を初期化/更新
  useEffect(() => {
    if (user && allRoles.length > 0) {
      // user.user_roles が null の場合を考慮して空配列をデフォルト値とする
      const rolesToMap = user.user_roles || [];
      const currentRoleIds = rolesToMap
        .map((roleName) => allRoles.find((r) => r.name === roleName)?.id)
        .filter((id): id is number => id !== undefined); // undefinedを除外してnumber[]にする
      setSelectedRoleIds(currentRoleIds);
    } else {
      // user が null の場合や allRoles が空の場合は、選択中の役割をクリアする
      setSelectedRoleIds([]);
    }
  }, [user, allRoles]);

  // チェックボックスの状態変更ハンドラ
  const handleCheckboxChange = useCallback(
    (roleId: number, isChecked: boolean) => {
      setSelectedRoleIds(
        (prev) =>
          isChecked ? [...prev, roleId] : prev.filter((id) => id !== roleId) // 選択/非選択に応じてIDを配列に追加/削除
      );
    },
    []
  );

  // 保存ボタンクリック時のハンドラ
  const handleSave = useCallback(async () => {
    await onSave(user.user_id, selectedRoleIds);
    // onSaveが完了すると、親コンポーネントでisLoadingがfalseになり、モーダルが閉じられることを想定しています
  }, [user.user_id, selectedRoleIds, onSave]);

  return (
    // DialogコンポーネントのopenとonOpenChangeはshadcn/uiの標準的な使い方
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            ユーザー役割の編集
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            ユーザー {user.user_name || user.user_email} の役割を設定します。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* ユーザーIDとメール表示 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium text-gray-700">
              ユーザーID:
            </label>
            <span className="col-span-3 text-gray-800 font-mono">
              {user.user_id.substring(0, 8)}...
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right font-medium text-gray-700">
              メール:
            </label>
            <span className="col-span-3 text-gray-800">{user.user_email}</span>
          </div>
          {/* 役割選択チェックボックス */}
          <div className="grid grid-cols-4 items-start gap-4 mt-4">
            <label className="text-right font-medium text-gray-700 pt-2">
              役割:
            </label>
            <div className="col-span-3 flex flex-col space-y-2">
              {allRoles.map((role) => (
                <div key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)} // 現在の選択状態
                    onChange={(e) =>
                      handleCheckboxChange(role.id, e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    disabled={isLoading} // 保存中はチェックボックスを無効化
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className="ml-2 text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    {role.name} ({role.short_name})
                    <span className="text-gray-500 text-xs ml-1">
                      ({role.description})
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* フッターのボタン */}
        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-md border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalUserRoleEdit;
