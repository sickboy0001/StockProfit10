"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showCustomToast } from "@/components/organisms/CustomToast";
import {
  ExitConditionType,
  SimpleExitCondition,
  TransactionDirection,
} from "./PlanMake";

interface ExitConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (condition: SimpleExitCondition) => void;
  conditionToEdit: SimpleExitCondition | null;
  transactionType: TransactionDirection;
}

const getFilteredOptionalExitConditionTypes = () => {
  return [
    { value: "acceleratedProfit", label: "短期利益率達成" },
    { value: "acceleratedStopLoss", label: "短期損切り率到達" },
  ];
};

export const PlanExitConditionModal: React.FC<ExitConditionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  conditionToEdit,
  transactionType,
}) => {
  const [modalExitConditionType, setModalExitConditionType] =
    useState<ExitConditionType>("acceleratedProfit");
  const [modalExitPercent, setModalExitPercent] = useState<number>(7);
  const [modalExitWithinDays, setModalExitWithinDays] = useState<number>(7);

  useEffect(() => {
    if (!isOpen) return;

    if (conditionToEdit) {
      setModalExitConditionType(conditionToEdit.type);
      setModalExitWithinDays(conditionToEdit.withinDays || 7);
      setModalExitPercent(conditionToEdit.percent || 7);
    } else {
      // Reset to default for new condition
      setModalExitConditionType("acceleratedProfit");
      setModalExitWithinDays(7);
      setModalExitPercent(7);
    }
  }, [isOpen, conditionToEdit, transactionType]);
  const handleConfirm = () => {
    let newOrUpdatedCondition: SimpleExitCondition | null = null;

    const validateModalInput = (value: number, name: string) => {
      if (isNaN(value) || value < 0) {
        showCustomToast({
          message: "入力エラー",
          submessage: `${name} は有効な数値を入力してください。`,
          type: "error",
        });
        return false;
      }
      return true;
    };

    switch (modalExitConditionType) {
      case "acceleratedProfit":
        if (
          !validateModalInput(modalExitWithinDays, "期間日数") ||
          !validateModalInput(modalExitPercent, "利益率")
        )
          return;
        const profitLabel =
          transactionType === "short"
            ? `${modalExitWithinDays}日以内に${modalExitPercent}%利益で決済 (空売り)`
            : `${modalExitWithinDays}日以内に${modalExitPercent}%利益で決済`;

        newOrUpdatedCondition = {
          id: conditionToEdit?.id || `optional_exit_cond_${Date.now()}`,
          type: "acceleratedProfit",
          label: profitLabel,
          withinDays: modalExitWithinDays,
          percent: modalExitPercent,
        };
        break;
      case "acceleratedStopLoss":
        if (
          !validateModalInput(modalExitWithinDays, "期間日数") ||
          !validateModalInput(modalExitPercent, "損切り率")
        )
          return;

        const stopLossLabel =
          transactionType === "short"
            ? `${modalExitWithinDays}日以内に${modalExitPercent}%損切りで決済 (空売り)`
            : `${modalExitWithinDays}日以内に${modalExitPercent}%損切りで決済`;

        newOrUpdatedCondition = {
          id: conditionToEdit?.id || `optional_exit_cond_${Date.now()}`,
          type: "acceleratedStopLoss",
          label: stopLossLabel,
          withinDays: modalExitWithinDays,
          percent: modalExitPercent,
        };
        break;
      default:
        showCustomToast({
          message: "入力エラー",
          submessage: "無効な出口条件タイプです。",
          type: "error",
        });
        return;
    }

    if (newOrUpdatedCondition) {
      onSubmit(newOrUpdatedCondition);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl rounded-lg border border-gray-200">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-800">
            {conditionToEdit
              ? "追加出口サイン条件を編集"
              : "追加出口サイン条件を追加"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label
              htmlFor="modal-exit-condition-type"
              className="text-gray-700"
            >
              条件タイプ
            </Label>
            <Select
              value={modalExitConditionType}
              onValueChange={(value) =>
                setModalExitConditionType(value as ExitConditionType)
              }
              disabled={!!conditionToEdit}
            >
              <SelectTrigger id="modal-exit-condition-type" className="w-full">
                <SelectValue placeholder="条件タイプを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {getFilteredOptionalExitConditionTypes().map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modal-exit-accel-days" className="text-gray-700">
                期間日数
              </Label>
              <Input
                id="modal-exit-accel-days"
                type="number"
                value={modalExitWithinDays}
                onChange={(e) => setModalExitWithinDays(Number(e.target.value))}
                min="0"
                className="rounded-md"
              />
            </div>
            <div>
              <Label
                htmlFor="modal-exit-accel-percent"
                className="text-gray-700"
              >
                {modalExitConditionType === "acceleratedProfit"
                  ? "利益率"
                  : "損切り率"}{" "}
                (%)
              </Label>
              <Input
                id="modal-exit-accel-percent"
                type="number"
                value={modalExitPercent}
                onChange={(e) => setModalExitPercent(Number(e.target.value))}
                step="0.1"
                min="0"
                className="rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              {conditionToEdit ? "更新" : "追加"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
