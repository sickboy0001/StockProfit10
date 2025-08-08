"use client";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";
import Link from "next/link"; // Next.jsのLinkコンポーネントをインポート
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getAllExecuteSettings } from "@/app/actions/Execute/ExecutionDb";
import { ExecuteSetting } from "@/types/db/ExecuteSetting";

/*
          analysis_condition_id: planId,
          name: name,
          start_date: startDate,
          end_date: endDate,
          is_auto_enabled: isAutoEnabled,
          is_active: true, // 既存のレコードもアクティブに設定
          send_mail_to: sendMailTo === "" ? null : sendMailTo,
 */

/**
 * 現在の日時を "YYYY-MM-DDTHH:mm" 形式の文字列で取得します。
 * `datetime-local` inputのvalueに適した形式です。
 * @param date 変換するDateオブジェクト（デフォルトは現在時刻）
 * @returns フォーマットされた日時文字列
 */
const getLocalDateTimeString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const ExecuteSettingMaintenance = () => {
  const [showInactive, setShowInactive] = useState(false);
  const [isSimulationConfirmOpen, setIsSimulationConfirmOpen] = useState(false);

  // 実行モーダルのためのState
  const [isRunModalOpen, setRunModalOpen] = useState(false);
  const [settingToRun, setSettingToRun] = useState<ExecuteSetting | null>(null);
  const [isTargetAll, setIsTargetAll] = useState(true);
  const [targetDate, setTargetDate] = useState<string>(
    getLocalDateTimeString()
  );

  const [executeSettings, setExecuteSettings] = useState<
    ExecuteSetting[] | null
  >(null);

  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // プランデータをフェッチする関数 (PostgreSQL関数を呼び出す)
  useEffect(() => {
    const fetchExecuteSettings = async () => {
      // ユーザーがいない場合は何もしない
      if (user === null) {
        setExecuteSettings([]);
        return;
      }

      setIsLoading(true);
      setIsError(false);
      try {
        // Supabase RPC (Remote Procedure Call) を使用してPostgreSQL関数を呼び出す
        const result = await getAllExecuteSettings();
        setExecuteSettings(result || []);
      } catch (e) {
        const err = e as Error;
        setIsError(true);
        setError(err.message); // 取得したエラーメッセージをstateに設定する
        console.error("プランの取得に失敗しました:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExecuteSettings();
  }, [user]);

  const handleRunExecute = (executeSetting: ExecuteSetting) => {
    setSettingToRun(executeSetting);
    setRunModalOpen(true);
  };

  const confirmAndRunExecution = () => {
    if (!settingToRun) return;

    console.log("--- 実行オプション ---");
    console.log("実行対象の設定ID:", settingToRun?.id);
    console.log("実行対象の設定Name:", settingToRun?.name);
    console.log("すべて対象:", isTargetAll);
    console.log("対象送信日時:", targetDate);
    console.log("--------------------");

    // モーダルを閉じてStateをリセット
    setRunModalOpen(false);
    setSettingToRun(null);
    setIsTargetAll(true);
    setTargetDate(getLocalDateTimeString());
  };

  // const confirmRunSimulation = () => {
  //   if (planToSimulate) {
  //     // runSimulationMutation.mutate(planToSimulate.id);
  //     setIsSimulationConfirmOpen(false);
  //     setPlanToSimulate(null);
  //   }
  // };

  // // シグナル名更新成功時のコールバック
  // const handleSignalSaveSuccess = useCallback((updatedPlan: DisplayPlan) => {
  //   setPlans((prevPlans) =>
  //     prevPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
  //   );
  //   setSignalDetailPlan(null); // モーダルを閉じる
  // }, []);

  // const handlePlanDetailsSaveSuccess = useCallback(
  //   (updatedDetails: Pick<DisplayPlan, "id" | "plan_name" | "plan_memo">) => {
  //     setPlans((prevPlans) =>
  //       prevPlans.map((p) =>
  //         p.id === updatedDetails.id ? { ...p, ...updatedDetails } : p
  //       )
  //     );
  //     setPlanToEditDetails(null); // モーダルを閉じる
  //   },
  //   []
  // );

  // const handleShowMessage = useCallback((message: string) => {
  //   setSimulationMessage(message);
  //   setIsSimulationMessageOpen(true);
  // }, []);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        実行設定を読み込み中...
      </div>
    );
  if (isError)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-red-600">
        実行設定（sptce_execute_settings）の読み込みに失敗しました: {error}
      </div>
    );
  if (!executeSettings || executeSettings.length === 0)
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        実行設定（sptce_execute_settings）がありません、新しい実行設定を作成してください。
      </div>
    );

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen rounded-lg shadow-lg">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">
        実行設定の管理
      </h1>

      <div className="flex justify-between items-center mb-6">
        {/* <Link href="/Compass/Condition/Setting">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            新規追加
          </Button>
        </Link> */}
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
                更新日時
              </TableHead>
              {/* <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                作成者
              </TableHead> */}
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                名前
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                期間
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                mail送信先
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                シミュレーションON/OFF
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                有効/無効
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                作成日
              </TableHead>
              <TableHead className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">
                アクション
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-100">
            {executeSettings.map((thisExecuteSetting) => (
              <TableRow
                key={thisExecuteSetting.id}
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
                        <Link
                          href={`/Execute/Settings/${thisExecuteSetting.analysis_condition_id}`}
                        >
                          編集
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator></DropdownMenuSeparator>
                      <DropdownMenuItem
                        onClick={() => handleRunExecute(thisExecuteSetting)}
                        className="cursor-pointer"
                      >
                        テスト実行
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {new Date(thisExecuteSetting.updated_at).toLocaleString(
                    "ja-JP"
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {thisExecuteSetting.name || "不明"}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {new Date(thisExecuteSetting.start_date).toLocaleDateString(
                    "ja-JP"
                  )}
                  -
                  {new Date(thisExecuteSetting.end_date).toLocaleDateString(
                    "ja-JP"
                  )}
                  {/* {thisExecuteSetting.stock_selection_name || "-"} */}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {thisExecuteSetting.send_mail_to || "-"}
                </TableCell>

                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {thisExecuteSetting.is_auto_enabled ? "ON" : "OFF"}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {thisExecuteSetting.is_active ? "active" : "-"}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                  {new Date(thisExecuteSetting.created_at).toLocaleDateString(
                    "ja-JP"
                  )}
                  {/* {thisExecuteSetting.stock_selection_name || "-"} */}
                </TableCell>
                <TableCell className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                  <Button
                    onClick={() => handleRunExecute(thisExecuteSetting)}
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
              シミュレーション実行の確認 {settingToRun?.name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-2">
              {/* 「{planToSimulate?.plan_name} */}
              」プランのシミュレーションを実行しますか？この操作は時間がかかる場合があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end space-x-3">
            <AlertDialogCancel className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
              キャンセル
            </AlertDialogCancel>
            {/* <AlertDialogAction
              onClick={confirmRunSimulation}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              実行
            </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 実行オプションモーダル */}
      <AlertDialog open={isRunModalOpen} onOpenChange={setRunModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              「{settingToRun?.name}」の実行オプション
            </AlertDialogTitle>
            <AlertDialogDescription>
              実行する対象を選択してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="target-all"
                checked={isTargetAll}
                onCheckedChange={(checked) => setIsTargetAll(!!checked)}
              />
              <Label htmlFor="target-all">すべて対象</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">実施日時</Label>
              <Input
                id="target-date"
                type="datetime-local"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndRunExecution}>
              テスト実行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
      // open={isSimulationMessageOpen}
      // onOpenChange={setIsSimulationMessageOpen}
      >
        <AlertDialogContent className="bg-white rounded-lg shadow-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-gray-800">
              通知
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-2">
              {/* {simulationMessage} */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end">
            <AlertDialogAction
              // onClick={() => setIsSimulationMessageOpen(false)}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              閉じる
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExecuteSettingMaintenance;
