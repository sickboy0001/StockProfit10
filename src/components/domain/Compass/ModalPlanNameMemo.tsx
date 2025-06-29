// components/SignalDetailModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DisplayPlan,
  updatePlanDetailsAction,
} from "@/app/actions/Compass/PlanActions";

interface ModalPlanNameMemoProps {
  isOpen: boolean;
  onClose: () => void;
  plan: DisplayPlan | null;
  onSaveSuccess: (
    updatedDetails: Pick<DisplayPlan, "id" | "plan_name" | "plan_memo">
  ) => void;
  onShowMessage: (message: string) => void; // メッセージ表示用のコールバックを追加
}

export function ModalPlanNameMemo({
  isOpen,
  onClose,
  plan,
  onSaveSuccess,
  onShowMessage,
}: ModalPlanNameMemoProps) {
  const [editingPlanName, setEditingPlanName] = useState("");
  const [editingPlanMemo, setEditingPlanMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setEditingPlanName(plan.plan_name || "");
      setEditingPlanMemo(plan.plan_memo || "");
    }
  }, [plan]);

  const handleSave = async () => {
    if (!plan || !editingPlanName.trim()) {
      onShowMessage("プラン名を入力してください。");
      return;
    }

    setIsSaving(true);
    const result = await updatePlanDetailsAction(
      plan.id,
      editingPlanName.trim(),
      editingPlanMemo.trim()
    );

    if (result.error) {
      onShowMessage(`更新に失敗しました: ${result.error}`);
    } else {
      onSaveSuccess({
        id: plan.id,
        plan_name: editingPlanName.trim(),
        plan_memo: editingPlanMemo.trim(),
      });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>プラン名とメモを編集</DialogTitle>
        </DialogHeader>
        {plan && (
          <>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="plan-name-edit" className="text-gray-700">
                  プラン名
                </Label>
                <Input
                  id="plan-name-edit"
                  value={editingPlanName}
                  onChange={(e) => setEditingPlanName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="plan-memo-edit" className="text-gray-700">
                  メモ
                </Label>
                <Textarea
                  id="plan-memo-edit"
                  value={editingPlanMemo}
                  onChange={(e) => setEditingPlanMemo(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
