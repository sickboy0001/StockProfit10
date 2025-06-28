[Top](./README.md)

# データ設計（外部的な観点）

## 1. 主要エンティティとデータ項目
### テーブル作成時共通の処理

- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
- RLS (Row Level Security) を無効にする場合はここで設定

<details>
<summary>common_query</summary>

```sql
-- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
-- RLS (Row Level Security) を無効にする場合はここで設定
ALTER TABLE public.ｘｘｘｘ DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO anon;
GRANT USAGE ON SCHEMA "public" TO authenticated;

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;
```

</details>


### spt_daily_quotes

| カラム名        | 型           | 補足                |
| ----------- | ----------- | ----------------- |
| code        | `text`      | 銘柄コード（例: 7203）PK  |
| date        | `date`      | 日付（例: 2024-06-01）PK|
| open        | `numeric`   | 始値                |
| high        | `numeric`   | 高値                |
| low         | `numeric`   | 安値                |
| close       | `numeric`   | 終値                |
| volume      | `bigint`    | 出来高               |
| created_at | `timestamp` | データ挿入日時（自動）       |


```sql
CREATE TABLE spt_daily_quotes (
    code TEXT NOT NULL,
    date DATE NOT NULL,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (code, date) -- こちらに変更
);
```

### spt_stock_view_history
| カラム名   | 型                       | 補足                                                                              | 
| ---------- | ------------------------ | --------------------------------------------------------------------------------- | 
| id         | BIGSERIAL                | 主キー。参照履歴の一意な識別子。自動採番。                                        | 
| user_id    | UUID                     | 参照したユーザーのID。stock_user テーブルの id を参照。                           | 
| stock_code | TEXT                     | 参照した銘柄のコード。spt_daily_quotes または spt_stocks テーブルの code を参照。 | 
| viewed_at  | TIMESTAMP WITH TIME ZONE | 銘柄が参照された日時。自動的に現在日時が設定されます。                            | 

<details>
<summary>creat:spt_stock_view_history</summary>


```sql
CREATE TABLE spt_stock_view_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES stock_user(id) ON DELETE CASCADE NOT NULL,
    stock_code TEXT NOT NULL, -- spt_daily_quotes or spt_stocks の code を参照
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

GRANT USAGE ON SEQUENCE spt_stock_view_history_id_seq TO authenticated;

-- インデックスを追加して検索パフォーマンスを向上
CREATE INDEX idx_spt_stock_view_history_user_id ON spt_stock_view_history (user_id);
CREATE INDEX idx_spt_stock_view_history_stock_code ON spt_stock_view_history (stock_code);
CREATE INDEX idx_spt_stock_view_history_viewed_at ON spt_stock_view_history (viewed_at DESC);

-- RLS (Row Level Security) を有効にする場合はここで設定
ALTER TABLE public.spt_stock_view_history DISABLE ROW LEVEL SECURITY;

```
</details>

### spt_user テーブル (ユーザー情報)
|カラム名|型|補足|
|-------|---|----|
|id|UUID|主キー (Supabase認証のauth.users.id と連携)|
|email|TEXT|ユーザーのメールアドレス (NULL許容、auth.users と同期)|
|name|TEXT|ユーザーの表示名 (NULL許容)|


### roles テーブル (役割マスタ)
|カラム名|型|補足|
|-------|---|----|
|id|SERIAL|主キー (自動採番)|
|name|TEXT|役割名 (例: 'Manager', 'Member') |UNIQUE NOT NULL|
|short_name|TEXT|役割名 'MAN', 'MEM','ADMI') |NOT NULL|
|description	|TEXT	|役割の説明 (任意)|
|created_at	|TIMESTAMPTZ	|作成日時 (デフォルト: 現在時刻)|

### user_roles テーブル (ユーザーと役割の中間テーブル)
|カラム名|型|補足|
|-------|---|----|
|id|INTEGER|主キー|
|user_id|UUID|spt_user.id を参照 (ON DELETE CASCADE)|
|role_id|INTEGER|roles.id を参照 (ON DELETE CASCADE)|
|assigned_at|TIMESTAMPTZ|役割が割り当てられた日時 (デフォルト: 現在時刻, 任意)|


<details>
<summary>creat:spt_user</summary>



```sql


-- spt_user テーブル (Supabaseの auth.users テーブルと連携することを想定)
CREATE TABLE spt_user (
    id UUID PRIMARY KEY,
    email TEXT, -- auth.users.email と同期する場合があるため、UNIQUE制約はauth.users側で担保
    name TEXT  -- 表示名
    -- created_at TIMESTAMPTZ DEFAULT now(), -- 必要であれば作成日時
    -- updated_at TIMESTAMPTZ DEFAULT now()  -- 必要であれば更新日時
);

-- ユーザー役割を管理するテーブル
CREATE TABLE roles (
    id SERIAL PRIMARY KEY, -- 自動採番されるID
    name TEXT UNIQUE NOT NULL, -- 役割名 (例: 'Manager', 'Debugger', 'Member')
    short_name TEXT , --短縮名、テーブル用
    description TEXT, -- 役割の説明 (任意)
    created_at TIMESTAMPTZ DEFAULT now() -- 作成日時
);

-- 初期データの挿入 (例)
-- アプリケーションの要件に応じて調整してください。
INSERT INTO roles (name, description) VALUES
('Manager', 'MAN','システム全体の管理者権限を持ちます。'),
('Debugger', 'DEB','開発およびデバッグ用途の特別な権限を持ちます。'),
('Member', 'MEM','一般のメンバー権限を持ちます。');


-- ユーザーと役割の多対多関連を管理する中間テーブル
CREATE TABLE user_roles (
    user_id UUID REFERENCES spt_user(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(), -- 役割が割り当てられた日時 (任意)
    PRIMARY KEY (user_id, role_id) -- ユーザーIDと役割IDの組み合わせで一意
);

-- テーブルへのアクセス権限 xxxx
ALTER TABLE public.spt_user DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
GRANT USAGE ON SCHEMA "public" TO anon;
GRANT USAGE ON SCHEMA "public" TO authenticated;

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;

```

</details>


### spt_portals(ユーザーが作成するポートフォリオ)
ユーザーが作成するポートフォリオ（銘柄リストのまとまり）を格納するテーブルです

| カラム名      | 型        | 補足| 
| ------------- | --------- | ----------- | 
| id            | uuid      | 主キー（Supabaseのgen_random_uuid()などで自動生成）。                                                                                                   | 
| user_id       | uuid      | ポートフォリオを作成したユーザーのID。stock_usersテーブルのidを参照し、ユーザー削除時にはポートフォリオも削除されます。NOT NULL制約で必須項目とします。 | 
| name          | text      | ポートフォリオ名。ユーザーごとに一意である必要があります。NOT NULL制約で必須項目とします。  | 
| memo          | text      | ポートフォリオに関する注釈やメモ（任意項目）。| 
| created_at    | timestamp | レコードが挿入された日時。now()で自動的にタイムスタンプが設定されます。 | 
| display_order | integer   | ポートフォリオ一覧での表示順（小さいほど上位に表示）。デフォルト値は0です。| 

<details>
<summary>spt_portals</summary>

```sql
CREATE TABLE spt_portals (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    memo TEXT, -- ポータルへの注釈・メモ（任意）
    created_at TIMESTAMP DEFAULT now(),
    display_order INTEGER DEFAULT 0,-- 表示順
    UNIQUE (user_id, name)
);

```

</details>


### spt_portal_stocks（ポータルと銘柄のリレーション）
多対多対応  
spt_portalsテーブルと株銘柄（stock_daily_quotesテーブルに紐づく概念）の多対多のリレーションを管理する中間テーブルです。特定のポートフォリオにどの銘柄が追加されているかを管理します。

| カラム名      | 型        | 補足| 
| ------------- | --------- | --- | 
| id            | uuid      | 主キー（Supabaseのgen_random_uuid()などで自動生成）。                                                                                               | 
| portal_id     | uuid      | 関連するポートフォリオのID。stock_portalsテーブルのidを参照し、ポートフォリオ削除時にはこのレコードも削除されます。NOT NULL制約で必須項目とします。 | 
| stock_code    | text      | ポートフォリオに追加された銘柄のコード（例: '7203'）。NOT NULL制約で必須項目とします。                                                              | 
| added_at      | timestamp | 銘柄がポートフォリオに追加された日時。now()で自動的にタイムスタンプが設定されます。                                                                 | 
| display_order | integer   | ポートフォリオ内での銘柄の表示順。デフォルト値は0です。                                                                                             | 
| group_name    | text      | 銘柄のグループ名（任意項目）。例: '成長株', '高配当' など。                                                                                         | 
| memo          | text      | 個々の銘柄に対する注釈やメモ（任意項目）。                                                                                                          | 

<details>
<summary>create:spt_portal_stocks</summary>

```sql
CREATE TABLE spt_portal_stocks (
  id UUID PRIMARY KEY,
  portal_id UUID REFERENCES portals(id) ON DELETE CASCADE,
  stock_code TEXT NOT NULL,  -- 銘柄コード（例: '7203'）
  added_at TIMESTAMP DEFAULT now(),
  display_order INTEGER DEFAULT 0, -- 銘柄の表示順
  group_name TEXT, -- 銘柄のグループ名（任意）
  memo TEXT,       -- 銘柄への注釈・メモ（任意）
  UNIQUE (portal_id, stock_code)
);
```
</details>


### spt_stocks

個々の銘柄（企業）の基本情報

| カラム名     | 型        | 補足|
| ------------ | --------- | --------------------------------- | 
| code         | text      | 主キー。銘柄コード（例: 7203）。YahooFinanceAPIなどで一意に識別されるコードで、NOT NULL制約で必須項目とします。 | 
| name         | text      | 銘柄名/会社名（例: トヨタ自動車）。NOT NULL制約で必須項目とします。 | 
| market       | text      | 上場市場（例: 東証プライム, ナスダック など）。任意項目。| 
| industry     | text      | 業種（例: 自動車, 電気機器 など）。任意項目。        | 
| tradable     | boolean   | 取引可能フラグ。現在取引されている銘柄かどうかを示す（任意、デフォルトTRUEなど）。   | 
| listing_date | date      | 上場日。任意項目。 | 
| created_at   | timestamp | レコードが挿入された日時。now()で自動的にタイムスタンプが設定されます。| 
| updated_at   | timestamp | レコードが最終更新された日時。now()で自動更新されるように設定することが一般的です。 | 


<details>
<summary>create:spt_stocks</summary>

```sql
CREATE TABLE spt_stocks (
    code TEXT PRIMARY KEY, -- 銘柄コードを主キーとする
    name TEXT NOT NULL,
    market TEXT,
    industry TEXT,
    tradable BOOLEAN DEFAULT TRUE,
    listing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

```
</details>


### spt_company_stock_details（株式の詳細）

| カラム名             | 型           | 説明                |
| ---------------- | ----------- | ----------------- |
| `code`         | VARCHAR(10) | 株式コード（ユニーク）       |
| `market_cap`     | BIGINT      | 時価総額（百万円）         |
| `issued_shares`  | BIGINT      | 発行済株式数            |
| `div_yield`      | FLOAT       | 配当利回り（%）          |
| `dividend`       | FLOAT       | 1株配当（円）           |
| `per`            | FLOAT       | PER（倍）            |
| `pbr`            | FLOAT       | PBR（倍）            |
| `eps`            | FLOAT       | EPS（円）            |
| `bps`            | FLOAT       | BPS（円）            |
| `roe`            | FLOAT       | ROE（%）            |
| `equity_ratio`   | FLOAT       | 自己資本比率（%）         |
| `min_price`      | INTEGER     | 最低購入代金（円）         |
| `unit_shares`    | INTEGER     | 単元株数              |
| `high_price_ytd` | INTEGER     | 年初来高値（円）          |
| `low_price_ytd`  | INTEGER     | 年初来安値（円）          |
| `roa`            | FLOAT       | ROA（%）            |
| `operating_margin`| FLOAT       | 営業利益率（%）         |
| `free_cash_flow` | BIGINT      | フリーキャッシュフロー（百万円） |
| `interest_coverage`| FLOAT       | インタレストカバレッジレシオ |
| `beta`           | FLOAT       | ベータ値              |
| `peg_ratio`      | FLOAT       | PEGレシオ            |
| `updated_at`     | DATE        | 最終更新日（YYYY-MM-DD） |


<details>
<summary>create spt_company_stock_details</summary>

```sql
CREATE TABLE public.spt_company_stock_details (
    code VARCHAR(10) PRIMARY KEY,
    market_cap BIGINT,
    issued_shares BIGINT,
    div_yield FLOAT,
    dividend FLOAT,
    per FLOAT,
    pbr FLOAT,
    eps FLOAT,
    bps FLOAT,
    roe FLOAT,
    equity_ratio FLOAT,
    min_price INTEGER,
    unit_shares INTEGER,
    high_price_ytd INTEGER,
    low_price_ytd INTEGER,
    roa FLOAT,
    operating_margin FLOAT,
    free_cash_flow BIGINT,
    interest_coverage FLOAT,
    beta FLOAT,
    peg_ratio FLOAT,
    updated_at DATE
);

ALTER TABLE public.spt_company_stock_details DISABLE ROW LEVEL SECURITY;
```

</details>


### spt_notifications
データ構造: spt_notifications テーブル（別途定義が必要）
id: UUID
user_id: UUID (ユーザーID)
stock_code: TEXT (対象銘柄コード)
type: TEXT (通知の種類: 'BUY_SIGNAL', 'SELL_SIGNAL', 'INFO' など)
message: TEXT (通知メッセージ)
is_read: BOOLEAN (既読/未読)
created_at: TIMESTAMP

### spt_simulations （シミュレーション結果の保存用テーブル）
ユーザーが実行したシミュレーションの設定と結果を保存するテーブル。

| カラム名               | 型        | 補足                                                     | 
| ---------------------- | --------- | -------------------------------------------------------- | 
| id                     | uuid      | 主キー   | 
| user_id                | uuid      | ユーザーID (usersテーブル参照) | 
| portal_id              | uuid      | 関連するポートフォリオID (spt_portalsテーブル参照、任意) | 
| stock_code             | text      | 対象銘柄コード (spt_stocksテーブル参照) | 
| start_date             | date      | シミュレーション開始日   | 
| end_date               | date      | シミュレーション終了日 | 
| buy_amount_per_trade   | numeric   | 1回あたりの購入金額（または株数）| 
| buy_fee_rate           | numeric   | 購入手数料率（例: 0.001 = 0.1%）                         | 
| sell_fee_rate          | numeric   | 売却手数料率         | 
| buy_condition_type     | text      | 買い条件の種類 (APP_SIGNAL, CUSTOM_PRICE, CUSTOM_DATE)   | 
| sell_condition_type    | text      | 売り条件の種類 (APP_SIGNAL, CUSTOM_PRICE, CUSTOM_DATE)   | 
| custom_buy_price       | numeric   | カスタム買い条件の株価 (任意)                            | 
| custom_sell_price      | numeric   | カスタム売り条件の株価 (任意)                            | 
| total_profit_loss      | numeric   | 総損益               | 
| total_profit_loss_rate | numeric   | 総損益率             | 
| trade_count            | integer   | 総取引回数           | 
| created_at             | timestamp | シミュレーション実行日時                                 | 
| memo                   | text      | シミュレーションに関するメモ (任意)                      | 

<details>
<summary>spt_simulations</summary>

```sql
CREATE TABLE spt_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    portal_id UUID REFERENCES spt_portals(id) ON DELETE SET NULL, -- ポートフォリオと紐付けないシミュレーションも考慮
    stock_code TEXT REFERENCES spt_stocks(code) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    buy_amount_per_trade NUMERIC, -- 1回あたりの購入金額 or 株数
    buy_fee_rate NUMERIC DEFAULT 0,
    sell_fee_rate NUMERIC DEFAULT 0,
    buy_condition_type TEXT NOT NULL, -- 'APP_SIGNAL', 'CUSTOM_PRICE', 'CUSTOM_DATE'
    sell_condition_type TEXT NOT NULL, -- 'APP_SIGNAL', 'CUSTOM_PRICE', 'CUSTOM_DATE'
    custom_buy_price NUMERIC,
    custom_sell_price NUMERIC,
    total_profit_loss NUMERIC,
    total_profit_loss_rate NUMERIC,
    trade_count INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    memo TEXT
);
```

</details>


### spt_simulation_trades （シミュレーション中の個々の取引履歴）
シミュレーションで発生した個々の仮想取引（購入、売却）の詳細を記録するテーブル

| カラム名               | 型      | 補足                      | 
| ---------------------- | ------- | ------------------------------------------------------------- | 
| id                     | uuid    | 主キー                    | 
| simulation_id          | uuid    | 関連するシミュレーションID (spt_simulationsテーブル参照)      | 
| trade_date             | date    | 取引日                    | 
| trade_type             | text    | BUY または SELL           | 
| stock_code             | text    | 銘柄コード                | 
| price                  | numeric | 取引価格                  | 
| quantity               | integer | 取引株数                  | 
| fee                    | numeric | 取引手数料                | 
| profit_loss            | numeric | この取引における損益 (売却時のみ計算)                         | 
| cumulative_profit_loss | numeric | この取引までの累積損益 (参考情報)                             | 
| memo                   | text    | 取引に関するメモ (例: "買いシグナル発生", "10%利益達成" など) | 

<details>
<summary>create spt_simulation_trades</summary>


```sql
CREATE TABLE spt_simulation_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES spt_simulations(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    trade_type TEXT NOT NULL, -- 'BUY', 'SELL'
    stock_code TEXT NOT NULL,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    fee NUMERIC DEFAULT 0,
    profit_loss NUMERIC, -- 売却時のみ、この取引での損益
    cumulative_profit_loss NUMERIC, -- その時点での累積損益
    memo TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

</details>



### jpx_company_master
| カラム名         | データ型   | NULL許容 | 説明         | 主キー/その他                  | 
| ---------------- | ---------- | -------- | ------------------------------------------------ | ------------------------------ | 
| code| TEXT       | NO       | 銘柄コード（例: "1301", "130A"）                 | 主キー (一意性が保証される)    | 
| company_name     | TEXT       | NO       | 銘柄名（例: "極洋"）                             |                                | 
| market_segment   | TEXT       | NO       | 市場・商品区分（例: "プライム（内国株式）"）     |                                | 
| industry_33_code | TEXT       | YES      | 33業種コード（例: "50", "-" は空文字列）         | NULL許容（ETFなどの場合）      | 
| industry_33_name | TEXT       | YES      | 33業種区分（例: "水産・農林業", "-" は空文字列） | NULL許容（ETFなどの場合）      | 
| industry_17_code | TEXT       | YES      | 17業種コード（例: "1", "-" は空文字列）          | NULL許容（ETFなどの場合）      | 
| industry_17_name | TEXT       | YES      | 17業種区分（例: "食品", "-" は空文字列）         | NULL許容（ETFなどの場合）      | 
| scale_code       | TEXT       | YES      | 規模コード（例: "7", "-" は空文字列）            | NULL許容（ETFなどの場合）      | 
| scale_name       | TEXT       | YES      | 規模区分（例: "TOPIX Small 2", "-" は空文字列）  | NULL許容（ETFなどの場合）      | 
| updated_at       | TIMESTAMPZ | NO       | レコード最終更新日時                             | NOW() のデフォルト値を設定推奨 | 

<details>
<summary>create:jpx_company_master</summary>

```sql
---
CREATE TABLE public.jpx_company_master (
    code TEXT PRIMARY KEY,                          -- 銘柄コードを主キーとする
    company_name TEXT NOT NULL,                     -- 銘柄名
    market_segment TEXT NOT NULL,                   -- 市場・商品区分
    industry_33_code TEXT,                          -- 33業種コード (NULL許容)
    industry_33_name TEXT,                          -- 33業種区分 (NULL許容)
    industry_17_code TEXT,                          -- 17業種コード (NULL許容)
    industry_17_name TEXT,                          -- 17業種区分 (NULL許容)
    scale_code TEXT,                                -- 規模コード (NULL許容)
    scale_name TEXT,                                -- 規模区分 (NULL許容)
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL   -- レコード最終更新日時
);

-- RLSを無効にする
ALTER TABLE public.jpx_company_master DISABLE ROW LEVEL SECURITY;

-- スキーマの使用権限 (これは既存であれば再実行しても問題ないです)
GRANT USAGE ON SCHEMA "public" TO anon;
GRANT USAGE ON SCHEMA "public" TO authenticated;

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;

-- データを挿入または更新する際のポリシーの例（例：認証されたユーザーのみ）
-- Upsert (INSERT ON CONFLICT UPDATE) を利用する場合、INSERTとUPDATE両方のポリシーが必要になることがあります。
-- 特定のユーザーロールやサービスロールからの書き込みに制限することを検討してください。
-- CREATE POLICY "Enable write access for authenticated users" ON public.company_master_latest
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update access for authenticated users" ON public.company_master_latest
--   FOR UPDATE USING (auth.role() = 'authenticated');

```

</details>

importjpx01.html：
[その他統計資料](https://www.jpx.co.jp/markets/statistics-equities/misc/01.html)のXmlから取得する。
そこから、Xmlを開いて、全選択して、インポート画面へコピー


### Supabase PostgreSQL Function
できるだけ利用しないようにする。**Server Actions**をできるだけ利用する。
- /app/actions/stock.ts (Server Actions) 「フォームの送信」や「データ変更」など、特定のUI操作に紐づくサーバーサイドの処理に特化しています。
- /api/stock.ts (Route Handler) 従来のAPIルート（Pages Routerのpages/apiに相当）のApp Router版です。
#### get_period_stock_views
- Supabase PostgreSQL Function: get_period_stock_views
- 指定された期間内の株価参照履歴を集計し、
- 銘柄コード、銘柄名、市場、業種、期間内の参照件数、期間内最新参照日時を返します。


<details>
<summary>fn:get_period_stock_views</summary>

```sql
-- Supabase PostgreSQL Function: get_period_stock_views
-- 指定された期間内の株価参照履歴を集計し、
-- 銘柄コード、銘柄名、市場、業種、期間内の参照件数、期間内最新参照日時を返します。

CREATE OR REPLACE FUNCTION public.get_period_stock_views(
    start_date_param DATE DEFAULT NULL, -- 期間の開始日 (NULLの場合、期間を考慮しない)
    end_date_param DATE DEFAULT NULL,   -- 期間の終了日 (NULLの場合、期間を考慮しない)
    stock_code_param TEXT DEFAULT NULL, -- 銘柄コードのフィルタ (NULLの場合、フィルタしない)
    stock_name_param TEXT DEFAULT NULL  -- 銘柄名のフィルタ (NULLの場合、フィルタしない)
)
RETURNS TABLE (
    stock_code TEXT,
    stock_name TEXT,
    stock_market TEXT,
    stock_industry TEXT,
    period_view_count BIGINT,
    latest_viewed_at_in_period TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        svh.stock_code,
        s.name AS stock_name,
        s.market AS stock_market,
        s.industry AS stock_industry,
        COUNT(svh.id) AS period_view_count,
        MAX(svh.viewed_at) AS latest_viewed_at_in_period
    FROM
        public.spt_stock_view_history AS svh
    JOIN
        public.spt_stocks AS s ON svh.stock_code = s.code
    WHERE
        (start_date_param IS NULL OR svh.viewed_at >= start_date_param::timestamp WITH TIME ZONE) AND
        (end_date_param IS NULL OR svh.viewed_at < (end_date_param + INTERVAL '1 day')::timestamp WITH TIME ZONE) AND -- 終了日の翌日0時まで
        (stock_code_param IS NULL OR svh.stock_code ILIKE ('%' || stock_code_param || '%')) AND
        (stock_name_param IS NULL OR s.name ILIKE ('%' || stock_name_param || '%'))
    GROUP BY
        svh.stock_code,
        s.name,
        s.market,
        s.industry
    ORDER BY
        MAX(svh.viewed_at) DESC, -- 次に最新参照日時でソート (件数が同じ場合)
        COUNT(svh.id) DESC; -- 参照件数が多い順にソート
END;
$$;

-- この関数を`authenticated`ロールが実行できるように権限を付与します。
-- 必要に応じて`anon`ロールにも付与できますが、認証済みのユーザーに限定することが推奨されます。
GRANT EXECUTE ON FUNCTION public.get_period_stock_views(DATE, DATE, TEXT, TEXT) TO authenticated;

SELECT * FROM public.get_period_stock_views(
'2025-06-01', -- start_date_param
'2025-06-07', -- end_date_param
null,
null
);

```

</details>

#### handle_new_user
- Supabase PostgreSQL Function: handle_new_user
- ユーザー作成時、sp_user作成するためのトリガー


<details>
<summary>fn:handle_new_user</summary>


```sql
-- Function to insert a new user into spt_user table
-- This function will be triggered when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Allows the function to operate with definer's privileges, necessary for accessing auth.users
SET search_path = public -- Ensures the function operates within the public schema context
AS $$
BEGIN
  -- Insert the new user's id and email into the public.spt_user table.
  -- Tries to get 'name' from the raw_user_meta_data. If 'name' is not provided during signup,
  -- (NEW.raw_user_meta_data->>'name') will evaluate to NULL, which is acceptable for the nullable 'name' column.
  INSERT INTO public.spt_user (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
</details>




#### get_all_daily_quotes_periods
- Supabase PostgreSQL Function: get_all_daily_quotes_periods
- 株価データ取得の期間を取得する関数


<details>
<summary>fn:get_all_daily_quotes_periods</summary>


```sql
CREATE OR REPLACE FUNCTION get_all_daily_quotes_periods()
RETURNS TABLE (
  code TEXT,
  min_date TEXT, -- Changed to TEXT to match current "N/A" logic, or use DATE and handle NULLs
  max_date TEXT  -- Same as above
)
LANGUAGE sql
AS $$
  SELECT
    spt_daily_quotes.code,
    MIN(spt_daily_quotes.date)::TEXT AS min_date,
    MAX(spt_daily_quotes.date)::TEXT AS max_date
  FROM
    spt_daily_quotes
  GROUP BY
    spt_daily_quotes.code;
$$;
```

</details>

#### get_portfolio_stock_details
- ポートフォリオIDに基づいて、ポートフォリオ内の各銘柄の詳細情報を取得します。
- 銘柄の基本情報、詳細情報（年初来高値・安値）、最新の株価終値、および前日の株価終値を含みます。
<details>
<summary>fn:get_portfolio_stock_details</summary>

```sql
-- PostgreSQL Function: get_portfolio_stock_details
-- ポートフォリオIDに基づいて、ポートフォリオ内の各銘柄の詳細情報を取得します。
-- 銘柄の基本情報、詳細情報（年初来高値・安値）、最新の株価終値、および前日の株価終値を含みます。

CREATE OR REPLACE FUNCTION public.get_portfolio_stock_details(
    p_portal_id INTEGER -- 取得したいポートフォリオのID
)
RETURNS TABLE (
    id INTEGER, -- spt_portfolio_stocks のID
    stock_code TEXT, -- 銘柄コード
    created_at TIMESTAMP WITH TIME ZONE, -- spt_portfolio_stocks の作成日時
    updated_at TIMESTAMP WITH TIME ZONE, -- spt_portfolio_stocks の更新日時
    stock_name TEXT, -- spt_stocks からの銘柄名
    stock_market TEXT, -- spt_stocks からの上場市場
    stock_industry TEXT, -- spt_stocks からの業種
    high_price_ytd INTEGER, -- spt_company_stock_details からの年初来高値
    low_price_ytd INTEGER, -- spt_company_stock_details からの年初来安値
    current_price NUMERIC, -- spt_daily_quotes からの最新株価終値
    previous_day_close_price NUMERIC -- spt_daily_quotes からの最新から一つ前の日の株価終値
)
LANGUAGE plpgsql
SECURITY DEFINER -- この関数が auth スキーマのテーブルや RLS が有効なテーブルにアクセスするために必要
SET search_path = public -- 関数が public スキーマ内で動作することを保証
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sps.id,
        sps.stock_code,
        sps.created_at,
        sps.updated_at,
        ss.name AS stock_name,
        ss.market AS stock_market,
        ss.industry AS stock_industry,
        scsd.high_price_ytd,
        scsd.low_price_ytd,
        ldq.close AS current_price,
        pdq.close AS previous_day_close_price -- 前日終値を設定
    FROM
        public.spt_portfolio_stocks sps
    JOIN
        public.spt_stocks ss ON sps.stock_code = ss.code -- 銘柄の基本情報を結合
    LEFT JOIN
        public.spt_company_stock_details scsd ON sps.stock_code = scsd.code -- 銘柄の詳細情報を結合 (LEFT JOIN は詳細がない銘柄も含むため)
    LEFT JOIN LATERAL ( -- 各銘柄の最新の日次終値を取得するための LATERAL JOIN (current_price用)
        SELECT
            sq_latest.date,
            sq_latest.close
        FROM
            public.spt_daily_quotes sq_latest
        WHERE
            sq_latest.code = sps.stock_code
        ORDER BY
            sq_latest.date DESC -- 最新日付のデータを取得
        LIMIT 1
    ) AS ldq ON TRUE
    LEFT JOIN LATERAL ( -- 各銘柄の最新から一つ前の日の終値を取得するための LATERAL JOIN (previous_day_close_price用)
        SELECT
            sq_prev.close
        FROM
            public.spt_daily_quotes sq_prev
        WHERE
            sq_prev.code = sps.stock_code
            AND sq_prev.date < ldq.date -- 最新日より前の日付のデータに限定
        ORDER BY
            sq_prev.date DESC -- 最新から一つ前の日付のデータを取得
        LIMIT 1
    ) AS pdq ON TRUE
    WHERE
        sps.portal_id = p_portal_id -- 指定されたポートフォリオIDでフィルタリング
    ORDER BY
        sps.display_order; -- ポートフォリオ内での表示順でソート
END;
$$;

-- この関数を `authenticated` ロールが実行できるように権限を付与します。
-- 必要に応じて `anon` ロールにも付与できますが、通常は認証済みユーザーに限定することが推奨されます。
GRANT EXECUTE ON FUNCTION public.get_portfolio_stock_details(INTEGER) TO authenticated;

-- 関数呼び出しの例
-- SELECT * FROM public.get_portfolio_stock_details(1); -- 例: ポートフォリオIDが1の場合
```

</details>


#### get_users_with_roles_and_status
- public.get_users_with_roles_and_status(): ユーザー一覧と役割情報を取得
- 管理画面表示用に、ユーザー名、メール、役割、ステータスでフィルタリングし、ページネーションも考慮
  
<details>
<summary>fn:get_users_with_roles_and_status</summary>

```sql
-- DROP FUNCTION public.get_users_with_roles_and_status(text,text,integer[],boolean,integer,integer);
CREATE OR REPLACE FUNCTION public.get_users_with_roles_and_status(
    p_user_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_role_ids INTEGER[] DEFAULT NULL, -- 役割IDの配列（フィルタリング用）
    p_status BOOLEAN DEFAULT NULL,     -- True: 有効 (メール確認済み), False: 無効 (メール未確認/無効化)
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_roles TEXT[], -- ロール名の配列
    is_active BOOLEAN, -- ユーザーのステータス (email_confirmed_atを基に判断)
    registered_at TIMESTAMPTZ,
    last_signed_in_at TIMESTAMPTZ,
    total_count BIGINT -- フィルタリング後の総ユーザー数 (ページネーション用)
)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: auth.usersテーブルへのアクセスが必要なため、定義者の権限で実行
SET search_path = public, auth -- authスキーマを検索パスに追加
AS $$
DECLARE
    _total_count BIGINT;
BEGIN
    -- フィルタリング後の総ユーザー数を計算 (ページネーションの合計ページ数算出に必要)
    SELECT COUNT(DISTINCT au.id)
    INTO _total_count
    FROM auth.users au
    JOIN public.spt_user su ON au.id = su.id
    LEFT JOIN public.user_roles ur ON su.id = ur.user_id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE
        (p_user_name IS NULL OR su.name ILIKE '%' || p_user_name || '%') AND
        (p_email IS NULL OR au.email ILIKE '%' || p_email || '%') AND
        (p_role_ids IS NULL OR r.id = ANY(p_role_ids)) AND -- 役割IDでフィルタ
        (p_status IS NULL OR (au.email_confirmed_at IS NOT NULL) = p_status)
    ;

    RETURN QUERY
    SELECT
        au.id AS user_id,
        su.name AS user_name,
        au.email::text AS user_email,
        -- ARRAY_AGGで重複しない役割名を配列として取得
        ARRAY_AGG(DISTINCT r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL) AS user_roles,
        (au.email_confirmed_at IS NOT NULL) AS is_active, -- email_confirmed_atが存在すれば有効とみなす
        au.created_at AS registered_at,
        au.last_sign_in_at,
        _total_count -- 各行に総数を付与
    FROM
        auth.users au
    JOIN
        public.spt_user su ON au.id = su.id
    LEFT JOIN
        public.user_roles ur ON su.id = ur.user_id
    LEFT JOIN
        public.roles r ON ur.role_id = r.id
    WHERE
        (p_user_name IS NULL OR su.name ILIKE '%' || p_user_name || '%') AND
        (p_email IS NULL OR au.email ILIKE '%' || p_email || '%') AND
        (p_role_ids IS NULL OR r.id = ANY(p_role_ids)) AND
        (p_status IS NULL OR (au.email_confirmed_at IS NOT NULL) = p_status)
    GROUP BY
        au.id, su.name, au.email, au.created_at, au.last_sign_in_at
    ORDER BY
        au.created_at DESC -- 登録日時で降順ソート
    LIMIT p_limit OFFSET p_offset;
END;
$$;
-- authenticated ユーザーがこの関数を実行できるようにします
GRANT EXECUTE ON FUNCTION public.get_users_with_roles_and_status(TEXT, TEXT, INTEGER[], BOOLEAN, INTEGER, INTEGER) TO authenticated;

select * from    get_users_with_roles_and_status(null , 'syunjyu0001@gmail.com',null , null , 1,0)
```

</details>



## 2. データベース側での設計
```sql
-- ユーザーと役割の多対多関連を管理する中間テーブル
CREATE TABLE user_roles (
    user_id UUID REFERENCES spt_user(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(), -- 役割が割り当てられた日時 (任意)
    PRIMARY KEY (user_id, role_id) -- ユーザーIDと役割IDの組み合わせで一意
);
```



<details>
  <summary>既存データの移行</summary>
  <p>これが折りたたまれる内容です。</p>
  <pre>
    <code>
INSERT INTO public.spt_user (id, email, name)
SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'name' AS name -- Extracts 'name' from the user's metadata if available
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.spt_user su
        WHERE su.id = u.id
    );

select * from spt_user
    </code>
  </pre>
</details>


