import React from "react";
import ExecuteSettings from "./ExecuteSettings";

interface PageExecuteSettingsProps {
  id: string;
  // params: { portfolio_id: string };
}

const PageExecuteSettings = (props: PageExecuteSettingsProps) => {
  const { id } = props;

  return (
    <div>
      <ExecuteSettings planId={id}></ExecuteSettings>
    </div>
  );
};

export default PageExecuteSettings;
