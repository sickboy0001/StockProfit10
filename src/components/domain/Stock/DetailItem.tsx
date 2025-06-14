// src/components/domain/Stock/DetailItem.tsx
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DetailItemProps {
  label: string;
  value: string;
  description?: string;
  unit?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  description = "",
  unit,
}) => {
  return (
    <div className={`flex justify-between items-center pr-4`}>
      {description ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <strong className="text-gray-600 cursor-help">{label}:</strong>
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <p className="whitespace-pre-wrap max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                {description}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <strong className="text-gray-600">{label}:</strong>
      )}
      <span className="text-right">
        {value}
        {unit && value !== "情報なし" ? ` ${unit}` : ""}
      </span>
    </div>
  );
};

export default DetailItem;
