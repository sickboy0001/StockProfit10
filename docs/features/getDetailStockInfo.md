[Top](../README.md)

### 📊 株式投資の参考指標一覧

| 指標名                | 値（または説明）             | 補足・算出式など    | 用途・意義            | 優先度 |
| ------------------ | -------------------- | ----------- | ---------------- | --- |
| **時価総額**           | 990,024百万円 (10:21)   | 株価 × 発行済株式数 | 企業規模の把握          | 高   |
| **発行済株式数**         | 581,000,000株 (06/11) | -           | 時価総額・EPS等の計算に使用  | 高   |
| **配当利回り（会社予想）**    | 2.46% (10:21)        | 年間配当 ÷ 株価   | 配当重視の投資判断        | 高   |
| **1株配当（会社予想）**     | 42.00円 (2026/03)     | 年間配当予定額     | 配当金の予測           | 高   |
| **PER（会社予想）**      | (連)17.01倍 (10:21)    | 株価 ÷ EPS    | 割安・割高の目安         | 高   |
| **PBR（実績）**        | (連)1.38倍 (10:21)     | 株価 ÷ BPS    | 純資産に対する株価の倍率     | 高   |
| **EPS（会社予想）**      | (連)100.17円 (2026/03) | 1株あたり利益     | 収益力の指標、PER計算にも使用 | 高   |
| **BPS（実績）**        | (連)1,233.27円         | 1株あたり純資産    | PBR計算に使用         | 高   |
| **ROE（実績）**        | (連)7.76%             | 純利益 ÷ 自己資本  | 株主視点の収益性         | 高   |
| **自己資本比率（実績）**     | (連)35.3%             | 自己資本 ÷ 総資産  | 財務健全性の指標         | 高   |
| **最低購入代金**         | 170,400円 (10:21)     | 株価 × 単元株数   | 投資コストの目安         | 高   |
| **単元株数**           | 100株                 | -           | 売買単位の確認          | 高   |
| **年初来高値**          | 2,125円 (25/04/23)    | -           | 株価上限の目安          | 高   |
| **年初来安値**          | 1,594円 (25/01/06)    | -           | 株価下限の目安          | 高   |
| **営業利益（EBIT）**     | 利益の源泉                | 売上高－費用      | 本業の利益力           | 中   |
| **営業利益率**          | 営業利益 ÷ 売上高           | %表示         | 利益体質の強さ          | 中   |
| **フリーキャッシュフロー**    | 実際に使える現金             | 営業CF－投資CF   | 財務余力・還元力         | 中   |
| **ROA（総資産利益率）**    | 純利益 ÷ 総資産            | %表示         | 経営効率性の確認         | 中   |
| **流動比率**           | 流動資産 ÷ 流動負債          | ×100%       | 短期支払能力           | 中   |
| **当期純利益**          | 最終的な利益               | 売上総利益－全費用   | EPSの源            | 中   |
| **配当性向**           | 配当 ÷ 純利益             | %表示         | 利益配分方針の確認        | 中   |
| **PEGレシオ**         | PER ÷ 予想成長率          | 低いと割安感あり    | 成長性と割安性のバランス     | 中   |
| **ベータ値（β）**        | 株価の市場連動性             | 1以上：市場より変動大 | リスク評価            | 中   |
  | **インタレストカバレッジレシオ** | 営業利益 ÷ 支払利息          | 高い方が安心      | 借入返済余力           | 中   |
| **短期借入金 / 長期負債**   | 借入の内訳                | 構成バランス      | 借入の安定性分析         | 中   |

---


ご依頼の要件に基づき、サーバーサイドの `Action/getCompanyStockDetail` にて、次のようなフローを想定した処理を実装することができます。

---

### ✅ 処理フロー概要：`getCompanyStockDetail`

1. **株式コード（ticker）を引数として受け取る**
2. **`spt_company_stock_details` テーブルを参照**

   * 当日のデータが存在すれば、そのまま返却。
3. **データが存在しない、または更新日時が古い場合（前日以前）**

   * YahooFinance2 API から最新情報を取得。
   * `spt_company_stock_details` テーブルを更新（INSERT or UPSERT）。
   * 最新データを返却。

---

### 🏗️ テーブル構造（`spt_company_stock_details`）


### 💡 取得・更新処理のTypeScript例（Next.jsのAction関数）


<details><summary>TypeScript</summary>


```ts
// app/api/getCompanyStockDetail/route.ts (または適切なアクションファイル src/app/actions/company.actions.ts など)
"use server"; // Next.js Server Actionとしてマークする場合

import { createClient } from "@/util/supabase/server"; // Supabaseクライアントのインポートパスを実際のプロジェクトに合わせてください
import { fetchStockFromYahoo } from "@/lib/yahoo"; // Yahoo Financeからデータを取得する関数 (これは既存のものを利用)

// spt_company_stock_details テーブルの型定義 (実際のカラムに合わせて調整してください)
interface CompanyStockDetail {
  code: string;
  market_cap?: number | null;
  issued_shares?: number | null;
  div_yield?: number | null;
  dividend?: number | null;
  per?: number | null;
  pbr?: number | null;
  eps?: number | null;
  bps?: number | null;
  roe?: number | null;
  equity_ratio?: number | null;
  min_price?: number | null;
  unit_shares?: number | null;
  high_price_ytd?: number | null;
  low_price_ytd?: number | null;
  updated_at: string; // YYYY-MM-DD
  // fetchStockFromYahooから返されるが、テーブルスキーマに含まれない可能性のある追加フィールド
  // [key: string]: any;
}

export async function getCompanyStockDetail(
  code: string
): Promise<CompanyStockDetail | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 既存データを取得
  const { data: existingData, error: fetchError } = await supabase
    .from("spt_company_stock_details")
    .select("*")
    .eq("ticker", ticker)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116は「行が見つからない」エラーで、この場合は問題ない（新規作成される）
    console.error(
      `Error fetching existing stock detail for ${ticker}:`,
      fetchError
    );
    throw new Error(
      `既存の株式詳細データの取得中にエラーが発生しました: ${fetchError.message}`
    );
  }

  const existing = existingData as CompanyStockDetail | null;

  // updated_at が DATE 型で YYYY-MM-DD 形式の文字列として返されると仮定
  if (existing && existing.updated_at === today) {
    console.log(
      `Returning existing, up-to-date stock detail for ${ticker} from DB.`
    );
    return existing;
  }

  // 最新データ取得
  console.log(
    `Fetching latest stock detail for ${ticker} from Yahoo Finance.`
  );
  const latest = await fetchStockFromYahoo(ticker); // fetchStockFromYahooはCompanyStockDetailの一部または互換性のある型を返すと仮定
  if (!latest) {
    console.error(`Failed to fetch latest stock detail for ${ticker}.`);
    throw new Error("最新の株式詳細データの取得に失敗しました。");
  }

  // DBを更新（UPSERT）
  // `latest` オブジェクトには `updated_at: today` が含まれていることを期待
  // また、`ticker` も含める必要がある
  const dataToUpsert: CompanyStockDetail = {
    ticker, // tickerを明示的に含める
    ...(latest as Omit<CompanyStockDetail, "ticker">), // latestの型を調整
    updated_at: today, // 念のため上書き、またはlatestがこれを含んでいることを確認
  };

  console.log(`Upserting stock detail for ${ticker} into DB.`);
  const { data: upsertedData, error: upsertError } = await supabase
    .from("spt_company_stock_details")
    .upsert(dataToUpsert, { onConflict: "ticker" })
    .select() // upsert後にデータを返したい場合
    .single(); // 1行だけ更新/挿入されるはず

  if (upsertError) {
    console.error(`Error upserting stock detail for ${ticker}:`, upsertError);
    throw new Error(
      `株式詳細データの更新中にエラーが発生しました: ${upsertError.message}`
    );
  }

  console.log(`Successfully upserted stock detail for ${ticker}.`);
  // upsertedData が null の場合も考慮 (例: RLSでselect権限がない場合など)
  // 基本的には upsert したデータ (latest に基づく) を返すのが適切
  return upsertedData || dataToUpsert;
}
```

</details>


---

### 🧩 YahooFinance2からの取得処理の例

```ts
// lib/yahoo.ts
export async function fetchStockFromYahoo(ticker: string) {
  const res = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData`);
  const json = await res.json();

  // ここでJSONをパースして必要な値に変換
  const data = json.quoteSummary.result[0];

  return {
    market_cap: data.defaultKeyStatistics.marketCap?.raw / 1_000_000 ?? null, // 百万円
    issued_shares: data.defaultKeyStatistics.sharesOutstanding?.raw ?? null,
    div_yield: data.summaryDetail.dividendYield?.raw * 100 ?? null, // %
    dividend: data.summaryDetail.dividendRate?.raw ?? null,
    per: data.summaryDetail.trailingPE?.raw ?? null,
    pbr: data.defaultKeyStatistics.priceToBook?.raw ?? null,
    eps: data.defaultKeyStatistics.trailingEps?.raw ?? null,
    bps: data.defaultKeyStatistics.bookValue?.raw ?? null,
    roe: data.financialData.returnOnEquity?.raw * 100 ?? null, // %
    equity_ratio: data.financialData.quickRatio?.raw ?? null, // ※QuickRatio を仮で使用。要調整
    min_price: data.price.regularMarketPrice?.raw * 100 ?? null, // 単元株数100株前提
    unit_shares: data.price.sharesPerMarketCap?.raw ?? 100, // 仮のフィールド。必要に応じて補完
    high_price_ytd: data.summaryDetail.fiftyTwoWeekHigh?.raw ?? null,
    low_price_ytd: data.summaryDetail.fiftyTwoWeekLow?.raw ?? null,
    // 以下は追加で参考になる値（必要に応じてDBスキーマも拡張）
    roa: data.financialData.returnOnAssets?.raw * 100 ?? null, // %
    operating_margin: data.financialData.operatingMargins?.raw * 100 ?? null, // %
    free_cash_flow: data.financialData.freeCashflow?.raw / 1_000_000 ?? null, // 百万円
    interest_coverage: data.financialData.ebitda?.raw / data.financialData.interestExpense?.raw ?? null,
    beta: data.defaultKeyStatistics.beta?.raw ?? null,
    peg_ratio: data.defaultKeyStatistics.pegRatio?.raw ?? null,
    updated_at: new Date().toISOString().slice(0, 10),
  };
}
```

---

### 🔐 注意点

* `ticker` をユニークキーに設定。
* `updated_at` にインデックスを貼ることで取得高速化。
* `fetchStockFromYahoo` では、API制限やnullチェックが必要。

##　YahooFinance2で取得できるもの
主なモジュールとその中身
|モジュール名|	説明|	取得できる指標例|
|-|-|-|
|defaultKeyStatistics|	財務比率や発行株式関連|	✅ priceToBook, sharesOutstanding, enterpriseValue, pegRatio|
|financialData|	損益・キャッシュフロー関連|	✅ ebitda, grossMargins, returnOnEquity, freeCashflow, totalDebt|
|summaryDetail|	株価・配当・利回りなど|	✅ dividendYield, trailingPE, marketCap, beta|
|price|	株価と取引市場|	✅ regularMarketPrice, currency, exchangeName|
|incomeStatementHistory|	過去の損益計算書（年度）|	✅ totalRevenue, netIncome, costOfRevenue|
|balanceSheetHistory|	過去のバランスシート（年度）|	✅ totalAssets, totalLiabilities, totalStockholderEquity|


---


https://github.com/gadicc/node-yahoo-finance2


## 🎯 実用面で特におすすめ

以下は、特に**スクリーニングや投資判断で有用**な指標です：

* **PEGレシオ（成長考慮したPER）**
* **フリーキャッシュフロー（財務の健全性）**
* **ROE（株主視点の効率性）**
* **営業利益率（利益構造）**
* **配当性向（配当の持続性）**
* **ベータ値（リスク）**

