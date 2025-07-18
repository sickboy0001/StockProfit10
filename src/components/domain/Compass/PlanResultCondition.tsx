import React from "react";
import PlanDisp from "./PlanDisp";

interface PlanResultConditionProps {
  planId: string;
}

const PlanResultCondition: React.FC<PlanResultConditionProps> = ({
  planId,
}) => {
  // const [planData, setPlanData] = useState<PlanDetailsAll | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetch = async () => {
  //     setLoading(true);
  //     setError(null);
  //     const result = await getPlanDetailsAll(Number(planId));
  //     if (result.error) {
  //       setError(result.error);
  //       setLoading(false);
  //       return;
  //     }
  //     setPlanData(result.data);
  //     setLoading(false);
  //   };
  //   fetch();
  // }, [planId]);
  // if (
  //   planData === null ||
  //   planData.plan === null ||
  //   planData.simulationPeriod === null
  // ) {
  //   return <div>no-data</div>;
  // }
  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center h-screen text-red-600 text-lg">
  //       エラー: {error}
  //     </div>
  //   );
  // }
  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  //       <p className="ml-4 text-lg">データを読み込み中...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="p-4">
      <PlanDisp id={planId}></PlanDisp>
    </div>
  );
};

export default PlanResultCondition;
