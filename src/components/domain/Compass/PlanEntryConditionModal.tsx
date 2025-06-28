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
  EntryConditionType,
  SimpleEntryCondition,
  TransactionDirection,
} from "@/types/simulation";

interface EntryConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (condition: SimpleEntryCondition) => void;
  conditionToEdit: SimpleEntryCondition | null;
  transactionType: TransactionDirection;
}

const getEntryConditionTypes = (type: TransactionDirection) => {
  return [
    {
      value: "priceMovement",
      label: type === "long" ? "指定期間での株価上昇" : "指定期間での株価下落",
    },
    {
      value: "maCrossover",
      label:
        type === "long"
          ? "移動平均線ゴールデンクロス"
          : "移動平均線デッドクロス",
    },
    {
      value: "macdCrossover",
      label: type === "long" ? "MACDゴールデンクロス" : "MACDデッドクロス",
    },
    {
      value: "macdZeroCrossover",
      label: type === "long" ? "MACDゼロライン上抜け" : "MACDゼロライン下抜け",
    },
  ];
};
export const PlanEntryConditionModal: React.FC<EntryConditionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  conditionToEdit,
  transactionType,
}) => {
  const [modalEntryConditionType, setModalEntryConditionType] =
    // useState<EntryConditionType>("priceChange");
    useState<EntryConditionType>("priceMovement");
  const [modalEntryVariableADays, setModalEntryVariableADays] =
    useState<number>(3);
  const [modalEntryVariableBPercent, setModalEntryVariableBPercent] =
    useState<number>(3);
  const [modalEntryMaShortDays, setModalEntryMaShortDays] = useState<number>(5);
  const [modalEntryMaLongDays, setModalEntryMaLongDays] = useState<number>(25);
  const [modalEntryMaCrossOccurredDays, setModalEntryMaCrossOccurredDays] =
    useState<number>(1);
  const [modalEntryMacdShortEma, setModalEntryMacdShortEma] =
    useState<number>(12);
  const [modalEntryMacdLongEma, setModalEntryMacdLongEma] =
    useState<number>(26);
  const [modalEntryMacdSignalEma, setModalEntryMacdSignalEma] =
    useState<number>(9);
  // const [modalEntryMacdGcOccurredDays, setModalEntryMacdGcOccurredDays] =
  //   useState<number>(1);
  const [modalMacdCrossoverOccurredDays, setModalMacdCrossoverOccurredDays] =
    useState<number>(1);
  const [
    modalMacdZeroCrossoverOccurredDays,
    setModalMacdZeroCrossoverOccurredDays,
  ] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) return;
    const filteredTypes = getEntryConditionTypes(transactionType);

    // const filteredTypes = getFilteredEntryConditionTypes(transactionType);
    const defaultType =
      (filteredTypes[0]?.value as EntryConditionType) || "priceMovement";
    // (filteredTypes[0]?.value as EntryConditionType) || "priceChange";

    if (conditionToEdit) {
      setModalEntryConditionType(conditionToEdit.type);
      setModalEntryVariableADays(conditionToEdit.variableADays || 3);
      setModalEntryVariableBPercent(conditionToEdit.variableBPercent || 3);
      setModalEntryMaShortDays(conditionToEdit.maShortDays || 5);
      setModalEntryMaLongDays(conditionToEdit.maLongDays || 25);
      setModalEntryMaCrossOccurredDays(
        conditionToEdit.maCrossOccurredDays || 1
      );
      setModalEntryMacdShortEma(conditionToEdit.macdShortEma || 12);
      setModalEntryMacdLongEma(conditionToEdit.macdLongEma || 26);
      setModalEntryMacdSignalEma(conditionToEdit.macdSignalEma || 9);
      // setModalEntryMacdGcOccurredDays(conditionToEdit.macdGcOccurredDays || 1);
      // setModalEntryMacdZeroCrossUpOccurredDays(
      //   conditionToEdit.macdZeroCrossUpOccurredDays || 1
      // );
      setModalMacdCrossoverOccurredDays(
        conditionToEdit.macdCrossoverOccurredDays || 1
      );
      // setModalEntryMacdZeroCrossDownOccurredDays(
      //   conditionToEdit.macdZeroCrossDownOccurredDays || 1
      // );
      setModalMacdZeroCrossoverOccurredDays(
        conditionToEdit.macdZeroCrossoverOccurredDays || 1
      );
    } else {
      setModalEntryConditionType(defaultType);
      setModalEntryVariableADays(3);
      setModalEntryVariableBPercent(3);
      setModalEntryMaShortDays(5);
      setModalEntryMaLongDays(25);
      setModalEntryMaCrossOccurredDays(1);
      setModalEntryMacdShortEma(12);
      setModalEntryMacdLongEma(26);
      setModalEntryMacdSignalEma(9);
      // setModalEntryMacdGcOccurredDays(1);
      // setModalEntryMacdZeroCrossUpOccurredDays(1);
      // setModalEntryMacdZeroCrossDownOccurredDays(1);
      setModalMacdCrossoverOccurredDays(1);
      setModalMacdZeroCrossoverOccurredDays(1);
    }
  }, [isOpen, conditionToEdit, transactionType]);

  const handleConfirm = () => {
    let newOrUpdatedCondition: SimpleEntryCondition | null = null;
    let hasModalError = false;

    const validateModalInput = (value: number, name: string) => {
      if (isNaN(value) || value < 0) {
        showCustomToast({
          message: "入力エラー",
          submessage: `${name} は有効な数値を入力してください。`,
          type: "error",
        });
        hasModalError = true;
        return false;
      }
      return true;
    };

    switch (modalEntryConditionType) {
      // case "priceChange":
      case "priceMovement":
        if (
          !validateModalInput(modalEntryVariableADays, "前提条件の日数 (A)") ||
          !validateModalInput(
            modalEntryVariableBPercent,
            // "前提条件の上昇率 (B)"
            `前提条件の${transactionType === "long" ? "上昇" : "下落"}率 (B)`
          )
        )
          return;
        const priceMovementLabel =
          transactionType === "long"
            ? `株価 ${modalEntryVariableADays}日間で${modalEntryVariableBPercent}%上昇`
            : `株価 ${modalEntryVariableADays}日間で${modalEntryVariableBPercent}%下落`;

        newOrUpdatedCondition = {
          id: conditionToEdit?.id || `entry_cond_${Date.now()}`,
          // type: "priceChange",
          // label: `株価 ${modalEntryVariableADays}日間で${modalEntryVariableBPercent}%上昇`,
          type: "priceMovement",
          label: priceMovementLabel,
          variableADays: modalEntryVariableADays,
          variableBPercent: modalEntryVariableBPercent,
        };
        break;
      // case "priceDecline":
      //   if (
      //     !validateModalInput(modalEntryVariableADays, "前提条件の日数 (A)") ||
      //     !validateModalInput(
      //       modalEntryVariableBPercent,
      //       "前提条件の下落率 (B)"
      //     )
      //   )
      //     return;
      //   newOrUpdatedCondition = {
      //     id: conditionToEdit?.id || `entry_cond_${Date.now()}`,
      //     type: "priceDecline",
      //     label: `株価 ${modalEntryVariableADays}日間で${modalEntryVariableBPercent}%下落`,
      //     variableADays: modalEntryVariableADays,
      //     variableBPercent: modalEntryVariableBPercent,
      //   };
      //   break;
      // case "maGoldenCross":
      case "maCrossover":
        if (
          !validateModalInput(
            modalEntryMaShortDays,
            "短期移動平均線日数 (A)"
          ) ||
          !validateModalInput(modalEntryMaLongDays, "長期移動平均線日数 (B)") ||
          !validateModalInput(
            modalEntryMaCrossOccurredDays,
            `${
              transactionType === "long" ? "ゴールデン" : "デッド"
            }クロス発生日数 (C)`
          )
        )
          return;
        if (modalEntryMaShortDays >= modalEntryMaLongDays) {
          showCustomToast({
            message: "入力エラー",
            submessage:
              "移動平均線の短期日数は長期日数より小さくしてください。",
            type: "error",
          });
          return;
        }
        const maCrossoverLabel =
          transactionType === "long"
            ? `MA-GC (${modalEntryMaShortDays}日-${modalEntryMaLongDays}日) が${modalEntryMaCrossOccurredDays}日間発生`
            : `MA-DC (${modalEntryMaShortDays}日-${modalEntryMaLongDays}日) が${modalEntryMaCrossOccurredDays}日間発生`;

        newOrUpdatedCondition = {
          id: conditionToEdit?.id || `entry_cond_${Date.now()}`,
          // type: "maGoldenCross",
          // label: `MA-GC (${modalEntryMaShortDays}日-${modalEntryMaLongDays}日) が${modalEntryMaCrossOccurredDays}日間発生`,
          type: "maCrossover",
          label: maCrossoverLabel,
          maShortDays: modalEntryMaShortDays,
          maLongDays: modalEntryMaLongDays,
          maCrossOccurredDays: modalEntryMaCrossOccurredDays,
        };
        break;
      // case "maDeadCross":
      //   if (
      //     !validateModalInput(
      //       modalEntryMaShortDays,
      //       "短期移動平均線日数 (A)"
      //     ) ||
      //     !validateModalInput(modalEntryMaLongDays, "長期移動平均線日数 (B)") ||
      //     !validateModalInput(
      //       modalEntryMaCrossOccurredDays,
      //       "デッドクロス発生日数 (C)"
      //     )
      //   )
      //     return;
      //   if (modalEntryMaShortDays >= modalEntryMaLongDays) {
      //     showCustomToast({
      //       message: "入力エラー",
      //       submessage:
      //         "移動平均線の短期日数は長期日数より小さくしてください。",
      //       type: "error",
      //     });
      //     return;
      //   }
      //   newOrUpdatedCondition = {
      //     id: conditionToEdit?.id || `entry_cond_${Date.now()}`,
      //     type: "maDeadCross",
      //     label: `MA-DC (${modalEntryMaShortDays}日-${modalEntryMaLongDays}日) が${modalEntryMaCrossOccurredDays}日間発生`,
      //     maShortDays: modalEntryMaShortDays,
      //     maLongDays: modalEntryMaLongDays,
      //     maCrossOccurredDays: modalEntryMaCrossOccurredDays,
      //   };
      //   break;
      // case "macdGoldenCross":
      case "macdCrossover":
        if (
          !validateModalInput(modalEntryMacdShortEma, "短期EMA (X)") ||
          !validateModalInput(modalEntryMacdLongEma, "長期EMA (Y)") ||
          !validateModalInput(modalEntryMacdSignalEma, "シグナル線 (Z)") ||
          !validateModalInput(
            // modalEntryMacdGcOccurredDays,
            // "ゴールデンクロス発生日数 (D)"
            modalMacdCrossoverOccurredDays,
            `${
              transactionType === "long" ? "ゴールデン" : "デッド"
            }クロス発生日数 (D)`
          )
        )
          return;
        if (modalEntryMacdShortEma >= modalEntryMacdLongEma) {
          showCustomToast({
            message: "入力エラー",
            submessage: "MACDの短期EMAは長期EMAより小さくしてください。",
            type: "error",
          });
          return;
        }
        const macdCrossoverLabel =
          transactionType === "long"
            ? `MACD-GC (${modalEntryMacdShortEma}日-${modalEntryMacdLongEma}日-${modalEntryMacdSignalEma}日) が${modalMacdCrossoverOccurredDays}日間発生`
            : `MACD-DC (${modalEntryMacdShortEma}日-${modalEntryMacdLongEma}日-${modalEntryMacdSignalEma}日) が${modalMacdCrossoverOccurredDays}日間発生`;

        newOrUpdatedCondition = {
          id: conditionToEdit?.id || `entry_cond_${Date.now()}`,
          // type: "macdGoldenCross",
          // label: `MACD-GC (${modalEntryMacdShortEma}日-${modalEntryMacdLongEma}日-${modalEntryMacdSignalEma}日) が${modalEntryMacdGcOccurredDays}日間発生`,
          type: "macdCrossover",
          label: macdCrossoverLabel,
          macdShortEma: modalEntryMacdShortEma,
          macdLongEma: modalEntryMacdLongEma,
          macdSignalEma: modalEntryMacdSignalEma,
          macdCrossoverOccurredDays: modalMacdCrossoverOccurredDays,
        };
        break;
      case "macdZeroCrossover":
        if (
          !validateModalInput(modalEntryMacdShortEma, "短期EMA (X)") ||
          !validateModalInput(modalEntryMacdLongEma, "長期EMA (Y)") ||
          !validateModalInput(modalEntryMacdSignalEma, "シグナル線 (Z)") ||
          !validateModalInput(
            modalMacdZeroCrossoverOccurredDays,
            `ゼロライン${
              transactionType === "long" ? "上" : "下"
            }抜け継続日数 (D)`
          )
        )
          return;
        if (modalEntryMacdShortEma >= modalEntryMacdLongEma) {
          showCustomToast({
            message: "入力エラー",
            submessage: "MACDの短期EMAは長期EMAより小さくしてください。",
            type: "error",
          });
          return;
        }
        const macdZeroCrossoverLabel =
          transactionType === "long"
            ? `MACD線/シグナル線ゼロライン上抜け (${modalEntryMacdShortEma}日-${modalEntryMacdLongEma}日-${modalEntryMacdSignalEma}日) が${modalMacdZeroCrossoverOccurredDays}日間継続`
            : `MACD線/シグナル線ゼロライン下抜け (${modalEntryMacdShortEma}日-${modalEntryMacdLongEma}日-${modalEntryMacdSignalEma}日) が${modalMacdZeroCrossoverOccurredDays}日間継続`;

        newOrUpdatedCondition = {
          id: conditionToEdit?.id || `entry_cond_${Date.now()}`,
          // type: "macdDeadCross",
          // label: `MACD-DC (${modalEntryMacdShortEma}日-${modalEntryMacdLongEma}日-${modalEntryMacdSignalEma}日) が${modalEntryMacdGcOccurredDays}日間発生`,
          type: "macdZeroCrossover",
          label: macdZeroCrossoverLabel,
          macdShortEma: modalEntryMacdShortEma,
          macdLongEma: modalEntryMacdLongEma,
          macdSignalEma: modalEntryMacdSignalEma,
          macdZeroCrossoverOccurredDays: modalMacdZeroCrossoverOccurredDays,
        };
        break;
      default:
        hasModalError = true;
        showCustomToast({
          message: "入力エラー",
          submessage: "無効な条件タイプです。",
          type: "error",
        });
        return;
    }

    if (!hasModalError && newOrUpdatedCondition) {
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
            {conditionToEdit ? "入口サイン条件を編集" : "入口サイン条件を追加"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <Label
              htmlFor="modal-entry-condition-type"
              className="text-gray-700"
            >
              条件タイプ
            </Label>
            <Select
              value={modalEntryConditionType}
              onValueChange={(value) =>
                setModalEntryConditionType(value as EntryConditionType)
              }
              disabled={!!conditionToEdit}
            >
              <SelectTrigger id="modal-entry-condition-type" className="w-full">
                <SelectValue placeholder="条件タイプを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {/* {getFilteredEntryConditionTypes(transactionType).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))} */}
                {getEntryConditionTypes(transactionType).map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {modalEntryConditionType === "priceMovement" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="modal-entry-var-a-days"
                  className="text-gray-700"
                >
                  前提条件の日数 (A)
                </Label>
                <Input
                  id="modal-entry-var-a-days"
                  type="number"
                  value={modalEntryVariableADays}
                  onChange={(e) =>
                    setModalEntryVariableADays(Number(e.target.value))
                  }
                  min="1"
                  className="rounded-md"
                />
              </div>
              <div>
                <Label
                  htmlFor="modal-entry-var-b-percent"
                  className="text-gray-700"
                >
                  前提条件の{transactionType === "long" ? "上昇" : "下落"}率 (B)
                  (%)
                </Label>
                <Input
                  id="modal-entry-var-b-percent"
                  type="number"
                  value={modalEntryVariableBPercent}
                  onChange={(e) =>
                    setModalEntryVariableBPercent(Number(e.target.value))
                  }
                  step="0.1"
                  className="rounded-md"
                />
              </div>
            </div>
          )}

          {modalEntryConditionType === "maCrossover" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="modal-entry-ma-short-days"
                  className="text-gray-700"
                >
                  短期移動平均線日数 (A)
                </Label>
                <Input
                  id="modal-entry-ma-short-days"
                  type="number"
                  value={modalEntryMaShortDays}
                  onChange={(e) =>
                    setModalEntryMaShortDays(Number(e.target.value))
                  }
                  min="1"
                  className="rounded-md"
                />
              </div>
              <div>
                <Label
                  htmlFor="modal-entry-ma-long-days"
                  className="text-gray-700"
                >
                  長期移動平均線日数 (B)
                </Label>
                <Input
                  id="modal-entry-ma-long-days"
                  type="number"
                  value={modalEntryMaLongDays}
                  onChange={(e) =>
                    setModalEntryMaLongDays(Number(e.target.value))
                  }
                  min="1"
                  className="rounded-md"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label
                  htmlFor="modal-entry-ma-cross-occurred-days"
                  className="text-gray-700"
                >
                  {transactionType === "long"
                    ? "ゴールデンクロス"
                    : "デッドクロス"}
                  発生日数 (C)
                </Label>
                <Input
                  id="modal-entry-ma-cross-occurred-days"
                  type="number"
                  value={modalEntryMaCrossOccurredDays}
                  onChange={(e) =>
                    setModalEntryMaCrossOccurredDays(Number(e.target.value))
                  }
                  min="1"
                  className="rounded-md"
                />
              </div>
            </div>
          )}

          {(modalEntryConditionType === "macdCrossover" ||
            modalEntryConditionType === "macdZeroCrossover") && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="modal-entry-macd-short-ema"
                    className="text-gray-700"
                  >
                    短期EMA (X)
                  </Label>
                  <Input
                    id="modal-entry-macd-short-ema"
                    type="number"
                    value={modalEntryMacdShortEma}
                    onChange={(e) =>
                      setModalEntryMacdShortEma(Number(e.target.value))
                    }
                    min="1"
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="modal-entry-macd-long-ema"
                    className="text-gray-700"
                  >
                    長期EMA (Y)
                  </Label>
                  <Input
                    id="modal-entry-macd-long-ema"
                    type="number"
                    value={modalEntryMacdLongEma}
                    onChange={(e) =>
                      setModalEntryMacdLongEma(Number(e.target.value))
                    }
                    min="1"
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="modal-entry-macd-signal-ema"
                    className="text-gray-700"
                  >
                    シグナル線 (Z)
                  </Label>
                  <Input
                    id="modal-entry-macd-signal-ema"
                    type="number"
                    value={modalEntryMacdSignalEma}
                    onChange={(e) =>
                      setModalEntryMacdSignalEma(Number(e.target.value))
                    }
                    min="1"
                    className="rounded-md"
                  />
                </div>
              </div>
              {modalEntryConditionType === "macdCrossover" && (
                <div>
                  <Label
                    htmlFor="modal-entry-macd-crossover-occurred-days"
                    className="text-gray-700"
                  >
                    {transactionType === "long"
                      ? "ゴールデンクロス"
                      : "デッドクロス"}
                    発生日数 (D)
                  </Label>
                  <Input
                    id="modal-entry-macd-crossover-occurred-days"
                    type="number"
                    value={modalMacdCrossoverOccurredDays}
                    onChange={(e) =>
                      setModalMacdCrossoverOccurredDays(Number(e.target.value))
                    }
                    min="1"
                    className="rounded-md"
                  />
                </div>
              )}
              {modalEntryConditionType === "macdZeroCrossover" && (
                <div>
                  <Label
                    htmlFor="modal-entry-macd-zero-crossover-occurred-days"
                    className="text-gray-700"
                  >
                    ゼロライン{transactionType === "long" ? "上" : "下"}
                    抜け継続日数 (D)
                  </Label>
                  <Input
                    id="modal-entry-macd-zero-crossover-occurred-days"
                    type="number"
                    value={modalMacdZeroCrossoverOccurredDays}
                    onChange={(e) =>
                      setModalMacdZeroCrossoverOccurredDays(
                        Number(e.target.value)
                      )
                    }
                    min="1"
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
          )}

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
