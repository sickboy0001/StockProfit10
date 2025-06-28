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
  DisplayableEntryCondition,
  GroupedCondition,
  LogicalOperator,
  SimpleEntryCondition,
} from "@/types/simulation";

interface EntryGroupConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newGroup: GroupedCondition<SimpleEntryCondition>) => void;
  availableConditions: DisplayableEntryCondition[];
}

export const PlanEntryGroupModal: React.FC<EntryGroupConditionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableConditions,
}) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [groupLogic, setGroupLogic] = useState<LogicalOperator>("OR");

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれたときに状態をリセット
      setSelectedConditions([]);
      setGroupLogic("OR");
    }
  }, [isOpen]);

  const handleToggleSelect = (conditionId: string) => {
    setSelectedConditions((prev) =>
      prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleCreateGroup = () => {
    if (selectedConditions.length < 2) {
      showCustomToast({
        message: "入力エラー",
        submessage: "グループ化するには2つ以上の条件を選択してください。",
        type: "error",
      });
      return;
    }

    const conditionsToGroup: DisplayableEntryCondition[] = [];
    selectedConditions.forEach((id) => {
      const found = availableConditions.find((cond) => cond.id === id);
      if (found) {
        conditionsToGroup.push(found);
      }
    });

    if (conditionsToGroup.length !== selectedConditions.length) {
      showCustomToast({
        message: "エラー",
        submessage: "選択された条件の一部が見つかりませんでした。",
        type: "error",
      });
      return;
    }

    const groupLabel = `グループ (${conditionsToGroup
      .map((c) => c.label)
      .join(` ${groupLogic} `)})`;
    const newGroup: GroupedCondition<SimpleEntryCondition> = {
      id: `entry_group_${Date.now()}`,
      isGroup: true,
      logic: groupLogic,
      conditions: conditionsToGroup,
      label: groupLabel,
    };

    onSubmit(newGroup);
    onClose(); // 成功したらモーダルを閉じる
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl rounded-lg border border-gray-200">
        <CardHeader className="bg-white p-6 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-800">
            入口条件グループを作成
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            グループに含める条件を2つ以上選択し、結合ロジックを指定してください。
          </p>
          <div>
            <Label htmlFor="entry-group-logic" className="text-gray-700">
              グループ内結合ロジック
            </Label>
            <Select
              value={groupLogic}
              onValueChange={(value) => setGroupLogic(value as LogicalOperator)}
            >
              <SelectTrigger id="entry-group-logic" className="w-full">
                <SelectValue placeholder="結合ロジックを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND (すべての条件を満たす)</SelectItem>
                <SelectItem value="OR">OR (いずれかの条件を満たす)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">選択可能な条件</Label>
            <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
              {availableConditions.length > 0 ? (
                availableConditions.map((cond) => (
                  <div
                    key={cond.id}
                    className="flex items-center space-x-2 py-1"
                  >
                    <Input
                      type="checkbox"
                      id={`entry-group-select-${cond.id}`}
                      checked={selectedConditions.includes(cond.id)}
                      onChange={() => handleToggleSelect(cond.id)}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <Label
                      htmlFor={`entry-group-select-${cond.id}`}
                      className="text-gray-800 cursor-pointer"
                    >
                      {cond.label}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  グループ化できる条件がありません。まず個別の条件を追加してください。
                </p>
              )}
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
              onClick={handleCreateGroup}
              disabled={selectedConditions.length < 2}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
            >
              グループ追加
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
