import React from "react";
import ImportMarketCalendar from "./ImportMarketCalendar";
import { MarketCalendarList } from "./MarketCalendarList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MarketCalendar = () => {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">カレンダー一覧</TabsTrigger>
          <TabsTrigger value="import">CSVインポート</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <MarketCalendarList />
        </TabsContent>
        <TabsContent value="import">
          <ImportMarketCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketCalendar;
