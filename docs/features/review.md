[Top](../README.md)

# すすめ方
- **yahoo-finance2**の使い方見直す
- 無理ならj-quantsの利用視野に
- どちらにしてもCronの設定は必要かも。
  - UI経由でServerAction呼ぶこと

# 目的
- サーバーサイドで自動でデータを取得する動き
# 環境
- nextJs
- vercel
- supabase
# 処理内容
1. 株価でなく、企業にとっての株情報の収集（配当利回り、年初来高値、年初来安値、時価総額など）
2. その情報を特定のデータベース（Supabase）に保存

- 結果などは、別途ログに残すこと。メールなどの通知も現実的かと。
- クライアントでの処理でなく、サーバー（Vercel）ないで行う
- vercel+NextJSでAppRouterでのシステム構成
- パブリックな環境へのデプロイを想定
- 定期的にデータを取得し、結果を特定のDBへ保存する。


# 案
## Cron → AppRoute(NexJs) → ServerAction(serverSideAction) → Yf
- Yf株価ならいけるけど、ROEなど詳細な情報は難しい模様
## Cron → AppRoute(NexJs) → ServerAction(serverSideAction) → j-quants
- JQuoteなら現実感あり。ただしTokenの部分に関しては検討必要
## Cron → AppRoute(NexJs) → ServerAction(serverSideAction) → Rakuten
- Rukutenいまいちかと
## **NG** Cron → AppRoute(NexJs) → ServerAction(serverSideAction) → Tachibabna
- Matsuiが、Windowsアプリ必要の模様なので×
## **NG** Cron →  EdgeFunction(Vercel) → Python → Yf
- 現行だと、VercelにPython仕込んでEdgeFunctionがNG
## **NG** Cron → EdgeFunction(Vercel) → Python → j-quants
- 現行だと、VercelにPython仕込んでEdgeFunctionがNG



## 用語集
- Yf **yfinance API**
  - Pythonで株価や為替、主要な株式指数などの情報を取得できるライブラリ


| カテゴリ  | 取得内容の例                           |
| ----- | -------------------------------- |
| 株価    | 日足／週足／月足／分足（最大60日）               |
| 財務データ | 損益計算書（PL）、貸借対照表（BS）、キャッシュフロー（CF） |
| 株式指標  | PER、PBR、ROE、配当利回りなど（企業による）       |
| 企業情報  | セクター、業種、所在地、社員数、概要など             |
| 株主情報  | 大株主情報（可能な範囲で）                    |


- j-quants
  - 日本の株式情報開示可能なAPI
  - どこまで情報取れるかは不明
  - Free、課金で分かれてる。
    - Freeだと１４日前以前の株価（日単位）しか取得できない
    - 課金でも日単位のみ

| 項目             | 取得可否 / プラン条件         |
| -------------- | -------------------- |
| 日足株価（調整済・未調整）  | ✅ 無料プランで2年分（有料で最大履歴） |
| 前場・後場株価        | ✅ ライト以上              |
| BS/PL（四半期財務諸表） | ✅ プレミアムプラン必須         |
| ROE・PBR等の財務指標  | ❌ 直接取得できないが計算可能      |
| 決算予定日・配当など     | ✅ 多数の情報が包括されている      |
| 信用残・空売り関連      | ✅ 各種信用・投資統計取得可       |

- rakuten
- tachibana **立花証券 e‑支店 API**
  - Vercelでも利用可能の模様


| データ種別         | e支店APIで取得可？ |
| ------------- | ----------- |
| リアルタイム株価      | ✅           |
| 板情報           | ✅           |
| 日足履歴（過去20年）   | ✅           |
| 信用残・建玉・余力情報   | ✅           |
| ニュース          | ✅           |
| マスター情報        | ✅           |
| ROE・総資産など財務指標 | ❌ (非対応)     |


結論：Vercel + Next.js との相性が良いもの
j-quants API：RESTfulで、Next.js の API Routes と直接統合できるため、相性が非常に良い。

立花証券 e‑支店 API：RESTfulでサーバーレス環境で利用可能。API Routes で扱いやすい。

yfinance API：Python ライブラリであり、直接利用は難しい。別途 Python サーバーを用意する必要があり、Vercel のサーバーレス環境には相性が悪い。

## yahoo-finance2使えばJT,TSで利用可能の模様

https://www.npmjs.com/package/yahoo-finance2


const yahooFinance = require('yahoo-finance2').default;

// 企業のティッカーを指定
const ticker = 'AAPL';

// 財務データを取得
async function getFinancialData() {
  const data = await yahooFinance.quoteSummary(ticker, { modules: ['financialData'] });
  console.log(data.financialData);
}

getFinancialData();

`yahoo-finance2` ライブラリを使用して、Yahoo Financeから取得できる主な情報は以下の通りです。`yahoo-finance2`は、Yahoo Financeから株価データや企業の財務情報を取得するための非公式APIラッパーです。取得できる情報には、株価データ、企業の財務データ、アナリスト予測などがあります。

### 取得可能な情報

#### 1. **株価データ**

* **時価総額** (Market Cap)
* **株価** (Price)
* **1日高値/安値** (Day's Range)
* **52週高値/安値** (52 Week Range)
* **出来高** (Volume)
* **前日比** (Previous Close)
* **配当利回り** (Dividend Yield)

#### 2. **財務データ**

* **P/E比** (Price-to-Earnings Ratio)
* **EPS (Earnings Per Share)**：1株あたり利益
* **ROE (Return on Equity)**：自己資本利益率
* **P/B比** (Price-to-Book Ratio)
* **ROA (Return on Assets)**：総資産利益率
* **Revenue**：売上高
* **Operating Income**：営業利益
* **Net Income**：純利益
* **Debt-to-Equity Ratio**：負債比率
* **Book Value**：帳簿価値
* **EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)**

#### 3. **アナリスト情報**

* **アナリストの評価** (Analyst Rating)：売買、保有、売却の評価
* **目標株価** (Target Price)：アナリストが予想する目標株価
* **アナリストの意見** (Analyst Opinion)：強気、中立、弱気などの評価

#### 4. **財務諸表**

* **損益計算書** (Income Statement)

  * 売上高、営業利益、純利益、EPSなど
* **貸借対照表** (Balance Sheet)

  * 現金、負債、資本、資産など
* **キャッシュフロー計算書** (Cash Flow Statement)

  * 営業活動、投資活動、財務活動などのキャッシュフロー

#### 5. **株価履歴データ**

* **過去の株価データ**（日次、週次、月次）

  * 特定の日付範囲内の株価（Open、Close、High、Lowなど）
  * 特定の期間（例えば過去1週間、1ヶ月、1年など）のデータを取得

#### 6. **企業情報**

* **企業名** (Company Name)
* **ティッカーシンボル** (Ticker Symbol)
* **業種** (Industry)
* **セクター** (Sector)
* **所在地** (Address)

### 使用例

以下に、`yahoo-finance2` ライブラリを使って、企業の財務データや株価データを取得する基本的なコード例を示します。

#### 株価情報と財務データの取得

```javascript
const yahooFinance = require('yahoo-finance2').default;

// 企業のティッカーシンボルを指定
const ticker = 'AAPL'; // Appleのティッカー

// 株価情報を取得
async function getStockData() {
  const data = await yahooFinance.quote(ticker);
  console.log("株価情報:", data);
}

// 財務データを取得
async function getFinancialData() {
  const data = await yahooFinance.quoteSummary(ticker, { modules: ['financialData'] });
  console.log("財務データ:", data.financialData);
}

// 実行
getStockData();
getFinancialData();
```

#### 取得されるデータ例

1. **株価情報（例: AAPL）**

```json
{
  "symbol": "AAPL",
  "regularMarketPrice": 145.64,
  "regularMarketDayHigh": 146.35,
  "regularMarketDayLow": 144.30,
  "regularMarketVolume": 55611289,
  "marketCap": 2427800000000,
  "previousClose": 144.60
}
```

2. **財務データ（例: AAPL）**

```json
{
  "financialData": {
    "marketCap": 2427800000000,
    "trailingPE": 27.34,
    "forwardPE": 24.52,
    "pegRatio": 2.48,
    "priceToBook": 33.14,
    "returnOnEquity": 0.84,
    "revenue": 365817000000,
    "operatingIncome": 108948000000,
    "netIncome": 94680000000
  }
}
```

### まとめ

`yahoo-finance2`ライブラリを使うことで、Yahoo Financeから様々なデータを取得できます。特に、株価、財務データ、アナリスト情報、企業情報などの取得が可能です。この情報をNext.jsのAPI Routesで簡単に取得し、フロントエンドで表示することができます。

* **株価情報**（時価総額、日足高値安値、出来高など）
* **財務指標**（P/E比、EPS、ROEなど）
* **アナリストの評価**（目標株価、評価など）
* **過去の株価データ**



