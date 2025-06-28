// simulation.ts
"use server";

import { ISimulationRequestParams } from "@/types/simulation";

// Step 1: バリデーション処理をインポート
import { setNameMemo, validateSimulationParams } from "./simulationValidate";
// Step 2: データ登録処理をインポート
import { registerSimulationData } from "./simulationRegistData";
import { createClient } from "@/util/supabase/server";

export async function registPlan(
  params: ISimulationRequestParams
): Promise<{ simulationId?: string; error?: string }> {
  const supabase = await createClient();

  // Step 1: 引数が妥当かどうかの評価 (Validate arguments)
  const validationError = validateSimulationParams(params);
  if (validationError) {
    return { error: validationError };
  }
  setNameMemo(params); //name memoが空白ならセットする。
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error("Failed to get user:", userError?.message);
    return { error: "認証情報が見つかりません。ログインしてください。" };
  }

  // Get user ID
  const userId = userData.user.id;

  let analysisConditionId: number | null = null;

  try {
    // Step 2: 引数をDBに登録 (Register arguments to DB)
    console.log("simulationRegistData.ts called");
    const registrationResult = await registerSimulationData(userId, params);

    if (registrationResult.error) {
      // registerSimulationData内で発生したエラーをそのまま返却
      return { error: registrationResult.error };
    }
    // analysisConditionIdを取得
    analysisConditionId = registrationResult.analysisConditionId || null;

    // analysisConditionIdが取得できなかった場合のエラーハンドリング
    if (analysisConditionId === null) {
      return {
        error: "プランの登録に失敗しました。(ID取得不可)",
      };
    }

    // // Step 3: 実施 (Execute) - Dummy for now
    // // ここに実際のシミュレーションロジックを呼び出す処理が入ります。
    // // 例えば、別のマイクロサービスへのAPIコールや、キューへのメッセージ送信など。
    // console.log(
    //   `--- Dummy Simulation Execution for Analysis ID: ${analysisConditionId} ---`
    // );
    // await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate work

    // // Step 4: 結果の返却 (Return result)
    return { simulationId: `sim_${analysisConditionId}` };
  } catch (error: unknown) {
    console.error("Unexpected error during runPlan:", error);
    const message = error instanceof Error ? error.message : String(error);
    // In a real scenario, you might want to clean up partially inserted data
    // if a transaction wasn't used or if an error occurred mid-way.
    return {
      error: `シミュレーション実行中に予期せぬエラーが発生しました: ${message}`,
    };
  }
}
