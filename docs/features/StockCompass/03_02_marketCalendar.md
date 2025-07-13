# すすめ方

- [ ] AppRouter設定
- [ ] Menu設定(スーパーユーザー、管理者のみ)
- [ ] 基本は一覧画面で、そこからもインポートできるようにする
- [ ] 削除の実装
- [ ] 実装の検証


# market_calendar
以下は、**株式市場の営業日管理用テーブル（PostgreSQL/Supabase用）**の設計案です。
---



## ✅ 営業日テーブル設計案 `market_calendar`

| 列名        | 型                 | 説明                       |
| --------- | ----------------- | ------------------------ |
| `date`    | `DATE` (PK)       | 対象日付（例: `2025-07-04`）    |
| `is_open` | `BOOLEAN`         | 営業日かどうか（true = 営業日）      |
| `note`    | `TEXT` (nullable) | 備考（例: "憲法記念日", "大発会" など） |

---

### 🎯 主な特徴とメリット

| 機能             | 内容                                        |
| -------------- | ----------------------------------------- |
| ✔ 主キー：`date`   | 日付ベースでユニークに判定                             |
| ✔ 高速検索         | `WHERE date = 'YYYY-MM-DD'` で営業日判定        |
| ✔ 将来の拡張性       | `note` を使って祝日名やイベント追加可能                   |
| ✔ 非営業日の理由も保存可能 | `is_open = false` かつ `note = '年末年始休業'` など |

---

## 🧩 利用例（SQLクエリ）

### ① 今日が営業日か？

```sql
SELECT is_open FROM market_calendar WHERE date = CURRENT_DATE;
```

### ② 次の営業日を探す

```sql
SELECT date FROM market_calendar
WHERE date > CURRENT_DATE AND is_open = true
ORDER BY date
LIMIT 1;
```

### ③ 過去30営業日分の取得

```sql
SELECT date FROM market_calendar
WHERE date <= CURRENT_DATE AND is_open = true
ORDER BY date DESC
LIMIT 30;
```

---

## 💾 テーブル作成SQL（PostgreSQL / Supabase用）

```sql
CREATE TABLE market_calendar (
    date DATE PRIMARY KEY,
    is_open BOOLEAN NOT NULL,
    note TEXT
);
```
### Supabaseの場合：

1. Supabase Studioにログイン
2. `market_calendar` テーブル作成
3. 「インポート」からCSVをアップロード → 自動マッピング


### 1. `ImportMarketCalendar`
- CSVテキストを貼り付けてインポート可能な画面
- 書式例：`date,is_open,note`  
  `2025-07-21,false,海の日`
- CSV内の日付の下限、日付の上限は土日は土日として落とす（要実装）
- CSV内の下限の日付が今日以降なら、今日から日付の上限まで、土日はＣｌｏｓｅとして落とす。
### 2. `MarketCalendarList`
- 指定年の営業日一覧を表示する画面
- 年の変更が可能、曜日と営業状況（Open / Close）を表示
- 間違い確認・メンテ用に色分けあり（非営業日は赤背景）

### TypeScript NextJSTailWindcss
``` ts
// market_calendar管理用UI（Next.js + TailwindCSS）

"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, getDay } from "date-fns";
import ja from "date-fns/locale/ja";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";

// 曜日表記用
const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"];

// CSVを貼り付け → DBへ登録画面
export function ImportMarketCalendar() {
  const [csvText, setCsvText] = useState("");
  const [message, setMessage] = useState("");

  const handleImport = async () => {
    try {
      const rows = csvText.trim().split("\n").slice(1); // skip header
      const data = rows.map((line) => {
        const [date, isOpen, note] = line.split(",");
        return { date, is_open: isOpen === "true", note };
      });
      const res = await fetch("/api/market-calendar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error("Import failed");
      setMessage("インポートに成功しました。");
    } catch (err) {
      console.error(err);
      setMessage("インポート中にエラーが発生しました。");
    }
  };

  return (
    <Card className="max-w-3xl mx-auto my-4">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-bold">営業日CSVインポート</h2>
        <Textarea
          rows={10}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="date,is_open,note\n2025-07-21,false,海の日"
        />
        <Button onClick={handleImport}>インポート実行</Button>
        {message && <p className="text-sm text-green-700">{message}</p>}
      </CardContent>
    </Card>
  );
}

// 一覧画面（年指定）
export function MarketCalendarList() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch(`/api/market-calendar?year=${year}`)
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, [year]);

  return (
    <Card className="max-w-5xl mx-auto my-8">
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <label>年指定：</label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">日付</th>
                <th className="p-2 border">曜日</th>
                <th className="p-2 border">備考</th>
                <th className="p-2 border">営業</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => {
                const dateObj = parseISO(r.date);
                const dow = dayOfWeek[getDay(dateObj)];
                return (
                  <tr key={r.date} className={r.is_open ? "" : "bg-red-50"}>
                    <td className="p-1 border">{format(dateObj, "yyyy.MM.dd")}</td>
                    <td className="p-1 border">{dow}</td>
                    <td className="p-1 border">{r.note || ""}</td>
                    <td className="p-1 border">{r.is_open ? "Open" : "Close"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
``` 
### 内閣府カレンダーCSV

こちらから
https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html

＞昭和30年（1955年）から令和8年（2026年）国民の祝日（csv形式：20KB）

```
1955/5/3,憲法記念日
1955/5/5,こどもの日
1955/9/24,秋分の日
1955/11/3,文化の日
1955/11/23,勤労感謝の日
1956/1/1,元日
1956/1/15,成人の日
1956/3/21,春分の日
1956/4/29,天皇誕生日
1956/5/3,憲法記念日
1956/5/5,こどもの日
1956/9/23,秋分の日
```

### 　指定された年の情報の取得
``` ts
// pages/api/market-calendar.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const year = parseInt(req.query.year as string)

  if (isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year' })
  }

  const from = new Date(`${year}-01-01`)
  const to = new Date(`${year}-12-31`)

  try {
    const records = await prisma.market_calendar.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    return res.status(200).json(records)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
```
