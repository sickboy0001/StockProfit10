// components/AppLogFilter.tsx
"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterParams {
  startDate: Date | undefined;
  endDate: Date | undefined;
  level: string;
  searchText: string;
}

interface AppLogFilterProps {
  onFilterChange: (newFilters: FilterParams) => void;
  currentFilters: FilterParams;
  loading: boolean;
}

const AppLogFilter: React.FC<AppLogFilterProps> = ({
  onFilterChange,
  currentFilters,
  loading,
}) => {
  const [filters, setFilters] = useState<FilterParams>(currentFilters);

  const handleApplyFilter = () => {
    onFilterChange(filters);
  };

  const handleResetFilter = () => {
    const resetFilters = {
      startDate: undefined,
      endDate: undefined,
      level: "all",
      searchText: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-md border bg-gray-50 mb-6">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="level">ログレベル</Label>
        <Select
          value={filters.level}
          onValueChange={(value) => setFilters({ ...filters, level: value })}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全て" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="info">info</SelectItem>
            <SelectItem value="warn">warn</SelectItem>
            <SelectItem value="error">error</SelectItem>
            <SelectItem value="debug">debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="startDate">開始日</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.startDate && "text-muted-foreground"
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? (
                format(filters.startDate, "yyyy/MM/dd")
              ) : (
                <span>日付を選択</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.startDate}
              onSelect={(date) => setFilters({ ...filters, startDate: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="endDate">終了日</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.endDate && "text-muted-foreground"
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? (
                format(filters.endDate, "yyyy/MM/dd")
              ) : (
                <span>日付を選択</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.endDate}
              onSelect={(date) => setFilters({ ...filters, endDate: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="searchText">メッセージ/コンテキスト検索</Label>
        <Input
          id="searchText"
          placeholder="キーワードを入力"
          value={filters.searchText}
          onChange={(e) =>
            setFilters({ ...filters, searchText: e.target.value })
          }
          disabled={loading}
        />
      </div>

      <div className="col-span-1 md:col-span-4 flex justify-end gap-2 mt-4">
        <Button
          onClick={handleResetFilter}
          variant="outline"
          disabled={loading}
        >
          リセット
        </Button>
        <Button onClick={handleApplyFilter} disabled={loading}>
          検索
        </Button>
      </div>
    </div>
  );
};

export default AppLogFilter;
