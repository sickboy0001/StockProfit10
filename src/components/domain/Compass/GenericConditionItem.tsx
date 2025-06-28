"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming cn is in lib/utils
import {
  GroupedCondition,
  SimpleEntryCondition,
  SimpleExitCondition,
} from "@/types/simulation";

// Recursive Condition Item Component (汎用化)
interface GenericConditionItemProps<
  T extends SimpleEntryCondition | SimpleExitCondition
> {
  condition: T | GroupedCondition<T>;
  onRemove: (id: string) => void;
  onEdit?: (condition: T) => void; // Add onEdit prop for editing simple conditions
  depth?: number;
}

export const GenericConditionItem = <
  T extends SimpleEntryCondition | SimpleExitCondition
>({
  condition,
  onRemove,
  onEdit,
  depth = 0,
}: GenericConditionItemProps<T>) => {
  const isGroup = "isGroup" in condition && condition.isGroup;

  const marginLeft = depth * 16; // Indentation for nested groups, 16px per level

  const isSimpleCondition = !isGroup;

  return (
    <li
      key={condition.id}
      className={cn(
        "bg-white p-3 rounded-md shadow-sm text-sm text-gray-800 border",
        isGroup ? "border-blue-200" : "border-gray-100",
        depth > 0 && "mt-2"
      )}
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div className="flex items-center justify-between">
        <span>
          {isGroup ? (
            <span className="font-bold text-blue-700">{condition.label}</span>
          ) : (
            condition.label
          )}
        </span>
        <div className="flex space-x-1">
          {" "}
          {/* For buttons */}
          {/* シンプルな条件で、かつonEditが提供されている場合のみ編集ボタンを表示 */}
          {isSimpleCondition && onEdit && (
            <Button
              type="button"
              onClick={() => onEdit(condition as T)} // `onEdit`に条件全体を渡す
              className={cn(
                "bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full h-6 w-10 flex items-center justify-center p-0 text-xs",
                depth > 0 && "h-5 w-8"
              )}
              size="sm" // size prop for better button sizing
              title="編集"
            >
              編集
            </Button>
          )}
          {/* このコンポーネントが受け取る条件はすべて削除可能な「追加条件」なので、削除ボタンを表示 */}
          <Button
            type="button"
            onClick={() => onRemove(condition.id)}
            className={cn(
              "bg-red-500 hover:bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center p-0",
              depth > 0 && "h-5 w-5 text-xs"
            )}
            size="icon"
            title="削除"
          >
            ×
          </Button>
        </div>
      </div>
      {isGroup && (
        <ul className="ml-4 mt-2 space-y-1 text-gray-600">
          {condition.conditions.map((subCond, index) => (
            <React.Fragment key={subCond.id}>
              {index > 0 && (
                // Display AND/OR between conditions in a group
                <li
                  className="text-blue-500 font-semibold text-right pr-4"
                  style={{ marginLeft: `${marginLeft}px` }}
                >
                  {condition.logic}
                </li>
              )}
              <GenericConditionItem
                condition={subCond as T | GroupedCondition<T>}
                onRemove={onRemove}
                onEdit={onEdit}
                depth={depth + 1}
              />
            </React.Fragment>
          ))}
        </ul>
      )}
    </li>
  );
};
