import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  getPlanDetailsAll,
  PlanDetailsAll,
} from "@/app/actions/Compass/PlanActions";

interface PlanResultConditionProps {
  planId: string;
}

const PlanResultCondition: React.FC<PlanResultConditionProps> = ({
  planId,
}) => {
  const [planData, setPlanData] = useState<PlanDetailsAll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      const result = await getPlanDetailsAll(Number(planId));
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setPlanData(result.data);
      setLoading(false);
    };
    fetch();
  }, [planId]);
  if (
    planData === null ||
    planData.plan === null ||
    planData.simulationPeriod === null
  ) {
    return <div>no-data</div>;
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg">
        エラー: {error}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg">データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">プラン情報</h3>
      <div className="space-y-2 text-gray-700">
        <p>
          <strong>プラン名:</strong> {planData.plan.name}
        </p>
        <p>
          <strong>検証期間:</strong>{" "}
          {format(new Date(planData.simulationPeriod.start_date), "yyyy/MM/dd")}{" "}
          - {format(new Date(planData.simulationPeriod.end_date), "yyyy/MM/dd")}
        </p>
        <p>
          <strong>使用された市場:</strong> 東証プライム
        </p>{" "}
        {/* 仮の値 */}
        <p>
          <strong>エントリー条件:</strong>{" "}
          {planData.entrySignal?.conditions_json
            ? JSON.stringify(planData.entrySignal.conditions_json)
            : "未設定"}
        </p>
        <p>
          <strong>エグジット条件:</strong>{" "}
          {planData.exitSignal?.conditions_json
            ? JSON.stringify(planData.exitSignal.conditions_json)
            : "未設定"}
        </p>
        <p>
          <strong>資金管理ルール:</strong>{" "}
          {planData.tradeParameter?.max_purchase_amount || "未設定"}
        </p>{" "}
      </div>
    </div>
  );
};

export default PlanResultCondition;
