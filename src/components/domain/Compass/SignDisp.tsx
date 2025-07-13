"use client";

import {
  GroupCondition,
  SignCondition,
  SimpleCondition,
} from "@/types/simulation";
import React from "react";

// --- Condition Formatting ---
const conditionFormatters: Record<string, (c: SimpleCondition) => string> = {
  // Entry conditions
  priceMovement: (c) =>
    `価格が${c.variableADays}日間で${c.variableBPercent}%以上 上昇`,
  macdCrossover: (c) =>
    `MACD(${c.macdShortEma}, ${c.macdLongEma}, ${c.macdSignalEma})がゴールデンクロスしてから${c.macdCrossoverOccurredDays}日以内`,
  macdZeroCrossover: (c) =>
    `MACD(${c.macdShortEma}, ${c.macdLongEma}, ${c.macdSignalEma})が0ラインを上抜けしてから${c.macdZeroCrossoverOccurredDays}日以内`,
  // Exit conditions
  fixedDays: (c) => `${c.days}日経過で決済`,
  profitTarget: (c) => `${c.percent}%の利益で決済`,
  stopLoss: (c) => `${c.percent}%の損失で決済`,
};

const formatSimpleCondition = (condition: SimpleCondition): string => {
  if (condition.label) {
    return condition.label;
  }
  const formatter = conditionFormatters[condition.type];
  if (formatter) {
    try {
      return formatter(condition);
    } catch (e) {
      console.error(
        `Error formatting condition of type '${condition.type}':`,
        e
      );
    }
  }
  const params = Object.entries(condition)
    .filter(([key]) => !["type", "label", "id"].includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${condition.type} (${params})`;
};

// --- Recursive Renderer Component ---
const ConditionRenderer: React.FC<{
  condition: SignCondition;
  level?: number;
}> = ({ condition, level = 0 }) => {
  if (condition.type === "group" && Array.isArray(condition.conditions)) {
    const group = condition as GroupCondition;
    return (
      <div
        className="border-l-2 pl-4 py-2 space-y-3"
        style={{
          marginLeft: `${level > 0 ? 16 : 0}px`,
          borderColor:
            group.logic === "AND"
              ? "rgba(59, 130, 246, 0.7)"
              : "rgba(249, 115, 22, 0.7)",
        }}
      >
        <div
          className={`text-sm font-bold px-2 py-1 rounded-md inline-block ${
            group.logic === "AND"
              ? "bg-blue-100 text-blue-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {group.logic === "AND"
            ? "すべての条件を満たす (AND)"
            : "いずれかの条件を満たす (OR)"}
        </div>
        <div className="space-y-2">
          {group.conditions.map((cond, index) => (
            <ConditionRenderer key={index} condition={cond} level={level + 1} />
          ))}
        </div>
      </div>
    );
  }

  const simpleCondition = condition as SimpleCondition;
  return (
    <div
      className="bg-gray-50 p-3 rounded-md text-gray-800 text-sm border border-gray-200"
      style={{ marginLeft: `${level > 0 ? 16 : 0}px` }}
    >
      {formatSimpleCondition(simpleCondition)}
    </div>
  );
};

// --- Type definitions for props ---
interface EntryConditionsWrapper {
  entryConditions: SignCondition[];
  globalEntryConditionLogic: "AND" | "OR";
}

interface ExitConditionsWrapper {
  exitConditions: SignCondition[];
}

type ConditionsSource =
  | string
  | EntryConditionsWrapper
  | ExitConditionsWrapper
  | SignCondition
  | null;

// --- Main Display Component ---
interface SignDispProps {
  conditionsJson: ConditionsSource;
  signalType: "entry" | "exit";
}

export default function SignDisp({
  conditionsJson,
  signalType,
}: SignDispProps) {
  if (!conditionsJson) {
    return (
      <p className="text-gray-500 text-sm p-4 border rounded-lg bg-gray-50">
        {signalType === "entry" ? "入口" : "出口"}
        サイン条件が設定されていません。
      </p>
    );
  }

  try {
    const rawData: unknown =
      typeof conditionsJson === "string"
        ? JSON.parse(conditionsJson)
        : conditionsJson;

    if (typeof rawData !== "object" || rawData === null) {
      throw new Error("Conditions data is not a valid object.");
    }

    let rootCondition: SignCondition;

    if (signalType === "entry") {
      // Type guard for EntryConditionsWrapper
      if (
        typeof rawData === "object" &&
        rawData !== null &&
        "entryConditions" in rawData &&
        Array.isArray(
          (rawData as { entryConditions: unknown }).entryConditions
        ) &&
        "globalEntryConditionLogic" in rawData
      ) {
        const data = rawData as EntryConditionsWrapper;
        rootCondition = {
          type: "group",
          logic: data.globalEntryConditionLogic,
          conditions: data.entryConditions,
        };
      } else if (
        typeof rawData === "object" &&
        rawData !== null &&
        "type" in rawData
      ) {
        rootCondition = rawData as SignCondition;
      } else {
        throw new Error("Unrecognized entry condition data structure.");
      }
    } else {
      // signalType === 'exit'
      // Type guard for ExitConditionsWrapper
      if (
        typeof rawData === "object" &&
        rawData !== null &&
        "exitConditions" in rawData &&
        Array.isArray((rawData as { exitConditions: unknown }).exitConditions)
      ) {
        const data = rawData as ExitConditionsWrapper;
        rootCondition = {
          type: "group",
          logic: "OR", // Exit conditions are always OR'd
          conditions: data.exitConditions,
        };
      } else if (
        typeof rawData === "object" &&
        rawData !== null &&
        "type" in rawData
      ) {
        rootCondition = rawData as SignCondition;
      } else {
        throw new Error("Unrecognized exit condition data structure.");
      }
    }

    return (
      <div className="p-4 border rounded-lg bg-white">
        <ConditionRenderer condition={rootCondition} />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to parse ${signalType} signal conditions:`, message);
    return (
      <div className="p-4 border rounded-lg bg-white">
        <p className="text-red-500">
          {signalType === "entry" ? "入口" : "出口"}
          サイン条件の解析に失敗しました。
        </p>
      </div>
    );
  }
}
