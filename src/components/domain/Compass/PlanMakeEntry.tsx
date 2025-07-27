"use client";
import React, { useEffect, useState } from "react";
import PlanMake from "./PlanMake";
import {
  getLastPlanDetailsAll,
  PlanDetailsAll,
} from "@/app/actions/Compass/PlanActions";
import { useAuth } from "@/contexts/AuthContext";

const PlanMakeEntry = () => {
  const [initialPlan, setInitialPlan] = useState<PlanDetailsAll | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) {
        return;
      }
      setIsLoading(true);
      // console.log("palnmakeentry:", user);
      const result = await getLastPlanDetailsAll(user.id);
      console.log("palnmakeentry. result.data:", result.data);
      console.log(
        "palnmakeentry. result.data:",
        result.data?.simulationPeriod?.start_date
      );
      setInitialPlan(result.data);
      setIsLoading(false);
    };
    fetch();
  }, [user]);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg">データを読み込み中...</p>
      </div>
    );
  }
  return (
    <div>
      {/* //initialPlan={initialPlan} */}
      <PlanMake initialPlan={initialPlan}></PlanMake>
    </div>
  );
};

export default PlanMakeEntry;
