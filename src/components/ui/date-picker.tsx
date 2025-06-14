// src/components/ui/date-picker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale"; // 日本語ロケールをインポート
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils"; // shadcn/uiのユーティリティ
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // 上記で作成したCalendarコンポーネント
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  selectedDate,
  onDateChange,
  placeholder,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal", // 親コンポーネントのレイアウトに合わせて幅を調整
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP", { locale: ja })
          ) : (
            <span>{placeholder || "日付を選択"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateChange}
          initialFocus
          locale={ja}
        />
      </PopoverContent>
    </Popover>
  );
}
