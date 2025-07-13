"use client";
import React from "react";
import PlanResult from "./PlanResult";

interface ResultProps {
  id: string;
  // params: { portfolio_id: string };
}

const PagePlanResult = (props: ResultProps) => {
  // const curretnParams = await params;
  const { id } = props;
  return (
    <div>
      test
      <PlanResult planId={id}></PlanResult>
    </div>
  );
};

export default PagePlanResult;
