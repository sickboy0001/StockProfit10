// components/SignalDetailModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DisplayPlan } from "@/app/actions/Compass/PlanActions"; // DisplayPlanの型をインポート
import { updateSignalNameAction } from "@/app/actions/Compass/PlanActions";

interface ModalSignalDetailProps {
  isOpen: boolean;
  onClose: () => void;
  plan: DisplayPlan | null;
  onSaveSuccess: (updatedPlan: DisplayPlan) => void;
  onShowMessage: (message: string) => void; // メッセージ表示用のコールバックを追加
}

export function ModalSignalDetail({
  isOpen,
  onClose,
  plan,
  onSaveSuccess,
  onShowMessage,
}: ModalSignalDetailProps) {
  const [editingSignalName, setEditingSignalName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // planが変更されたときに editingSignalName を更新
  useEffect(() => {
    if (plan) {
      setEditingSignalName(plan.signal_name || "");
    }
  }, [plan]);

  const handleSaveSignalName = async () => {
    if (!plan || !plan.signal_id || !editingSignalName.trim()) {
      onShowMessage("シグナルIDがないか、名前が空です。");
      return;
    }

    setIsSaving(true);
    const result = await updateSignalNameAction(
      plan.signal_id,
      editingSignalName.trim()
    );

    if (result.error) {
      onShowMessage(`更新に失敗しました: ${result.error}`);
    } else {
      // 成功した場合、親コンポーネントに更新されたプランを渡す
      onSaveSuccess({ ...plan, signal_name: editingSignalName.trim() });
      onClose(); // モーダルを閉じる
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>シグナル詳細・編集</DialogTitle>
          <DialogDescription>
            シグナル名を確認・編集できます。
          </DialogDescription>
        </DialogHeader>
        {plan && (
          <>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">プラン名</Label>
                <span className="col-span-2">{plan.plan_name}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="signal-name-edit" className="text-right">
                  シグナル名
                </Label>
                <Input
                  id="signal-name-edit"
                  value={editingSignalName}
                  onChange={(e) => setEditingSignalName(e.target.value)}
                  className="col-span-2"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">入口/出口</Label>
                <span className="col-span-2">
                  {plan.entry_signal_name || "-"} /{" "}
                  {plan.exit_signal_name || "-"}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={handleSaveSignalName} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
