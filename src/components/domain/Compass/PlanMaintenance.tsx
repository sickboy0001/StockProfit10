// app/dashboard/plan-maintenance/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // For custom alert/confirm
import {
  DisplayPlan,
  getPlansForDisplay,
} from "@/app/actions/Compass/PlanActions";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import Link from "next/link"; // Next.jsのLinkコンポーネントをインポート
import { ModalSignalDetail } from "./ModalSignalDetail";
import { ModalPlanNameMemo } from "./ModalPlanNameMemo";
import { EditButton } from "@/components/ui/EditButton";

// // プランデータの型定義 (PostgreSQL関数の戻り値に合わせる)
// interface DisplayPlan {
//   id: number; // BIGINTはTypeScriptではnumberとして扱われることが多い
//   user_id: string; // UUID
//   user_name: string;
//   plan_name: string;
//   plan_memo: string | null;
//   is_active: boolean;
//   created_at: string;
//   updated_at: string;
//   stock_selection_name: string | null;
//   simulation_period_name: string | null;
//   simulation_start_date: string | null;
//   simulation_end_date: string | null;
//   trade_parameter_name: string | null;
//   signal_name: string | null;
//   transaction_type: string | null;
//   entry_signal_name: string | null;
//   exit_signal_name: string | null;
//   fee_tax_name: string | null;
//   // 利益率はシミュレーション結果から来るため、ここでは含めないか、別途取得する
//   profit_rate?: string; // Placeholder for display
// }

export default function PlanMaintenance() {
  const [showInactive, setShowInactive] = useState(false);
  const [isSimulationConfirmOpen, setIsSimulationConfirmOpen] = useState(false);
  const [planToSimulate, setPlanToSimulate] = useState<DisplayPlan | null>(
    null
  );
  const [signalDetailPlan, setSignalDetailPlan] = useState<DisplayPlan | null>(
    null
  );
  const [planToEditDetails, setPlanToEditDetails] =
    useState<DisplayPlan | null>(null);

  // const [editingSignalName, setEditingSignalName] = useState("");
  // const [isSaving, setIsSaving] = useState(false);

  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [simulationMessage, setSimulationMessage] = useState("");
  const [isSimulationMessageOpen, setIsSimulationMessageOpen] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // useEffect(() => {
  //   if (signalDetailPlan) {
  //     setEditingSignalName(signalDetailPlan.signal_name || "");
  //   }
  // }, [signalDetailPlan]);

  // プランデータをフェッチする関数 (PostgreSQL関数を呼び出す)
  useEffect(() => {
    const fetchPlans = async () => {
      // ユーザーがいない場合は何もしない
      if (user === null) {
        setPlans([]);
        return;
      }

      setIsLoading(true);
      setIsError(false);
      try {
        // Supabase RPC (Remote Procedure Call) を使用してPostgreSQL関数を呼び出す
        const result = await getPlansForDisplay(user.id);
        setPlans(result || []);
      } catch (e) {
        const err = e as Error;
        setIsError(true);
        setSimulationMessage(`プランの取得に失敗しました: ${err.message}`);
        setError(err.message); // 取得したエラーメッセージをstateに設定する
        setIsSimulationMessageOpen(true);
        console.error("プランの取得に失敗しました:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [user]);

  // シミュレーション実行のミューテーション

  // const handleToggleActive = (planId: number, currentStatus: boolean) => {
  //   // updatePlanStatusMutation.mutate({ id: planId, is_active: !currentStatus });
  // };

  const handleRunSimulationClick = (plan: DisplayPlan) => {
    setPlanToSimulate(plan);
    setIsSimulationConfirmOpen(true);
  };

  const confirmRunSimulation = () => {
    if (planToSimulate) {
      // runSimulationMutation.mutate(planToSimulate.id);
      setIsSimulationConfirmOpen(false);
      setPlanToSimulate(null);
    }
  };

  // シグナル名更新成功時のコールバック
  const handleSignalSaveSuccess = useCallback((updatedPlan: DisplayPlan) => {
    setPlans((prevPlans) =>
      prevPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    setSignalDetailPlan(null); // モーダルを閉じる
  }, []);

  const handlePlanDetailsSaveSuccess = useCallback(
    (updatedDetails: Pick<DisplayPlan, "id" | "plan_name" | "plan_memo">) => {
      setPlans((prevPlans) =>
        prevPlans.map((p) =>
          p.id === updatedDetails.id ? { ...p, ...updatedDetails } : p
        )
      );
      setPlanToEditDetails(null); // モーダルを閉じる
    },
    []
  );

  const handleShowMessage = useCallback((message: string) => {
    setSimulationMessage(message);
    setIsSimulationMessageOpen(true);
  }, []);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        プランを読み込み中...
      </div>
    );
  if (isError)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-red-600">
        プランの読み込みに失敗しました: {error}
      </div>
    );
  if (!plans || plans.length === 0)
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        まだプランがありません。新しいプランを作成してください。
      </div>
    );

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">
        計画の管理
      </h1>

      <div className="flex justify-between items-center mb-6">
        <Link href="/Compass/Condition/Setting">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            新規追加
          </Button>
        </Link>
        <div className="flex items-center">
          <Label
            htmlFor="show-inactive-plans"
            className="mr-3 text-lg font-medium text-gray-700"
          >
            無効なプランを表示
          </Label>
          <Switch
            id="show-inactive-plans"
            checked={showInactive}
            onCheckedChange={setShowInactive}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-blue-100">
            <TableRow className="text-gray-700">
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                操作
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                作成日時
              </TableHead>
              {/* <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                作成者
              </TableHead> */}
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                名前
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                メモ
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                銘柄選択
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                期間
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                取引条件
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                シグナル
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                利益率
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                有効/無効
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                アクション
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-100">
            {plans.map((ThisDisplayPlan) => (
              <TableRow
                key={ThisDisplayPlan.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">メニューを開く</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/results/${ThisDisplayPlan.id}`}>
                          結果参照
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/Compass/generatePlanResult/${ThisDisplayPlan.id}`}
                        >
                          シミュレーション実行
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/plans/edit/${ThisDisplayPlan.id}`}
                        >
                          編集
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/plans/new?from=${ThisDisplayPlan.id}`}
                        >
                          引用新規
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPlanToEditDetails(ThisDisplayPlan)}
                      >
                        名前/メモ編集
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {new Date(ThisDisplayPlan.created_at).toLocaleDateString(
                    "ja-JP"
                  )}
                </TableCell>
                {/* <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {ThisDisplayPlan.user_name || "不明"}
                </TableCell> */}
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {(() => {
                    const plan_name = ThisDisplayPlan.plan_name.trim();
                    return (
                      <div>
                        <span className="truncate">{plan_name}</span>
                        <EditButton
                          onClick={() => setPlanToEditDetails(ThisDisplayPlan)}
                        />
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="py-4 px-6 text-sm text-gray-700 max-w-xs">
                  {(() => {
                    const plan_memo = ThisDisplayPlan.plan_memo || "-";
                    return (
                      <div>
                        <span className="truncate">{plan_memo}</span>
                        <EditButton
                          onClick={() => setPlanToEditDetails(ThisDisplayPlan)}
                        />
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {ThisDisplayPlan.stock_selection_name || "-"}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {ThisDisplayPlan.simulation_period_name || "-"}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {ThisDisplayPlan.trade_parameter_name || "-"}
                </TableCell>
                <TableCell className="py-4 px-6 text-sm text-gray-700 max-w-[250px]">
                  <div>
                    {(() => {
                      const fullSignalText =
                        [
                          ThisDisplayPlan.signal_name,
                          ThisDisplayPlan.transaction_type &&
                            `(${ThisDisplayPlan.transaction_type})`,
                          ThisDisplayPlan.entry_signal_name &&
                            `(Entry: ${ThisDisplayPlan.entry_signal_name})`,
                          ThisDisplayPlan.exit_signal_name &&
                            `(Exit: ${ThisDisplayPlan.exit_signal_name})`,
                        ]
                          .filter(Boolean)
                          .join(" ") || "-";
                      return (
                        <>
                          <span className="truncate" title={fullSignalText}>
                            {fullSignalText}
                          </span>
                          <EditButton
                            onClick={() => setSignalDetailPlan(ThisDisplayPlan)}
                          />
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {ThisDisplayPlan.profit_rate || "-"}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700"></TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                  <Button
                    onClick={() => handleRunSimulationClick(ThisDisplayPlan)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
                    size="sm"
                    // disabled={runSimulationMutation.isPending}
                  >
                    {/* {runSimulationMutation.isPending
                      ? "実行中..."
                      : "プラン実行"} */}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* シミュレーション確認ダイアログ */}
      <AlertDialog
        open={isSimulationConfirmOpen}
        onOpenChange={setIsSimulationConfirmOpen}
      >
        <AlertDialogContent className="bg-white rounded-lg shadow-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">
              シミュレーション実行の確認
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-2">
              「{planToSimulate?.plan_name}
              」プランのシミュレーションを実行しますか？この操作は時間がかかる場合があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end space-x-3">
            <AlertDialogCancel className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRunSimulation}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              実行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* シグナル詳細モーダル */}
      {/* シグナル詳細モーダルを新しいコンポーネントとして呼び出す */}
      <ModalSignalDetail
        isOpen={!!signalDetailPlan}
        onClose={() => setSignalDetailPlan(null)}
        plan={signalDetailPlan}
        onSaveSuccess={handleSignalSaveSuccess}
        onShowMessage={handleShowMessage}
      />

      {/* プラン名/メモ編集モーダル */}
      <ModalPlanNameMemo
        isOpen={!!planToEditDetails}
        onClose={() => setPlanToEditDetails(null)}
        plan={planToEditDetails}
        onSaveSuccess={handlePlanDetailsSaveSuccess}
        onShowMessage={handleShowMessage}
      />

      {/* シミュレーション結果/エラーメッセージダイアログ */}
      <AlertDialog
        open={isSimulationMessageOpen}
        onOpenChange={setIsSimulationMessageOpen}
      >
        <AlertDialogContent className="bg-white rounded-lg shadow-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">
              通知
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-2">
              {simulationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end">
            <AlertDialogAction
              onClick={() => setIsSimulationMessageOpen(false)}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              閉じる
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
