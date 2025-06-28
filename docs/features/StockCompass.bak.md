[Top](../README.md)

## StockCompass
### 目的
市場の動向を過去のデータをベースに分析するツール


### 動き
取得済みの市場データをベースに１０％上がるものを探すツールです。
過去の株式の市場は入手している前提で仮説を立てて、期待値１０％を見つける
１５日（市場公開日）ベースで、過去のデータの中で、以下のシナリオに沿うものを選別する
  * [チャート](./DisplayChart.md)

## ワークフロー全体
![Alt text](images/StockCompass_UC_Image01.drawio.png)
## ワークフロー詳細　
* 検証プラン作成→プラン登録→検証結果確認まで

![Alt text](images/StockCompass_UC_image02.drawio.png)  


## ロハストネス（プラン検証）

![StockCompass_LH_image03.drawio.png](images/StockCompass_LH_image03.drawio.png)

* 01.01 シュミレーション期間取得処理
* 01.02 市場データ取得処理
* 01.03 株券情報取得処理
* 01.04 選択銘柄の条件確認
* 02.01 銘柄ごとのループ
* 03.01 銘柄の起点は範囲を摘出（起点からｘｘ日前など）
* 03.02 起点日からＸ日前のデータ確認
* 03.03 取得したデータの結果の確認
* 03.04 Ｅｎｔｒｙサインの確認
* 03.05 次の日付へ　起点日＋１　→03.01へ
* 04.01 In　Ｅｎｔｒｙ条件クリア
* 04.02 データ登録、Ｅｎｔｒｙ条件クリアデータの登録
* 04.03 起点日からＹ日までのデータ取得
* 05.01 Ｙ日まで一日づつ実行
* 05.02 タイムアウトの確認（Ｅｘｉｔサインのタイムアウトの確認）
* 05.04 Ｅｘｉｔサインの確認
* 05.05 翌日へ　→05.01へ
* 06.01 Out
* 06.02 データ登録、Outに基づた計算の実行
* 06.03 次の銘柄の確認　有→02.01へ　なし→終了



### 前提
- 株の購入金額は５０万円以下とする
- 出来高はｘｘｘ以上とする
- １００単位でのみ株は購入できる想定
- 株の売買には手数料が０．５％かかる、購入で０．５％、売却で０．５％とする。
- 利益に対しては税金が２０％かかるものとする。
- 外的要因は考慮に入れない

### 目的の明確化

* **何を予測したいのか？**
  * １４日後のトレンド
  * 起点後株価の変動率１０％以上の物を探したい。


### データ準備
* **基本データ**
  * 日付、始値、高値、安値、終値、出来高などは持っている状態です。
  * 各企業ごとの現状での情報
    * 企業名、純資産、従業員数、発行株式数など
## イメージ
![StockComapss_image01.png](images/StockCompass_image01.png)
## 基本的な流れ

### 目的
　利用者が、株式市場で株価上昇のサインを探すための処理
### 利用手順
* Step1：利用者：Stock、銘柄コードの一覧を入力する 
  * ポートフォリオがあれば、そこから銘柄コードの一覧を入手する
  * OutPut：「銘柄一覧」
* Step2：利用者；会社が評価対象かどうかのフィルターを指定する
  * 例）資産額、平均出来高、最低購入金額、決算発表前後3日は対象外とする、今日から1年前までが検索対象など
  * OutPut：「フィルター条件」
* Step3：システム：「銘柄一覧」、「フィルター条件」から、銘柄コードを絞る
  * OutPut：「フィルター後銘柄」
* Step4:利用者：対象となる銘柄コードを確認する。
* Step5:利用者：株価上昇サインの仮設を立てる
  * 例）移動平均線を超えてゴールデンクロスになった、過去３日間で平均上昇３％以上など
  * Output:「シグナル条件」
* Step6:利用者：売却条件の入力
  * 例）１０日後に売却する、１０％超える、１０％下がると売却する
  * Output:「出口条件」
* Step7:利用者：仮説、銘柄コード一覧を確認し、摘出の実施
* Step8:システム：摘出処理
  * 指定された、「シグナル条件」、「フィルター後銘柄」から、事象の発生している日付を確認
  * 「出口条件」の条件に従って、処理したとした場合に最終損益、損益発生日を登録する。
  * output:「検証結果（損益）」
* Step9:利用者：「検証結果（損益）」を参照する。必要なら、Step1,Step2,Step3などへ戻って再度評価を行う。

お送りいただいた仕様から、**画面一覧**と**機能一覧**を作成しました。これらを基に、プロジェクトの要件に合わせて調整してください。


---

#### 画面一覧

| 画面名 | 目的 | 主な要素 |
| --- | --- | --- |
| 1. 銘柄入力画面 | 分析したい銘柄コードを登録または選択する | ・銘柄コード入力（手入力、CSVインポート）<br>・既存ポートフォリオからの選択&<br>・登録/次へボタン |
| 2. フィルター条件設定画面 | 銘柄を絞り込むための条件を設定する | ・資産額、平均出来高などの数値入力<br>・日付範囲（決算発表前後、検索対象期間）設定<br>・条件保存/次へボタン |
| 3. フィルター後銘柄確認画面 | フィルターで絞り込まれた銘柄を確認する | ・絞り込み済み銘柄リスト（銘柄コード、銘柄名、フィルター適用日など）&<br>・確認/次へボタン |
| 4. シグナル条件設定画面 | 株価上昇サインの仮説（シグナル条件）を設定する | ・シグナル条件名入力<br>・テクニカル指標（移動平均線など）、上昇率、期間などの設定UI<br>・条件保存/次へボタン |
| 5. 出口条件設定画面 | 売却条件を設定する | ・出口条件名入力<br>・保有期間、目標利益率、損切り率などの設定UI<br>・条件保存/次へボタン |
| 6. 検証実行・履歴画面 | 設定条件で検証実行、過去の検証履歴を確認する | ・選択中の条件表示（フィルター、シグナル、出口）<br>・「検証実行」ボタン<br>・過去の検証実行リスト<br>・各結果へのリンク |
| 7. 検証結果（損益）詳細画面 | 個々の検証結果（損益）を詳細に参照する | ・シグナル発生/売却日時・株価<br>・損益額/率<br>・検証条件概要<br>・グラフ表示（オプション）<br>・前画面に戻るボタン |

### テーブル一覧

以下に、「StockCompass」の機能を実現するためのテーブルの一覧を示します。これらのテーブルは、ユーザーの分析条件を柔軟かつ構造的に保存するために設計されています。

| No. | テーブル名  | 説明   |
|-----|---------------------------------|-------------------------------------------|
| 1   | `sptch_analysis_conditions`| 分析条件のメインセット|
| 2   | `sptch_stock_selections_header` | 銘柄選択条件のヘッダー情報 |
| 3   | `sptch_stock_selections_stocks` | 銘柄選択条件の実データ（銘柄コード） |
| 4   | `sptch_simulation_periods` | シミュレーション期間条件   |
| 5   | `sptch_trade_parameters`   | 取引前提条件|
| 6   | `sptch_signals`  | 売買シグナル条件（エントリー・エグジットのセット） |
| 7   | `sptch_entry_signals` | エントリーシグナル条件の詳細    |
| 8   | `sptch_exit_signals`  | エグジットシグナル条件の詳細    |
| 9   | `sptch_fee_taxes`| 手数料・税金条件 |


**`sptch_analysis_conditions` (分析条件のメインセット)**
* このテーブルが、各分析シナリオの全体を定義する中心です。
* 以下の各条件テーブルは、`sptch_analysis_conditions`から参照される「テンプレート」として機能します。
    * [N:1]**`sptch_stock_selections_header` (銘柄選択条件のヘッダー情報)**　目的：銘柄コードのリストを定義します。複数の分析条件で再利用可能です。
        * [1:N]**`sptch_stock_selections_stocks` (銘柄選択条件の実データ)**　目的：個々の銘柄コードを格納します。
    * [N:1]**`sptch_simulation_periods` (シミュレーション期間条件)** 目的：シミュレーションの開始日と終了日を定義します。複数の分析条件で再利用可能です。
    * [N:1]**`sptch_trade_parameters` (取引前提条件)** 目的：最大購入金額、最低出来高、取引単位などを定義します。複数の分析条件で再利用可能です。
    * [N:1]**`sptch_signals` (売買シグナル条件セット)** 目的：取引タイプ、エントリー条件、エグジット条件の組み合わせを定義します。複数の分析条件で再利用可能です。
        * [N:1]**`sptch_entry_signals` (エントリーシグナル条件の詳細)** 目的：具体的なエントリー条件のロジック（JSONB）を格納します。複数のシグナルセットで再利用可能です。
        * [N:1]**`sptch_exit_signals` (エグジットシグナル条件の詳細)** 目的：具体的なエグジット条件のロジック（JSONB）を格納します。複数のシグナルセットで再利用可能です。
    * [N:1]**`sptch_fee_taxes` (手数料・税金条件)** 目的：手数料率や税率を定義します。複数の分析条件で再利用可能です。 

```
sptch_analysis_conditions               【分析条件のメインセット】
├── stock_selection_header_id ─────▶ sptch_stock_selections_header
│                                         └── [1:N] sptch_stock_selections_stocks
│                                               （銘柄コードのリスト）
├── simulation_period_id ──────────▶ sptch_simulation_periods
│                                        （シミュレーション期間）
├── trade_parameter_id ───────────▶ sptch_trade_parameters
│                                        （取引前提条件）
├── signal_id ─────────────────────▶ sptch_signals
│    ├── entry_signal_id ────────▶ sptch_entry_signals
│    └── exit_signal_id ─────────▶ sptch_exit_signals
│          （売買シグナル詳細（条件ロジック JSONB））
└── fee_tax_id ───────────────────▶ sptch_fee_taxes
        （手数料・税金条件）
```

###　テーブル詳細

#### 1\. `sptch_analysis_conditions`

  * **分析条件のメインテーブル**
  * シミュレーションや予測に使う分析条件セット全体を定義し、各サブ条件への参照を保持します。

| カラム名 | データ型| 制約    | 説明    |
|:-----------------------------|:-----------------------|:----------------------------|:----------------------------------------------------------|
| `id`| `BIGSERIAL` / `INTEGER` | `PRIMARY KEY`| 条件セットの一意のID (自動採番)  |
| `user_id`| `UUID`  | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`   | `TEXT`  |    | 条件セットの名前 (ユーザーが設定)|
| `memo`   | `TEXT`  |    | 条件セットに関するメモ |
| `stock_selection_header_id`  | `BIGINT`| `REFERENCES sptch_stock_selections_header(id)` | 銘柄選択条件への外部キー（任意） |
| `simulation_period_id`  | `BIGINT`| `REFERENCES sptch_simulation_periods(id)`  | シミュレーション期間条件への外部キー（任意）    |
| `trade_parameter_id`    | `BIGINT`| `REFERENCES sptch_trade_parameters(id)`    | 取引前提条件への外部キー（任意） |
| `signal_id`   | `BIGINT`| `REFERENCES sptch_signals(id)`   | 売買シグナル条件セットへの外部キー（任意） |
| `fee_tax_id`  | `BIGINT`| `REFERENCES sptch_fee_taxes(id)` | 手数料・税金条件への外部キー（任意）  |
| `created_at`  | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at`  | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 2\. `sptch_stock_selections_header`

  * **銘柄選択条件のヘッダー情報**
  * 個別の銘柄コードリスト（`sptch_stock_selections_stocks`）をまとめるヘッダー情報です。複数の分析条件から共通の銘柄リストを参照・再利用できます。

| カラム名| データ型    | 制約    | 説明    |
|:-------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 銘柄選択条件セットの一意のID  |
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 3\. `sptch_stock_selections_stocks`

  * **銘柄選択条件の実データ**
  * `sptch_stock_selections_header`の実態です。各銘柄コードを複数保持します。

| カラム名   | データ型    | 制約 | 説明 |
|:-----------|:---------------------------|:-----------------------------------|:---------------|
| `id`  | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`  | レコードの一意のID |
| `header_id`| `BIGINT`    | `NOT NULL REFERENCES sptch_stock_selections_header(id) ON DELETE CASCADE` | 銘柄選択ヘッダーへの外部キー |
| `order_no` | `INTEGER`   | `NOT NULL`| 銘柄の表示順/連番  |
| `stock_code`| `VARCHAR(10)`    | `NOT NULL`| 銘柄コード  |

#### 4\. `sptch_simulation_periods`

  * **シミュレーション期間条件**
  * シミュレーションの対象期間を定義します。複数の分析条件から共通の期間設定を参照・再利用できます。

| カラム名| データ型    | 制約    | 説明    |
|:-------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 期間条件の一意のID|
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `start_date` | `DATE` | `NOT NULL`   | シミュレーション開始日 |
| `end_date`   | `DATE` | `NOT NULL`   | シミュレーション終了日 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|


#### 5\. `sptch_trade_parameters`

  * **取引前提条件**
  * 資金管理や取引の前提となる条件を格納します。複数の分析条件から共通の取引前提を参照・再利用できます。

| カラム名| データ型    | 制約    | 説明 |
|:------------------|:---------------------------|:----------------------------|:---------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 取引ルールの一意のID |
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `max_purchase_amount` | `INTEGER`   |    | 最大購入金額|
| `min_volume` | `BIGINT`    |    | 最低出来高  |
| `trade_unit` | `INTEGER`   | `NOT NULL`   | 取引単位  |
| `conditions_json`   | `JSONB`|    | 条件 (JSONで格納・可変になることを想定) |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 6\. `sptch_signals`

  * **売買シグナル条件（エントリー・エグジットのセット）**
  * エントリー条件とエグジット条件の組み合わせを定義します。これにより、取引タイプと、それぞれ独立したエントリー条件およびエグジット条件を紐付けます。

| カラム名| データ型    | 制約    | 説明    |
|:------------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| シグナル条件セットの一意のID|
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `transaction_type`| `VARCHAR(10)`    | `NOT NULL`   | 取引タイプ ('long', 'short')|
| `entry_signal_id` | `BIGINT`    | `NOT NULL REFERENCES sptch_entry_signals(id)` | エントリーシグナル条件への外部キー    |
| `exit_signal_id`  | `BIGINT`    | `REFERENCES sptch_exit_signals(id)` | エグジットシグナル条件への外部キー（NULL許容）|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 7\. `sptch_entry_signals`

  * **エントリーシグナル条件の詳細**
  * エントリー条件の具体的な内容をJSONB形式で格納します。複数のシグナルセットから共通のエントリー条件を参照・再利用できます。

| カラム名  | データ型    | 制約    | 説明 |
|:--------------------|:---------------------------|:----------------------------|:---------------|
| `id` | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| エントリーシグナル条件の一意のID |
| `user_id` | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`    | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`    | `TEXT` |    | 条件セットに関するメモ |
| `conditions_json`   | `JSONB`| `NOT NULL`   | エントリー条件 (JSONで格納) |
| `created_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時 |
| `updated_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|

#### 8\. `sptch_exit_signals`

  * **エグジットシグナル条件の詳細**
  * エグジット条件の具体的な内容をJSONB形式で格納します。複数のシグナルセットから共通のエグジット条件を参照・再利用できます。

| カラム名  | データ型    | 制約    | 説明 |
|:--------------------|:---------------------------|:----------------------------|:---------------|
| `id` | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| エグジットシグナル条件の一意のID |
| `user_id` | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`    | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`    | `TEXT` |    | 条件セットに関するメモ |
| `conditions_json`   | `JSONB`| `NOT NULL`   | エグジット条件 (JSONで格納) |
| `created_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時 |
| `updated_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|

#### 9\. `sptch_fee_taxes`

  * **手数料・税金条件**
  * シミュレーションの損益計算に直接影響する要素を格納します。NUMERIC 型で精度を保証します。複数の分析条件から共通の手数料・税金設定を参照・再利用できます。

| カラム名| データ型    | 制約    | 説明    |
|:-------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 手数料・税金情報の一意のID  |
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `buy_fee_rate`| `NUMERIC(8,5)`   | `NOT NULL`   | 買い手数料率 (例: 0.00450)  |
| `sell_fee_rate`| `NUMERIC(8,5)`   | `NOT NULL`   | 売り手数料率 (例: 0.005)    |
| `tax_rate`   | `NUMERIC(8,5)`   | `NOT NULL`   | 税率 (例: 0.20315)|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|

<details>
<summary>DDL</summary>

```sql
-- テーブル作成の順番留意すること。
-- updated_at を自動更新するトリガー関数 (任意だが推奨)
-- Supabaseのトリガー設定でこの関数をBEFORE UPDATEに設定してください
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

CREATE TABLE sptch_analysis_conditions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- Supabase auth.users.id を参照 (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    -- 各サブ条件への参照を追加
    stock_selection_header_id BIGINT REFERENCES sptch_stock_selections_header(id) ON DELETE SET NULL, -- 選択は必須でなければNULL許容
    simulation_period_id BIGINT REFERENCES sptch_simulation_periods(id) ON DELETE SET NULL,
    trade_parameter_id BIGINT REFERENCES sptch_trade_parameters(id) ON DELETE SET NULL,
    signal_id BIGINT REFERENCES sptch_signals(id) ON DELETE SET NULL,
    fee_tax_id BIGINT REFERENCES sptch_fee_taxes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_analysis_conditions
-- BEFORE UPDATE ON sptch_analysis_conditions
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE sptch_stock_selections_header (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
    );

-- CREATE TRIGGER set_updated_at_on_stock_selections_header
-- BEFORE UPDATE ON sptch_stock_selections_header
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sptch_stock_selections_stocks (
    id BIGSERIAL PRIMARY KEY,
    header_id BIGINT NOT NULL REFERENCES sptch_stock_selections_header(id) ON DELETE CASCADE,
    order_no INTEGER NOT NULL, -- 銘柄の表示順/連番
    stock_code VARCHAR(10) NOT NULL, -- 銘柄コード
    UNIQUE (header_id, stock_code) -- 同じヘッダーID内で同じ銘柄コードは重複しない
);
CREATE INDEX idx_sptch_stock_selections_stocks_header_id ON sptch_stock_selections_stocks(header_id);

CREATE TABLE sptch_simulation_periods (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    start_date DATE NOT NULL, -- シミュレーション開始日
    end_date DATE NOT NULL, -- シミュレーション終了日
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_simulation_periods
-- BEFORE UPDATE ON sptch_simulation_periods
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sptch_trade_parameters (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    max_purchase_amount INTEGER, -- 最大購入金額
    min_volume BIGINT, -- 最低出来高
    trade_unit INTEGER NOT NULL, -- 取引単位
    conditions_json JSONB , -- エントリー条件 (JSONで格納)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_trade_parameters
-- BEFORE UPDATE ON sptch_trade_parameters
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sptch_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    transaction_type VARCHAR(10) NOT NULL, -- 取引タイプ ('long', 'short')
    entry_signal_id BIGINT NOT NULL REFERENCES sptch_entry_signals(id) ON DELETE RESTRICT, -- エントリーシグナル条件への外部キー
    exit_signal_id BIGINT REFERENCES sptch_exit_signals(id) ON DELETE SET NULL, -- エグジットシグナル条件への外部キー（NULL許容）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_signals
-- BEFORE UPDATE ON sptch_signals
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sptch_entry_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    conditions_json JSONB NOT NULL, -- エントリー条件 (JSONで格納)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_entry_signals
-- BEFORE UPDATE ON sptch_entry_signals
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sptch_exit_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    conditions_json JSONB NOT NULL, -- エグジット条件 (JSONで格納)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_exit_signals
-- BEFORE UPDATE ON sptch_exit_signals
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE sptch_fee_taxes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    buy_fee_rate NUMERIC(8,5) NOT NULL, -- 買い手数料率
    sell_fee_rate NUMERIC(8,5) NOT NULL, -- 売り手数料率
    tax_rate NUMERIC(8,5) NOT NULL, -- 税率
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_fee_taxes
-- BEFORE UPDATE ON sptch_fee_taxes
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();


ALTER TABLE public.sptch_analysis_conditions DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_stock_selections_header DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_stock_selections_stocks DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_simulation_periods DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_trade_parameters DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_entry_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_exit_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_fee_taxes DISABLE ROW LEVEL SECURITY; 

GRANT USAGE ON SCHEMA "public" TO anon; 
GRANT USAGE ON SCHEMA "public" TO authenticated; 

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated; 
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;

-- シーケンスへのアクセス権限 (INSERT時の自動採番ID生成に必要)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO anon;

```

</details>

## 準備
- 評価対象の企業を選定する。
### 対象選定
- 企業の一覧は、個人ポートフォリオを指定することで対象とする。
### 機械的な条件で省けるもの
| カテゴリ   | イベント   | 解説  |
| ---------- | ------------------------------ | -------------------------------------------------- |
| 決算発表日 | 四半期決算 | 突発的な窓開け・高出来高になりやすいため、省く想定 |
| 出来高平均 | 出来高| 株式の売買が容易|
| 株価  | 株価１００以上を想定 | 突発的な動きになる可能性あり   |
| 資本金| 想定外の動きの回避１００億以上 |  |

### 省くのが難しいもの

| カテゴリ  | イベント    | 解説 ||
| -------------- | ------------------------------------ | ------------------------------------------------------ | --------------------------------- |
| 決算関連  | 業績修正    | 突発的な窓開け・高出来高になりやすい    | APIで入手が困難    |
| 決算内容  | 決算表開示  | 結果次第・読み方次第なので    | APIで入手が困難、人での判断が必要 |
| 株式アクション | 増資、株式分割、自社株買い、配当発表 | 流動性や需給が急変します | APIで入手が困難    |
| IR/適時開示    | 大口契約、新製品発表、M\&A、事業譲渡 | 市場の期待・失望を大きく動かす要素 | APIで入手が困難    |
| 金融制度  | 日銀政策、金利変更、為替介入    | 外需系銘柄などに強い影響 | APIで入手が困難    |
| 経済指標  | 雇用統計、GDP、インフレ率  | 特にマクロ影響の強い業種は注意（銀行、輸出、建設など） | APIで入手が困難    |
| 政治・規制| 法改正、規制強化、政権交代 | インフラ・IT・金融などに特に影響大 | APIで入手が困難    |
| 海外市場  | 米FOMC、米決算、地政学リスク    | 時差の関係で翌営業日にギャップが生じやすい   | APIで入手が困難    |
| 災害/突発事象  | 地震・感染症・戦争・テロ   | 非連続な売買の原因となるため除外が望ましい   | APIで入手が困難    |

## 手順
- １：仮説の構築【仮説瀬舘】
  - Case１：平均サイン：３日間で、３％以上上がっている（過去x日間、y%以上の上昇が確認できる）
  - Case２：ゴールデンクロス：過去ｘ日間でゴールデンクロス発生、（a日平均線、b日平均線を基準に）
  - Case３：MACDサイン：過去ｘ日間でMACDでのサイン発生
  - Case４：パーフェクトオーダー：
 - 各サインは逆も想定すること 購入、売却でなく、空売り、購入の流れ。
- ２：仮説にあった株券、日付の調査【処理・仮説評価】
- ３：１０日間後への移動（n日後）
- ４；値動き評価・確認【処理・情報収集】
- ５：評価を分析  【評価画面】
　- 「１：仮説の構築」へ  
  **これの繰り返しで、４の評価を高くする**

### Case 1：平均線サイン

* **内容**：3日間で3％以上の上昇など、**一定期間内に急上昇している銘柄を探すケース**
* 「平均サイン」
「平均サイン：３日間で、３％以上上がっている（過去x日間、y%以上の上昇が確認できる）」という条件でサイン（シグナル）を作成する場合、株価や暗号資産などのトレンド分析や売買サインとして有効です。ただし、メリットや注意点を整理しておくと、精度や運用効率を高められます。

#### ✅ メリット
##### 1. **短期トレンドの把握が容易**
* 3日間・3%以上の上昇は、比較的短期で明確な上昇トレンドを示すため、短期売買において有効なシグナルになりやすいです。
##### 2. **客観的で再現性がある**
* 数値ベースの条件なので、誰が検証しても同じサインを再現できます。アルゴリズムトレードにも転用しやすいです。
##### 3. **バックテストがしやすい**

* 「過去x日間でy%以上」などパラメータを変えて検証することで、戦略の有効性を検証しやすくなります。

#### ⚠️ 注意点・デメリット
##### 1. **「だまし」の可能性**
* 短期的な急騰や一時的なニュースによって一時的に3%以上上昇しても、継続的なトレンドでない可能性があります。
　**対策：**
　- 出来高も条件に入れる（例：出来高が平均の2倍以上）。
　- 直近の安値や移動平均線の位置も見る。
##### 2. **レンジ相場に弱い**
* 横ばい（レンジ）相場の中で一時的に3%上がることがあり、すぐに反落するケースもあります。
　**対策：**
　- RSIやMACDと併用して、過熱感を判断。
　- ブレイクアウト条件も加える。

##### 3. **日数や割合のパラメータ選定が難しい**

* 3日・3%が最適とは限らず、銘柄や市場ごとに変える必要があります。

　**対策：**
　- セクター別、銘柄ボラティリティ別に条件を柔軟に設定。
　- バックテストで最適な「x日」「y%」を探る。
##### 4. **過去の再現性 ≠ 未来の予測性**
* 過去に機能した条件が今後も機能するとは限らない。
　**対策：**
　- 定期的な戦略の見直し。
　- 過剰最適化（オーバーフィッティング）に注意。

#### ✅ おすすめの実装パラメータ例

| 条件名   | 内容    |
| -------- | ------------------------------------------ |
| `x日間`  | 3〜5日程度が多い。変動の早い市場なら短く。 |
| `y%`| 2〜5%。銘柄ボラティリティにより調整。 |
| 補助条件 | 出来高増、移動平均上抜け、RSI30→50、など   |
#### 🧠 まとめ
* メリット：短期トレンドを数値で定義できる、再現性が高い。
* 注意点：だまし、相場状況依存、パラメータ選定に注意。
* 補強策：他指標との併用、出来高や移動平均との合わせ技。



### Case 2：ゴールデンクロスシグナル（Golden Cross Signal）

* **内容**：**短期移動平均線が長期移動平均線を上抜ける現象**
* 「ゴールデンクロス検出」

### Case 3：MACDシグナル（MACD Signal）

* **内容**：MACDがシグナルラインを上抜ける、またはゼロラインを越えるなどの**MACDに基づくサイン**
* 「MACD上昇サイン」
  * 意味：MACDが上向きに転じたこと全般を指す。
  * 範囲：シグナルラインを上抜けた／ゼロラインを超えた、両方含む可能性がある。
  * 曖昧さ：やや広め。MACD自体が上向きでも、シグナルを抜けていないケースも含むかもしれない。

* 通常のMACD：
  * 短期EMA（例：12） - 長期EMA（例：26） = MACD線
  * MACD線とそのシグナル（例：9日EMA）を使ってクロスやゼロライン突破を判断

| 用語 | 内容   |
| -------------- | ------------------------------------ |
| EMA(12)   | 直近12日間の価格に基づく指数移動平均 |
| EMA(26)   | 直近26日間の価格に基づく指数移動平均 |
| MACD | EMA(12) − EMA(26)|
| シグナルライン | MACDの9日EMA|

#### 変数
12-26-9


| 指標| 特徴    |
| ----------------------- | ---------------------------------------------------- |
| **単純移動平均（SMA）** | 過去n日分をすべて「同じ重み」で平均する    |
| **指数移動平均（EMA）** | **直近の価格に大きな重み**、古い価格は徐々に軽くなる |


| 用語| 内容   |
| ------------------ | -------------------------------------------------------------------------------------- |
| **MACD** | 2本の移動平均線（短期・長期）の差をとって得られる指標（例：12日EMA − 26日EMA）    |
| **シグナルライン** | 上記MACDの**9日間の指数移動平均（EMA）**。MACDの動きをスムーズにして、売買判断に使う線 |


🔢 MACDの基本構成
* 短期EMA（例：12日）
* 長期EMA（例：26日）
* MACD線 ＝ 12日EMA − 26日EMA（トレンドの勢いを表す）
* シグナルライン ＝ MACD線の 9日EMA

 一般的な売買シグナル：
| シグナル | 意味|
| ---------------------------- | ------------------ |
| MACDがシグナルラインを上抜け | 買いサイン（上昇） |
| MACDがシグナルラインを下抜け | 売りサイン（下降） |
> MACDの勢いが強くなり、9日間の平均を上回ったタイミングを「トリガー」として見る。

メモ）
補足：MACDについて
短期指数移動平均線: 通常 12日間
長期指数移動平均線: 通常 26日間
シグナル線: 通常 9日間 (MACD線の9日移動平均)
MACD線: これは、短期移動平均線から長期移動平均線を引いたものです。トレンドの方向性と勢いを示します。
シグナル線: これは、MACD線の移動平均線です（通常はMACD線の9日移動平均）。MACD線の動きを平滑化し、売買シグナルを判断するために使われます。
ヒストグラム: MACD線とシグナル線の差を棒グラフで表したものです。トレンドの強弱や転換点を示します。
ゴールデンクロスやデッドクロスといった売買サインは、この「MACD線」が「シグナル線」をクロスする時に発生します。


### Case 4：パーフェクトオーダーシグナル（Perfect Order Signal）

* **内容**：短期・中期・長期の移動平均線が上から順に整列している、**強い上昇トレンドの形**
* **例名**：
  * 「パーフェクトオーダー」
  価格
　↑
　5日移動平均線（最も反応が早い）
　25日移動平均線（中期）
　75日移動平均線（長期）

 | 用語 | 指標  | 内容    | 厳密には…    |
 | ------------------------ | ---------- | ------------------------------------- | ---------------------------------------------------- |
 | **パーフェクトオーダー** | 移動平均線 | 5日・25日・75日などが順に上向きに並ぶ | テクニカル分析で非常に多用される 4-20-60で作ってみる |
 | **三役上昇揃い**    | 一目均衡表 | 転換線・基準線・雲・遅行線の関係 | より伝統的かつ複雑な指標    |

変数：５日線→X日線、２５日→Ｙ日線、７５日線→Ｚ日線　変数で、4-20-60を想定

| 移動平均 | 日数| 主な意味・役割  |
| -------- | -------- | --------------------------------------------------------------------------- |
| 短期線   | **5日**  | \*\*1週間（営業日ベース）\*\*の平均。トレーダーの超短期的な動き・勢いを表す |
| 中期線   | **25日** | \*\*約1か月（営業日）\*\*の平均。短期と長期の中間的なトレンドを反映    |
| 長期線   | **75日** | \*\*約3か月（1四半期）\*\*の平均。中長期の方向感を示す  |


---
### 仮説立案ー１
* 三日間で３％の上昇が見られる場合は、継続して１３日間で１０％の上昇は推定できる。


#### ④ 特徴量の作成（Feature Engineering）

* 株価毎に、仮説に対しての実現率を調査する
  * 起点（株購入時点）の変数Ａ日前（３日前など）
  * 起点（株購入時点）と変数Ａ日前での値上がり率：変数Ｂ％（３％など）
  * 起点（株購入時点）の変数Ｃ日後（１０日後など）
  * 起点（株購入時点）と変数Ｃ日後での値上がり率：変数Ｄ％（１０％など）



#### ⑤ ラベリング（必要に応じて）

* **分類問題（上がる/下がる）** → ラベル（1:上昇, 0:下降）を付ける


#### ⑨ 可視化・レポート化

* 変数に応じて、より正確に近いデータを確認できるようにする。

---

### 仮説立案ー２
* ゴールデンクロス発生後の投資額に応じての利益率
* ゴールデンクロスの指標は２０日線、８０日線とする。

#### ④ 特徴量の作成（Feature Engineering）

* 株価毎に、仮説に対しての実現率を調査する
  * 起点はゴールデンクロス発生日とする
  * 起点（株購入時点）の変数A日後（１０日後など）
  * 起点（株購入時点）と変数A日後での値上がり率：変数B％（１０％など）



#### ⑤ ラベリング（必要に応じて）

* **分類問題（上がる/下がる）** → ラベル（1:上昇, 0:下降）を付ける


#### ⑨ 可視化・レポート化

* 変数に応じて、より正確に近いデータを確認できるようにする。

---


### 仮説立案ー３
* MACDでの数値が好転した場合
    * MACDとは株価のトレンド（方向性）や転換点を把握するために使われるテクニカル指標
#### ④ 特徴量の作成（Feature Engineering）

* 株価毎に、仮説に対しての実現率を調査する
  * 起点はゴールデンクロス発生日とする
  * 起点（株購入時点）の変数A日後（１０日後など）
  * 起点（株購入時点）と変数A日後での値上がり率：変数B％（１０％など）

### 仮説立案ー３
* MACDでの数値が好転した場合
    * MACDとは株価のトレンド（方向性）や転換点を把握するために使われるテクニカル指標
#### ④ 特徴量の作成（Feature Engineering）

* 株価毎に、仮説に対しての実現率を調査する
  * 起点はゴールデンクロス発生日とする
  * 起点（株購入時点）の変数A日後（１０日後など）
  * 起点（株購入時点）と変数A日後での値上がり率：変数B％（１０％など）

### 仮説立案ー４
* パーフェクトオーダー

#### ⑤ ラベリング（必要に応じて）

* **分類問題（上がる/下がる）** → ラベル（1:上昇, 0:下降）を付ける


#### ⑨ 可視化・レポート化

* 変数に応じて、より正確に近いデータを確認できるようにする。




---


### ServerFunction
#### StockCode0002

<details>
<summary>StockCode0002</summary>

``` SQL
-- 関数: analyze_stock_00003
-- Next.js/Vercel、Server Actionなどのフロントエンドから呼び出されることを想定し、
-- 株価の仮説分析を動的なパラメータと日付範囲で行います。
-- 指定された期間と変動率に基づいて、仮説の前提条件の達成状況、結果条件の達成状況、
-- および各分析ポイントの詳細な情報（株価、日付、仮説ラベルなど）をテーブル形式で返します。
CREATE OR REPLACE FUNCTION analyze_stock_00003(
    p_stock_code TEXT DEFAULT NULL, -- 分析対象の銘柄コード (NULLの場合は全銘柄)
    p_start_date_range_start DATE DEFAULT NULL, -- 分析の起点となる日付範囲の開始日 (NULLの場合は今日の日付を使用)
    p_start_date_range_end DATE DEFAULT NULL,   -- 分析の起点となる日付範囲の終了日 (NULLの場合は今日の日付を使用)
    p_variable_a_days INT DEFAULT 3,-- 仮説の前提条件となる日数 (起点からA日前)
    p_variable_b_percent NUMERIC DEFAULT 3.0, -- 仮説の前提条件となる上昇率 (%)
    p_variable_c_days INT DEFAULT 13,    -- 仮説の結果条件となる日数 (起点からC日後)
    p_variable_d_percent NUMERIC DEFAULT 10.0 -- 仮説の結果条件となる上昇率 (%)
)
RETURNS TABLE (
    stock_code TEXT,-- 銘柄コード
    start_date DATE,-- 起点の日付
    date_a_days_ago DATE,-- 起点A日前での日付
    close_a_days_ago NUMERIC, -- 起点A日前での株価
    current_close NUMERIC,    -- 起点での株価
    date_c_days_forward DATE, -- 起点C日後での日付
    close_c_days_forward NUMERIC, -- 起点C日後での株価
    change_percent_a_days NUMERIC, -- 変数A日間の変化率 (%)
    change_percent_c_days NUMERIC, -- 変数C日間の変化率 (%)
    condition_a_b_met INT,    -- 仮説の前提条件 (A日間B%上昇) を達成したかどうか (1:達成, 0:未達成)
    condition_c_d_met INT,    -- 仮説の結果条件 (C日間D%上昇) を達成したかどうか (1:達成, 0:未達成)
    hypothesis_label INT -- 仮説ラベル (1:成功, 0:失敗)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- RETURN QUERY の後に続く SELECT ステートメント全体でロジックを構成します。
    -- p_start_date_range_start と p_start_date_range_end のNULLチェックはCOALESCE関数で処理します。
    RETURN QUERY
    WITH relevant_quotes AS (
   SELECT
  sq.code,
  sq.date,
  sq.close,
  -- PARTITION BY code ORDER BY date で銘柄ごとに日付順で処理し、
  -- p_variable_a_days日前の終値とその日付を取得します。
  LAG(sq.close, p_variable_a_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS close_a_days_ago,
  LAG(sq.date, p_variable_a_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS date_a_days_ago,
  -- p_variable_c_days日後の終値とその日付を取得します。
  LEAD(sq.close, p_variable_c_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS close_c_days_forward,
  LEAD(sq.date, p_variable_c_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS date_c_days_forward
   FROM
  spt_daily_quotes sq
   WHERE
  -- 特定の銘柄コードが指定されていればフィルタリング、そうでなければ全銘柄
  (p_stock_code IS NULL OR sq.code = p_stock_code)
  -- 分析に必要な全期間（起点範囲の開始A日前から終了C日後まで）のデータを取得
  -- COALESCEでNULLの場合にCURRENT_DATEを使用
  AND sq.date BETWEEN
 (COALESCE(p_start_date_range_start, CURRENT_DATE) - p_variable_a_days)
 AND (COALESCE(p_start_date_range_end, CURRENT_DATE) + p_variable_c_days)
    ),
    -- 株価変化率を計算し、起点となる日付範囲のデータのみを対象とします。
    calculated_changes AS (
   SELECT
  rq.code,
  rq.date,
  rq.close AS current_close,
  rq.date_a_days_ago,
  rq.close_a_days_ago,
  rq.date_c_days_forward,
  rq.close_c_days_forward,
  -- 変数A日間の株価変化率を計算します。ゼロ除算を避けるためにNULLIFを使用します。
  CASE
 WHEN rq.close_a_days_ago IS NOT NULL AND rq.close_a_days_ago != 0 THEN ((rq.close - rq.close_a_days_ago) / rq.close_a_days_ago) * 100
 ELSE NULL
  END AS change_percent_a_days,
  -- 変数C日後の株価変化率を計算します。
  CASE
 WHEN rq.close_c_days_forward IS NOT NULL AND rq.close != 0 THEN ((rq.close_c_days_forward - rq.close) / rq.close) * 100
 ELSE NULL
  END AS change_percent_c_days
   FROM
  relevant_quotes rq
   WHERE
  -- 起点となる日付範囲内のデータのみを最終的な分析対象とする
  -- COALESCEでNULLの場合にCURRENT_DATEを使用
  rq.date BETWEEN COALESCE(p_start_date_range_start, CURRENT_DATE) AND COALESCE(p_start_date_range_end, CURRENT_DATE)
  -- 仮説に必要な過去と未来のデータが存在することを保証
  AND rq.close_a_days_ago IS NOT NULL
  AND rq.close_c_days_forward IS NOT NULL
  AND rq.date_a_days_ago IS NOT NULL
  AND rq.date_c_days_forward IS NOT NULL
    ),
    -- 仮説の前提条件と結果条件を評価し、ラベリングします。
    hypothesis_results AS (
   SELECT
  cc.code,
  cc.date AS start_date, -- 起点日時
  cc.current_close, -- 起点での株価
  cc.date_a_days_ago,    -- 起点A日前での日付
  cc.close_a_days_ago,   -- 起点A日前での株価
  cc.date_c_days_forward, -- 起点C日後での日付
  cc.close_c_days_forward, -- 起点C日後での株価
  cc.change_percent_a_days, -- 変数A日間の変化率
  cc.change_percent_c_days, -- 変数C日間の変化率
  -- 仮説の前提条件: 変数A日間で変数B%以上の上昇が確認されたかどうか (1:達成, 0:未達成)
  CASE
 WHEN (cc.change_percent_a_days IS NOT NULL AND cc.change_percent_a_days >= p_variable_b_percent) THEN 1
 ELSE 0
  END AS condition_a_b_met,
  -- 仮説の結果条件: 変数C日間で変数D%以上の上昇が確認されたかどうか (1:達成, 0:未達成)
  CASE
 WHEN (cc.change_percent_c_days IS NOT NULL AND cc.change_percent_c_days >= p_variable_d_percent) THEN 1
 ELSE 0
  END AS condition_c_d_met, -- ここが変更点
  -- 仮説のラベリング:
  -- 前提条件を満たし、かつ結果条件も満たした場合は 1 (成功)
  -- 前提条件は満たしたが、結果条件を満たさなかった場合は 0 (失敗)
  -- 仮説の前提条件を満たさない場合も 0 (失敗) とする
  CASE
 WHEN (cc.change_percent_a_days IS NOT NULL AND cc.change_percent_a_days >= p_variable_b_percent) THEN
CASE
    WHEN (cc.change_percent_c_days IS NOT NULL AND cc.change_percent_c_days >= p_variable_d_percent) THEN 1 -- 仮説成功
    ELSE 0 -- 仮説失敗 (前提条件は満たしたが結果条件は満たさず)
END
 ELSE 0 -- 仮説失敗 (前提条件を満たさず)
  END AS hypothesis_label
   FROM
  calculated_changes cc
    )
    -- hypothesis_results から各レコードをテーブル形式で返します。
    SELECT
   hr.code,
   hr.start_date,
   hr.date_a_days_ago,
   hr.close_a_days_ago,
   hr.current_close,
   hr.date_c_days_forward,
   hr.close_c_days_forward,
   hr.change_percent_a_days,
   hr.change_percent_c_days,
   hr.condition_a_b_met,
   hr.condition_c_d_met, -- 新しく追加された列
   hr.hypothesis_label
    FROM
   hypothesis_results hr
    ORDER BY
   hr.code, hr.start_date;
END;
$$;

```

</details>

<details>
<summary>analyze_stock_00003</summary>

```SQL
CREATE FUNCTION dbo.analyze_stock_00003 (
    @p_stock_code NVARCHAR(10) = NULL, -- 分析対象の銘柄コード (NULLの場合は全銘柄)
    @p_start_date_range_start DATE = NULL,   -- 分析の起点となる日付範囲の開始日 (NULLの場合は今日の日付を使用)
    @p_start_date_range_end DATE = NULL,-- 分析の起点となる日付範囲の終了日 (NULLの場合は今日の日付を使用)
    @p_variable_a_days INT = 3,    -- 仮説の前提条件となる日数 (起点からA日前)
    @p_variable_b_percent DECIMAL(5, 2) = 3.0,    -- 仮説の前提条件となる上昇率 (%)
    @p_variable_c_days INT = 13,   -- 仮説の結果条件となる日数 (起点からC日後)
    @p_variable_d_percent DECIMAL(5, 2) = 10.0    -- 仮説の結果条件となる上昇率 (%)
)
RETURNS @result TABLE (
    stock_code NVARCHAR(10),-- 銘柄コード
    start_date DATE,   -- 起点の日付
    date_a_days_ago DATE,   -- 起点A日前での日付
    close_a_days_ago DECIMAL(18, 2),  -- 起点A日前での株価
    current_close DECIMAL(18, 2),    -- 起点での株価
    date_c_days_forward DATE,   -- 起点C日後での日付
    close_c_days_forward DECIMAL(18, 2), -- 起点C日後での株価
    change_percent_a_days DECIMAL(5, 2), -- 変数A日間の変化率 (%)
    change_percent_c_days DECIMAL(5, 2), -- 変数C日間の変化率 (%)
    condition_a_b_met INT,  -- 仮説の前提条件 (A日間B%上昇) を達成したかどうか (1:達成, 0:未達成)
    condition_c_d_met INT,  -- 仮説の結果条件 (C日間D%上昇) を達成したかどうか (1:達成, 0:未達成)
    hypothesis_label INT    -- 仮説ラベル (1:成功, 0:失敗)
)
AS
BEGIN
    -- 仮説の前提条件と結果条件を評価し、テーブルを返します
    WITH relevant_quotes AS (
   SELECT
  sq.code,
  sq.date,
  sq.[close],
  -- LAG と LEAD を使って日付A日前とC日後のデータを取得
  LAG(sq.[close], @p_variable_a_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS close_a_days_ago,
  LAG(sq.date, @p_variable_a_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS date_a_days_ago,
  LEAD(sq.[close], @p_variable_c_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS close_c_days_forward,
  LEAD(sq.date, @p_variable_c_days) OVER (PARTITION BY sq.code ORDER BY sq.date) AS date_c_days_forward
   FROM
  spt_daily_quotes sq
   WHERE
  -- 特定の銘柄コードが指定されていればフィルタリング、そうでなければ全銘柄
  (@p_stock_code IS NULL OR sq.code = @p_stock_code)
  -- 分析に必要な全期間（起点範囲の開始A日前から終了C日後まで）のデータを取得
  AND sq.date BETWEEN
 (COALESCE(@p_start_date_range_start, GETDATE()) - @p_variable_a_days)
 AND (COALESCE(@p_start_date_range_end, GETDATE()) + @p_variable_c_days)
    ),
    -- 株価変化率を計算
    calculated_changes AS (
   SELECT
  rq.code,
  rq.date,
  rq.[close] AS current_close,
  rq.date_a_days_ago,
  rq.close_a_days_ago,
  rq.date_c_days_forward,
  rq.close_c_days_forward,
  -- 変数A日間の株価変化率
  CASE
 WHEN rq.close_a_days_ago IS NOT NULL AND rq.close_a_days_ago != 0 THEN ((rq.[close] - rq.close_a_days_ago) / rq.close_a_days_ago) * 100
 ELSE NULL
  END AS change_percent_a_days,
  -- 変数C日後の株価変化率
  CASE
 WHEN rq.close_c_days_forward IS NOT NULL AND rq.[close] != 0 THEN ((rq.close_c_days_forward - rq.[close]) / rq.[close]) * 100
 ELSE NULL
  END AS change_percent_c_days
   FROM
  relevant_quotes rq
   WHERE
  -- 起点となる日付範囲内のデータ
  rq.date BETWEEN COALESCE(@p_start_date_range_start, GETDATE()) AND COALESCE(@p_start_date_range_end, GETDATE())
  AND rq.close_a_days_ago IS NOT NULL
  AND rq.close_c_days_forward IS NOT NULL
  AND rq.date_a_days_ago IS NOT NULL
  AND rq.date_c_days_forward IS NOT NULL
    ),
    -- 仮説の前提条件と結果条件を評価
    hypothesis_results AS (
   SELECT
  cc.code,
  cc.date AS start_date,
  cc.current_close,
  cc.date_a_days_ago,
  cc.close_a_days_ago,
  cc.date_c_days_forward,
  cc.close_c_days_forward,
  cc.change_percent_a_days,
  cc.change_percent_c_days,
  -- 仮説の前提条件を評価
  CASE
 WHEN (cc.change_percent_a_days IS NOT NULL AND cc.change_percent_a_days >= @p_variable_b_percent) THEN 1
 ELSE 0
  END AS condition_a_b_met,
  -- 仮説の結果条件を評価
  CASE
 WHEN (cc.change_percent_c_days IS NOT NULL AND cc.change_percent_c_days >= @p_variable_d_percent) THEN 1
 ELSE 0
  END AS condition_c_d_met,
  -- 仮説のラベリング
  CASE
 WHEN (cc.change_percent_a_days IS NOT NULL AND cc.change_percent_a_days >= @p_variable_b_percent) THEN
CASE
    WHEN (cc.change_percent_c_days IS NOT NULL AND cc.change_percent_c_days >= @p_variable_d_percent) THEN 1 -- 成功
    ELSE 0 -- 失敗
END
 ELSE 0 -- 失敗
  END AS hypothesis_label
   FROM
  calculated_changes cc
    )
    -- hypothesis_results からデータを返す
    INSERT INTO @result
    SELECT
   hr.code,
   hr.start_date,
   hr.date_a_days_ago,
   hr.close_a_days_ago,
   hr.current_close,
   hr.date_c_days_forward,
   hr.close_c_days_forward,
   hr.change_percent_a_days,
   hr.change_percent_c_days,
   hr.condition_a_b_met,
   hr.condition_c_d_met,
   hr.hypothesis_label
    FROM
   hypothesis_results hr
    ORDER BY
   hr.code, hr.start_date;

    RETURN;
END;

--sample
SELECT *
FROM dbo.analyze_stock_00003(
    '2667', -- 銘柄コード (NULLの場合は全銘柄)
    '2024-01-01',   -- 分析の起点となる日付範囲の開始日
    '2025-01-31',   -- 分析の起点となる日付範囲の終了日
    3,    -- 仮説の前提条件となる日数
    3.0,  -- 仮説の前提条件となる上昇率 (%)
    13,   -- 仮説の結果条件となる日数
    10.0  -- 仮説の結果条件となる上昇率 (%)
);
```


</details>


---

### StockCompass MVP 画面・機能提案

#### MVPのコア機能（仕様書に基づき再確認）

* **目的**: ユーザーが株式投資において「もしあの時買っていたら、売っていたら」という疑問を解消し、具体的な根拠に基づいた自信ある売買判断を下せる環境を提供すること。
* **中核**: 過去の株価データに基づいた「買い・売りシグナル」の提供と、そのシグナルが過去の相場でどれほどの成果を上げたかを具体的に示す「シミュレーション機能」。
* **前提の仮説**:
    * **Case 1: 平均サイン**：「3日間で3%以上の上昇が見られる場合は、継続して13日間で10%の上昇は推定できる。」（またはこれに準ずるルールベースの仮説）
    * **取引の前提**: 株の購入金額上限、出来高、100単位での購入、手数料、税金などを考慮。

---

#### MVPで実装すべき「画面」と「機能」の提案

MVPの範囲として、ユーザーが以下の主要なステップを実行できることを目指します。

1.  **銘柄の選定（フィルター）**
2.  **売買条件（シグナル・出口）の設定**
3.  **シミュレーション実行**
4.  **結果の確認**

これを実現するための画面と機能は以下の通りです。

---

**【MVP 画面一覧】**

仕様書にある「画面一覧」をベースに、MVPとして必要なものを厳選し、ユーザーのフローに沿って再構成しました。

1.  **ログイン画面 `[1]` / サインアップ画面 `[2]`**
    * **目的**: アプリケーションへのアクセス。
    * **理由**: 必須機能。ユーザー認証とセッション管理の基盤。
    * **主要要素**: ユーザー認証フォーム。
    * →実装済

2.  **メイン画面（またはダッシュボード） `[4]`**
    * **目的**: アプリケーションの入り口。各機能へのナビゲーションハブ。
    * **理由**: ユーザーがログイン後最初に訪れる場所。主要機能への導線を提供。
    * **主要要素**: 各機能へのリンクボタン（例: ポートフォリオ、シミュレーション設定など）。
    * →実装済

3.  **ポートフォリオ一覧画面 `[6]`**
    * **目的**: ユーザーが作成したポートフォリオの管理と選択。
    * **理由**: シミュレーション対象銘柄の選定に「ポートフォリオがあれば、そこから銘柄コードの一覧を入手する」という記述があるため、MVP段階でポートフォリオを通じた銘柄選定は重要。
    * **主要要素**: ポートフォリオのリスト、新規作成、編集、削除機能。
    * →実装済

4.  **ポートフォリオ画面（詳細） `[7]`**
    * **目的**: 特定のポートフォリオ内の銘柄管理。
    * **理由**: ポートフォリオ内の銘柄の追加・削除、個々の銘柄の保有情報管理（もしMVPで「保有数」「購入価格」を考慮するなら）。
    * **主要要素**: 銘柄の追加/削除、銘柄リスト表示。
    * →実装済

5.  **シグナル・出口条件設定画面（統合または簡易版）**
    * **目的**: シミュレーションに用いる買い・売り条件を設定。
    * **理由**: 仕様の `Step5`「株価上昇サインの仮設を立てる」と `Step6`「売却条件の入力」に該当。MVPでは、まずは「仮説立案ー１：三日間で３％の上昇が見られる場合は、継続して１３日間で１０％の上昇は推定できる」の条件設定に特化。
    * **主要要素**:
   * ポートフォリオ選択
   * 銘柄条件
* 間近の週平均で出来高の下限
* 企業規模（時価総額の範囲指定１０億～１００億など・指定なしも許容する）
   * サイン検知期間（基準日の範囲を指定）
* 基準日は６月３日から６月５日でのサインの有無を行うのなら、基準日は６月６日になる
   * 株価上昇サイン探知条件（日数（３日間）など、上昇率（３％など））
* ひとまずは仮説立案１のみ対応
   * 出口探知条件
* １）サイン確認後翌日のCloseの値と指定日数後の株価
* ２）指定日後以前での株売却条件への適合
  * １０％以上値上がり、１０％以上値下がりしたら出口条件クリアとみなす。
   * 購入・売却単位、手数料
    * **補足**
 * ポートフォリオは指定されているので、株価の情報はすでにあるものとする。
 * 株
6.  **仮説検証結果 `[12]` (または `[7]` 内のタブ)**
    * **目的**: 「５」で作成した仮説がどれだけ成果を出しているかの確認
    * **主要要素**:
   * 総損益額、損益率。
   * サイン発生率、検証対象数
   * 個別株でのサイン発生率、その内訳
   * 個別株での実績（総損益額、損益率。）

7.  **株価チャート画面 `[10]`**
    * **目的**: 個別銘柄の株価チャート表示。
    * **理由**: シミュレーション結果の視覚的確認や、銘柄分析の補助として必須。
    * **主要要素**: 日足チャート、移動平均線表示、拡大縮小、期間選択。
    * →実装済み

---

**【MVP 機能一覧】**

MVPとして優先的に実装すべき機能は、上記の画面でユーザーが実行する主要な操作です。

1.  **ユーザー認証・管理**
    * ユーザー登録 (サインアップ)
    * ログイン/ログアウト
    * ユーザー情報の基本編集 (パスワード変更など)

2.  **ポートフォリオ管理**
    * ポートフォリオの作成、編集（タイトル、説明）、削除
    * ポートフォリオ一覧表示とDndによる並び替え
    * ポートフォリオへの銘柄追加、削除

3.  **銘柄データ管理**
    * **YahooFinanceAPIからの日次株価データ取得**（`spt_daily_quotes` への蓄積）
   * これはバックエンド処理として定期的に実行されるか、`[14] APIデータ確認画面` の簡易版として手動実行を想定。MVPでは、まずはデータが存在すること前提で進めるのが効率的。
    * `spt_stocks`, `spt_company_stock_details` への銘柄基本情報の登録。

4.  **シミュレーションエンジン（中核）**
    * **「摘出処理」ロジックの実装**:
   * ユーザーが指定した銘柄（ポートフォリオから選択）、期間、**MVPのコア仮説（例: `analyze_stock_00003` 関数のような3日間3%上昇、13日後10%上昇）**、および取引前提（手数料、税金、単位）に基づき、過去データで仮想売買を実行。
   * 総損益、損益率、取引履歴の計算。
   * 結果のデータベースへの保存（`spt_simulations`, `spt_simulation_trades`）。
    * **条件フィルタリング**:
   * 「購入金額は50万円以下」、「出来高はXXX以上」などの、指定された「前提」をシミュレーションロジックに組み込む。

5.  **結果表示**
    * シミュレーション結果（総損益、損益率、取引履歴）の表示。
    * 銘柄別チャート表示。

---

**【MVPから除外を検討する機能（フェーズ2以降）】**

* **高度なフィルター条件設定**（複雑な日付条件、決算発表前後除外など）: 初期は基本的なフィルターに絞る。
* **複数のシグナル条件**（ゴールデンクロス、MACD、パーフェクトオーダーなど）： MVPではまず1つの代表的な仮説に絞る。
* **シグナル通知機能** `[5]`： シミュレーション結果の確認を優先し、通知は後回し。
* **高度なグラフ表示**： 初期は基本的な折れ線グラフで十分。
* **参照履歴一覧画面** `[15]`： MVPでは必須ではない。
* **ユーザー一覧画面** `[16]`： 管理者機能はMVPでは後回し。
* **データマスキング・加工要件**： まずは基本的なデータ表示から。
* **認証トークンの取得**： YahooFinanceAPIのデータ取得がバックエンドで行われるなら、直接ユーザーには見えないためMVPでは簡略化。
* **メール通知**： アプリ内通知を優先。

---


## 将来的にしたいこと
### ⑥ モデルの選択と学習

* **ルールベース検証**：最初の仮説をスクリプトで検証
* **機械学習を使うなら：**

  * ランダムフォレスト、XGBoost、LightGBM（初心者にも扱いやすい）
  * 時系列モデル：ARIMA、Prophet、LSTM（時系列性を活かすなら）

---

### ⑦ バックテスト（過去データで検証）

* 検証期間を「トレーニング」「検証」「テスト」に分ける（例: 60%/20%/20%）
* **指標例**：

  * 正解率、F1スコア、平均絶対誤差（MAE）、損益曲線（戦略の収益性）

---

### ⑧ 評価・改善

* 仮説が有効かどうかを判断
* 改善アイデア：

  * 特徴量を変える
  * 仮説を組み合わせる
  * モデルをチューニングする


## 💡補足

* 株価は**ノイズが多く再現性が低い**領域なので、**仮説検証型**は現実的かつ堅実なアプローチです。
* 初期は「ルールベース＋バックテスト」で全体像を掴み、精度向上を目指すなら機械学習に発展させるのがおすすめです。


## 検討すること
* Vercelのサーバーアクションで頑張る方が、体験的には優位
* Yahoo.APIからの取得もサーバーアクションで頑張るケースでてくるので。
* 
![実装指針の比較（Supabaseで頑張るかServerActionで頑張るか）](./images/StockCompass_image01.drawio.png)

## 検証画面案
### プランの一覧
* 無効は一覧に上がらくなるだけです。
* すべて表示で無効も表示されます。

|参照|作成日時|作成者|名前|メモ|銘柄|スクリーニング|期間|S/L|Entry|Exit|利益率|-|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|結果参照/編集/引用新規	|2025/01/07 11:12|sickboy|検証用||(9)1234,1111,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|+2%|無効|
|結果参照/編集/引用新規	|2025/01/11 23:12|sickboy|検証用||(21)1234,2222,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|+11%|無効|
|プラン実行/編集/引用新規	|2025/01/14 20:12|sickboy|検証用||(10)5555,4444,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|-|無効|
|プラン実行/編集/引用新規	|2025/01/16 08:12|sickboy|検証用||(2)1234,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|-|無効|


### 実行履歴　プラン選択後
*ヘッダ
  * 作成日時、作成者、名前、メモ
		銘柄
    銘柄（スクリーニング後）
		スクリーニング、期間、SL
* 一覧

|起点日|銘柄| | |PERVIEW| |ENTRY| | | |EXIT| | | |RESULT| |RESULT(F)| |チャート参照|
|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|:----|
| |銘柄|名前|市場|DATE|CLOSE|DATE|CLOSE|VOLUME|PRICE|DATE|CLOSE|VOLUME|PRICE|PROFIT|P-M|PROFIT|P-M| |
|2025-01-10|1234|xxx商事|ｘｘｘｘ|2025-01-07|1,222|2025-01-10|1,240|200|248,000|2025-01-15|1,300|200|260,000|12000|5%|12000|4%|チャート参照|
|2025-02-08|1235|yyy商事|ｘｘｘｘ|2025-02-06|2,200|2025-02-08|2,300|100|230,000|2025-01-15|2,500|100|250,000|20000|9%|20000|8%|チャート参照|
|2025-02-10|9001|zzz商事|ｘｘｘｘ|2025-02-07|1,001|2025-02-10|1,201|200|240,200|2025-01-15|1,500|200|300,000|59800|-25%|59800|-25%|チャート参照|
|2025-03-10|9002|vvvvv|ｘｘｘｘ|2025-03-07|300|2025-03-10|340|600|204,000|2025-01-15|370|600|222,000|18000|-9%|18000|-9%|チャート参照|



### StockHeaderStocksの扱い
ご質問ありがとうございます。`sptch_stock_selections_stocks` で重複を避け、すでに作成済みの銘柄リストセットを再利用したいというご要望ですね。これは、単一の銘柄コードの重複防止（これは`UNIQUE (header_id, stock_code)`制約で達成済み）とは異なり、**特定の銘柄リストの組み合わせ全体**を識別し、それを再利用したいという高度な要件です。

現在のリレーショナル設計は個別の銘柄の整合性には強いですが、異なるヘッダーが全く同じ銘柄リストを持つことを直接的に防ぐメカニズムはありません。この「リストの再利用」を実現するためには、主に以下の対策が考えられます。

### 銘柄リストセットの重複防止と再利用のための対策

この問題に対応するための最も一般的なアプローチは、「銘柄リストセット」自体を一意に識別するためのハッシュ値（またはシグネチャ）を生成し、それをヘッダーテーブルに持たせることです。

#### 1\. ヘッダーテーブルに「銘柄リストのハッシュ値」カラムを追加する

`sptch_stock_selections_header` テーブルに、そのヘッダーに紐づくすべての銘柄コードと順序情報から生成されるハッシュ値を格納するカラムを追加します。

**`sptch_stock_selections_header` テーブルの拡張例:**

```sql
-- PostgreSQL の場合
ALTER TABLE sptch_stock_selections_header
ADD COLUMN stock_list_hash TEXT UNIQUE; -- または VARCHAR(64) など、ハッシュ値の長さに応じて
-- ハッシュ値で検索できるように、インデックスも追加すると良いでしょう
CREATE UNIQUE INDEX idx_sptch_stock_selections_header_stock_list_hash
ON sptch_stock_selections_header (stock_list_hash)
WHERE deleted_at IS NULL; -- 論理削除されていないもののみ対象
```

#### 2\. 新規銘柄選択条件作成時のロジック

アプリケーション側で、ユーザーが新しい銘柄選択条件を作成・保存しようとするときに、以下のロジックを実装します。

1.  **入力された銘柄リストの正規化**:
      * ユーザーが指定した銘柄コードのリスト（例：`[1234, 4321, 123]`）とそれぞれの順序情報を取得します。
      * **重要**: ハッシュ値を生成する前に、銘柄リストが常に同じ形で「正規化」されていることを確認します。例えば、銘柄コードと順序のペアを順序番号でソートしたJSON文字列にするなどです。
          * 例: `{ "stocks": [{"code":"1234", "order":1}, {"code":"4321", "order":2}, {"code":"0123", "order":3}] }`
          * 順序が関係ない場合は、銘柄コードをアルファベット順にソートした配列文字列などでも良いでしょう。
2.  **ハッシュ値の生成**:
      * 正規化された銘柄リスト文字列からハッシュ値（例: SHA256）を生成します。アプリケーションコード（JavaScript, Python, C\#など）でハッシュ関数を使用します。
3.  **既存リストの検索**:
      * 生成されたハッシュ値を使って、`sptch_stock_selections_header` テーブルを検索します。
      * `SELECT id, name FROM sptch_stock_selections_header WHERE stock_list_hash = '[生成されたハッシュ値]' AND deleted_at IS NULL;`
4.  **再利用の判断と処理**:
      * **ハッシュ値が既存のヘッダーと一致した場合**:
          * **ユーザーに選択を促す**: 「この銘柄リストは、すでに『[既存のヘッダー名]』という条件セットで登録されています。これを再利用しますか？それとも新しい条件セットとして保存しますか？」といったメッセージをユーザーに表示します。
          * **再利用を選択した場合**: 既存のヘッダーID（例: ヘッダーID:1）を、新しい分析条件（`sptch_analysis_conditions`）で参照するように設定します。新しい `sptch_stock_selections_header` レコードや、その詳細である `sptch_stock_selections_stocks` レコードは作成しません。
          * **新しい条件として保存を選択した場合**: そのまま新規の `sptch_stock_selections_header` レコードと `sptch_stock_selections_stocks` レコードを作成します。この場合、同じ銘柄リストを持つ異なるヘッダーが複数存在することになりますが、これはユーザーの意図によるものとして許容します。
      * **ハッシュ値が既存のヘッダーと一致しない場合**:
          * 通常の新規作成フローに進み、新しい `sptch_stock_selections_header` レコードと、それに紐づく `sptch_stock_selections_stocks` レコードを登録します。この際、`sptch_stock_selections_header` の `stock_list_hash` カラムには生成されたハッシュ値を保存します。

#### 3\. 考慮事項

  * **ハッシュ衝突**: 異なる入力から同じハッシュ値が生成される「ハッシュ衝突」の可能性は非常に低いですが、理論的には存在します。厳密に同一性を保証したい場合は、ハッシュが一致した際に、実際に紐づく銘柄リストの内容を詳細に比較する追加のチェックを行うことができます。
  * **パフォーマンス**: ハッシュ値の生成と検索は高速ですが、銘柄リストが非常に巨大な場合、ハッシュ生成のオーバーヘッドを考慮する必要があります。
  * **ユーザーエクスペリエンス**: ユーザーが「同じ銘柄リストだけど、別の名前で保存したい」というユースケースがある場合、上記のロジックでは重複を検知した際にその選択肢を提示することが重要です。

このアプローチにより、データベースの正規化を維持しつつ、アプリケーションレベルで「銘柄リストの組み合わせ」としての重複を検知し、再利用を促すことが可能になります。


### 各テーブルにハッシュ値を持たすかどうか？
####　検索など綱領に入れると持たした方がいい。
####　テーブル構成変更

*　Value_hashの追加

| カラム名  | データ型    | 制約    | 説明 |
|:--------------------|:---------------------------|:----------------------------|:---------------|
| id | BIGSERIAL / INTEGER| PRIMARY KEY| エグジットシグナル条件の一意のID |
| user_id | UUID | NOT NULL   | 条件を作成したユーザーのID (認証ユーザー)  |
| name    | TEXT |    | 条件セットの名前 (ユーザーが設定)|
| memo    | TEXT |    | 条件セットに関するメモ |
| conditions_json   | JSONB| NOT NULL   | エグジット条件 (JSONで格納) |
| **value_hash** |**TEXT**| **NOT NULL UNIQUE**|**JSONの正規化後のハッシュ値**|
| created_at   | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()   | レコード作成日時 |
| updated_at   | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()   | レコード更新日時 (トリガーで自動更新を推奨)|

*　計算自体はServerActionで実施すること

####　ハッシュ値の計算方法

```js
import crypto from 'crypto';

/**
 * 汎用的なハッシュ生成関数
 * @param {Array<any>} values - 任意の値の配列
 * @returns {string} - SHA256のハッシュ値（hex文字列）
 */
function generateHash(values) {
  const normalized = values.map(v => {
    if (v === null || v === undefined) {
      return '';
    }
    if (typeof v === 'object') {
      // JSONの場合はキー順にソートして文字列化
      return JSON.stringify(v, Object.keys(v).sort());
    }
    return String(v);
  });

  const joined = normalized.join('|');

  return crypto.createHash('sha256').update(joined).digest('hex');
}

```

###　テーブル詳細

#### 1\. `sptch_analysis_conditions`

  * **分析条件のメインテーブル**
  * シミュレーションや予測に使う分析条件セット全体を定義し、各サブ条件への参照を保持します。

| カラム名 | データ型| 制約    | 説明    |
|:-----------------------------|:-----------------------|:----------------------------|:----------------------------------------------------------|
| `id`| `BIGSERIAL` / `INTEGER` | `PRIMARY KEY`| 条件セットの一意のID (自動採番)  |
| `user_id`| `UUID`  | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`   | `TEXT`  |    | 条件セットの名前 (ユーザーが設定)|
| `memo`   | `TEXT`  |    | 条件セットに関するメモ |
| `stock_selection_header_id`  | `BIGINT`| `REFERENCES sptch_stock_selections_header(id)` | 銘柄選択条件への外部キー（任意） |
| `simulation_period_id`  | `BIGINT`| `REFERENCES sptch_simulation_periods(id)`  | シミュレーション期間条件への外部キー（任意）    |
| `trade_parameter_id`    | `BIGINT`| `REFERENCES sptch_trade_parameters(id)`    | 取引前提条件への外部キー（任意） |
| `signal_id`   | `BIGINT`| `REFERENCES sptch_signals(id)`   | 売買シグナル条件セットへの外部キー（任意） |
| `fee_tax_id`  | `BIGINT`| `REFERENCES sptch_fee_taxes(id)` | 手数料・税金条件への外部キー（任意）  |
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at`  | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at`  | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 2\. `sptch_stock_selections_header`

  * **銘柄選択条件のヘッダー情報**
  * 個別の銘柄コードリスト（`sptch_stock_selections_stocks`）をまとめるヘッダー情報です。複数の分析条件から共通の銘柄リストを参照・再利用できます。

| カラム名| データ型    | 制約    | 説明    |
|:-------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 銘柄選択条件セットの一意のID  |
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 3\. `sptch_stock_selections_stocks`

  * **銘柄選択条件の実データ**
  * `sptch_stock_selections_header`の実態です。各銘柄コードを複数保持します。

| カラム名   | データ型    | 制約 | 説明 |
|:-----------|:---------------------------|:-----------------------------------|:---------------|
| `id`  | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`  | レコードの一意のID |
| `header_id`| `BIGINT`    | `NOT NULL REFERENCES sptch_stock_selections_header(id) ON DELETE CASCADE` | 銘柄選択ヘッダーへの外部キー |
| `order_no` | `INTEGER`   | `NOT NULL`| 銘柄の表示順/連番  |
| `stock_code`| `VARCHAR(10)`    | `NOT NULL`| 銘柄コード  |

#### 4\. `sptch_simulation_periods`

  * **シミュレーション期間条件**
  * シミュレーションの対象期間を定義します。複数の分析条件から共通の期間設定を参照・再利用できます。

| カラム名| データ型    | 制約    | 説明    |
|:-------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 期間条件の一意のID|
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `start_date` | `DATE` | `NOT NULL`   | シミュレーション開始日 |
| `end_date`   | `DATE` | `NOT NULL`   | シミュレーション終了日 |
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|


#### 5\. `sptch_trade_parameters`

  * **取引前提条件**
  * 資金管理や取引の前提となる条件を格納します。複数の分析条件から共通の取引前提を参照・再利用できます。

| カラム名| データ型    | 制約    | 説明 |
|:------------------|:---------------------------|:----------------------------|:---------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 取引ルールの一意のID |
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `max_purchase_amount` | `INTEGER`   |    | 最大購入金額|
| `min_volume` | `BIGINT`    |    | 最低出来高  |
| `trade_unit` | `INTEGER`   | `NOT NULL`   | 取引単位  |
| `conditions_json`   | `JSONB`|    | 条件 (JSONで格納・可変になることを想定) |
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 6\. `sptch_signals`

  * **売買シグナル条件（エントリー・エグジットのセット）**
  * エントリー条件とエグジット条件の組み合わせを定義します。これにより、取引タイプと、それぞれ独立したエントリー条件およびエグジット条件を紐付けます。

| カラム名| データ型    | 制約    | 説明    |
|:------------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| シグナル条件セットの一意のID|
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `transaction_type`| `VARCHAR(10)`    | `NOT NULL`   | 取引タイプ ('long', 'short')|
| `entry_signal_id` | `BIGINT`    | `NOT NULL REFERENCES sptch_entry_signals(id)` | エントリーシグナル条件への外部キー    |
| `exit_signal_id`  | `BIGINT`    | `REFERENCES sptch_exit_signals(id)` | エグジットシグナル条件への外部キー（NULL許容）|
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|


#### 7\. `sptch_entry_signals`

  * **エントリーシグナル条件の詳細**
  * エントリー条件の具体的な内容をJSONB形式で格納します。複数のシグナルセットから共通のエントリー条件を参照・再利用できます。

| カラム名  | データ型    | 制約    | 説明 |
|:--------------------|:---------------------------|:----------------------------|:---------------|
| `id` | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| エントリーシグナル条件の一意のID |
| `user_id` | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`    | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`    | `TEXT` |    | 条件セットに関するメモ |
| `conditions_json`   | `JSONB`| `NOT NULL`   | エントリー条件 (JSONで格納) |
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時 |
| `updated_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|

#### 8\. `sptch_exit_signals`

  * **エグジットシグナル条件の詳細**
  * エグジット条件の具体的な内容をJSONB形式で格納します。複数のシグナルセットから共通のエグジット条件を参照・再利用できます。

| カラム名  | データ型    | 制約    | 説明 |
|:--------------------|:---------------------------|:----------------------------|:---------------|
| `id` | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| エグジットシグナル条件の一意のID |
| `user_id` | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`    | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`    | `TEXT` |    | 条件セットに関するメモ |
| `conditions_json`   | `JSONB`| `NOT NULL`   | エグジット条件 (JSONで格納) |
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時 |
| `updated_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|

#### 9\. `sptch_fee_taxes`

  * **手数料・税金条件**
  * シミュレーションの損益計算に直接影響する要素を格納します。NUMERIC 型で精度を保証します。複数の分析条件から共通の手数料・税金設定を参照・再利用できます。

| カラム名| データ型    | 制約    | 説明    |
|:-------------|:---------------------------|:----------------------------|:----------------------------------------------------------|
| `id`    | `BIGSERIAL` / `INTEGER`| `PRIMARY KEY`| 手数料・税金情報の一意のID  |
| `user_id`    | `UUID` | `NOT NULL`   | 条件を作成したユーザーのID (認証ユーザー)  |
| `name`  | `TEXT` |    | 条件セットの名前 (ユーザーが設定)|
| `memo`  | `TEXT` |    | 条件セットに関するメモ |
| `buy_fee_rate`| `NUMERIC(8,5)`   | `NOT NULL`   | 買い手数料率 (例: 0.00450)  |
| `sell_fee_rate`| `NUMERIC(8,5)`   | `NOT NULL`   | 売り手数料率 (例: 0.005)    |
| `tax_rate`   | `NUMERIC(8,5)`   | `NOT NULL`   | 税率 (例: 0.20315)|
| `value_hash` |TEXT| NOT NULL UNIQUE|JSONの正規化後のハッシュ値|
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード作成日時  |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`   | レコード更新日時 (トリガーで自動更新を推奨)|
| `deleted_at`  | `TIMESTAMP WITH TIME ZONE` |    | レコード削除日時 (論理削除の場合)|

<details>
<summary>DDL</summary>

```sql
-- テーブル作成の順番留意すること。
-- updated_at を自動更新するトリガー関数 (任意だが推奨)
-- Supabaseのトリガー設定でこの関数をBEFORE UPDATEに設定してください
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- drop table sptch_analysis_conditions
CREATE TABLE sptch_analysis_conditions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- Supabase auth.users.id を参照 (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    -- 各サブ条件への参照を追加
    stock_selection_header_id BIGINT REFERENCES sptch_stock_selections_header(id) ON DELETE SET NULL, -- 選択は必須でなければNULL許容
    simulation_period_id BIGINT REFERENCES sptch_simulation_periods(id) ON DELETE SET NULL,
    trade_parameter_id BIGINT REFERENCES sptch_trade_parameters(id) ON DELETE SET NULL,
    signal_id BIGINT REFERENCES sptch_signals(id) ON DELETE SET NULL,
    fee_tax_id BIGINT REFERENCES sptch_fee_taxes(id) ON DELETE SET NULL,
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_analysis_conditions
-- BEFORE UPDATE ON sptch_analysis_conditions
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_stock_selections_header
CREATE TABLE sptch_stock_selections_header (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
    );

-- CREATE TRIGGER set_updated_at_on_stock_selections_header
-- BEFORE UPDATE ON sptch_stock_selections_header
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_stock_selections_stocks
CREATE TABLE sptch_stock_selections_stocks (
    id BIGSERIAL PRIMARY KEY,
    header_id BIGINT NOT NULL REFERENCES sptch_stock_selections_header(id) ON DELETE CASCADE,
    order_no INTEGER NOT NULL, -- 銘柄の表示順/連番
    stock_code VARCHAR(10) NOT NULL, -- 銘柄コード
    UNIQUE (header_id, stock_code) -- 同じヘッダーID内で同じ銘柄コードは重複しない
);
CREATE INDEX idx_sptch_stock_selections_stocks_header_id ON sptch_stock_selections_stocks(header_id);

-- drop table sptch_simulation_periods
CREATE TABLE sptch_simulation_periods (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    start_date DATE NOT NULL, -- シミュレーション開始日
    end_date DATE NOT NULL, -- シミュレーション終了日
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_simulation_periods
-- BEFORE UPDATE ON sptch_simulation_periods
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_trade_parameters
CREATE TABLE sptch_trade_parameters (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    max_purchase_amount INTEGER, -- 最大購入金額
    min_volume BIGINT, -- 最低出来高
    trade_unit INTEGER NOT NULL, -- 取引単位
    conditions_json JSONB , -- エントリー条件 (JSONで格納)
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_trade_parameters
-- BEFORE UPDATE ON sptch_trade_parameters
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_signals
CREATE TABLE sptch_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    transaction_type VARCHAR(10) NOT NULL, -- 取引タイプ ('long', 'short')
    entry_signal_id BIGINT NOT NULL REFERENCES sptch_entry_signals(id) ON DELETE RESTRICT, -- エントリーシグナル条件への外部キー
    exit_signal_id BIGINT REFERENCES sptch_exit_signals(id) ON DELETE SET NULL, -- エグジットシグナル条件への外部キー（NULL許容）
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_signals
-- BEFORE UPDATE ON sptch_signals
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_entry_signals
CREATE TABLE sptch_entry_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    conditions_json JSONB NOT NULL, -- エントリー条件 (JSONで格納)
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_entry_signals
-- BEFORE UPDATE ON sptch_entry_signals
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_exit_signals 
CREATE TABLE sptch_exit_signals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    conditions_json JSONB NOT NULL, -- エグジット条件 (JSONで格納)
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_exit_signals
-- BEFORE UPDATE ON sptch_exit_signals
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();

-- drop table sptch_fee_taxes
CREATE TABLE sptch_fee_taxes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    buy_fee_rate NUMERIC(8,5) NOT NULL, -- 買い手数料率
    sell_fee_rate NUMERIC(8,5) NOT NULL, -- 売り手数料率
    tax_rate NUMERIC(8,5) NOT NULL, -- 税率
    value_hash text not null unique,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- CREATE TRIGGER set_updated_at_on_fee_taxes
-- BEFORE UPDATE ON sptch_fee_taxes
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();


ALTER TABLE public.sptch_analysis_conditions DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_stock_selections_header DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_stock_selections_stocks DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_simulation_periods DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_trade_parameters DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_entry_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_exit_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_fee_taxes DISABLE ROW LEVEL SECURITY; 

GRANT USAGE ON SCHEMA "public" TO anon; 
GRANT USAGE ON SCHEMA "public" TO authenticated; 

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated; 
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;

-- シーケンスへのアクセス権限 (INSERT時の自動採番ID生成に必要)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO anon;

```

</details>

非常に明確な方向性です。
指示に基づいて以下の形に整理しました。


# プランの分析結果


## ① **sptch_simulation_results_stocks**

→ フィルタリング結果（銘柄ごとの判定結果）

| カラム名| データ型| 説明|
| :---------------------- | :---------- | :-------------------------------------------- |
| id  | BIGSERIAL   | 主キー   |
| analysis_condition_id | BIGINT  | 分析プランID（`sptch_analysis_conditions.id`への外部キー） |
| stock_code | VARCHAR(10) | 銘柄コード |
| filter_reason  | TEXT| 除外理由（例: 出来高不足・資本金不足・投資額オーバーなど）|
| score   | INTEGER | 自動判定のスコア（0: 対象外、1: 対象）|
| manual_score   | INTEGER | 手動での調整スコア（0: 対象外、1: 対象）   |
| created_at | TIMESTAMP   | 作成日時  |
| updated_at | TIMESTAMP   | 更新日時  |

## ② **sptch_simulation_results_trade**

→ 銘柄ごとのトレードシミュレーション結果（Entry→Exit）

| カラム名| データ型  | 説明|
| :---------------------- | :------------ | :-------------------------------------------- |
| id  | BIGSERIAL | 主キー   |
| analysis_condition_id | BIGINT| 分析プランID（`sptch_analysis_conditions.id`への外部キー） |
| stock_code | VARCHAR(10)   | 銘柄コード |
| target_date| DATE  | 評価開始日（この日からシミュレーション開始）|
| target_close_price| NUMERIC(12,2) | 評価開始日の終値（参考用） |
| entry_date | DATE | **エントリー情報** エントリー日 |
| entry_close_price | NUMERIC(12,2) | **エントリー情報**エントリー時の株価（終値）|
| entry_quantity | INTEGER | **エントリー情報**エントリーした株数（100株単位など）|
| entry_amount | NUMERIC(14,2) | **エントリー情報**エントリー時の金額（株価×数量）|
| exit_date | DATE | **エグジット情報**エグジット日 |
| exit_close_price | NUMERIC(12,2) | **エグジット情報**エグジット時の株価（終値）|
| exit_quantity | INTEGER | **エグジット情報**エグジットした株数 |
| exit_amount | NUMERIC(14,2) |**エグジット情報** エグジット時の金額 |
| gross_profit_amount | NUMERIC(14,2) | **損益情報**税引前の利益金額 |
| gross_profit_rate | NUMERIC(7,4) | **税引前の利益率** |
| net_profit_amount | NUMERIC(14,2) | **損益情報**税引後の利益金額 |
| net_profit_rate | NUMERIC(7,4) | **損益情報**税引後の利益率 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

---

## ③ **sptch_simulation_results_summary**（新規）

→ プラン全体の総合結果

| カラム名| データ型  | 説明|
| :---------------------- | :-------- | :-------------------------------------------- |
| id  | BIGSERIAL | 主キー   |
| analysis_condition_id | BIGINT| 分析プランID（`sptch_analysis_conditions.id`への外部キー） |
| gross_profit_amount | NUMERIC(14,2) | プラン全体の損益:税引前の総利益金額 |
| gross_profit_rate | NUMERIC(7,4) | プラン全体の損益:税引前の利益率（総合）|
| net_profit_amount | NUMERIC(14,2) | プラン全体の損益:税引後の総利益金額 |
| net_profit_rate | NUMERIC(7,4) | プラン全体の損益:税引後の利益率（総合）|
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

---

# 🏗 ER図イメージ

```
sptch_analysis_conditions
├── sptch_simulation_results_stocks   ← フィルタリング銘柄結果
├── sptch_simulation_results_trade    ← トレードシミュレーション結果
└── sptch_simulation_results_summary  ← プラン全体の総合損益
```

---

# 🚩 補足

* **「stocks」→「フィルタ結果」**（この銘柄は投資対象になるか？）
* **「trade」→「個別のEntry/Exit」**（売買の実行と結果）
* **「summary」→「プランの総合利益」**（最終的な成績）

---

<details><summary>DDL</summmary>

```SQL

CREATE TABLE sptch_simulation_results_stocks (
    id BIGSERIAL PRIMARY KEY,
    analysis_condition_id BIGINT NOT NULL REFERENCES sptch_analysis_conditions(id) ON DELETE CASCADE,
    stock_code VARCHAR(10) NOT NULL,
    filter_reason TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    manual_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス（検索高速化）
CREATE INDEX idx_srs_analysis_stock ON sptch_simulation_results_stocks(analysis_condition_id, stock_code);


CREATE TABLE sptch_simulation_results_trade (
    id BIGSERIAL PRIMARY KEY,
    analysis_condition_id BIGINT NOT NULL REFERENCES sptch_analysis_conditions(id) ON DELETE CASCADE,
    stock_code VARCHAR(10) NOT NULL,
    target_date DATE NOT NULL,
    target_close_price NUMERIC(12,2),
    
    -- Entry
    entry_date DATE,
    entry_close_price NUMERIC(12,2),
    entry_quantity INTEGER,
    entry_amount NUMERIC(14,2),
    
    -- Exit
    exit_date DATE,
    exit_close_price NUMERIC(12,2),
    exit_quantity INTEGER,
    exit_amount NUMERIC(14,2),
    
    -- Profit
    gross_profit_amount NUMERIC(14,2),
    gross_profit_rate NUMERIC(7,4),
    net_profit_amount NUMERIC(14,2),
    net_profit_rate NUMERIC(7,4),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_srt_analysis_stock_date 
    ON sptch_simulation_results_trade(analysis_condition_id, stock_code, target_date);


CREATE TABLE sptch_simulation_results_summary (
    id BIGSERIAL PRIMARY KEY,
    analysis_condition_id BIGINT NOT NULL UNIQUE REFERENCES sptch_analysis_conditions(id) ON DELETE CASCADE,

    gross_profit_amount NUMERIC(14,2),
    gross_profit_rate NUMERIC(7,4),
    net_profit_amount NUMERIC(14,2),
    net_profit_rate NUMERIC(7,4),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

```

</details>



### StockCompassのサブ機能

#### **1. PlanMaintenance（計画の管理）**
* **定義：** プランの一覧画面、実施の有無、GeneratResultの実施のトリガー
* **役割：**ユーザーが作成した多様な**分析計画（プラン）を一覧で確認し、管理する中心的な機能**を担います。「GeneratResultの実施のトリガー」がここに含まれる。ユーザーは管理画面から直接シミュレーション実行を指示できる流れが想像できます。プランの有効/無効の切り替え（実施の有無）なども含まれる

#### **2. FormulatePlan（計画を作成する）**
* **定義：** 計画の詳細を立てる、対象の銘柄、銘柄に対するフィルタ、Entry条件、Exit条件、TaxFeeなど
* **役割：** StockCompassの核となる「分析条件の定義」を担う役割です。ユーザーが様々な要素（銘柄、フィルター、売買シグナル、コストなど）を組み合わせて、**独自の検証シナリオを構築する**ためのUI/UXとロジックを包括します。`PlanMaintenance` が「管理」であるのに対し、`FormulatePlan` は「創造・定義」のフェーズ

#### **3. GenerateResultPlan（計画に基づいて（収集済みデータから）結果を作成する）**
* **定義：** 既存のデータから、結果の作成、作成されたデータをもとに、妥当な計画か判断する。
* **役割：** 既存のプランを用いて評価するための結果を導くことが責務。ロバストネス検証のフロー図（StockCompass_LH_image03.drawio.png）に示されている複雑な計算ロジックが、この役割の具体的な内容です。

#### **4. AnalyzeResults（プラン結果分析）**
* **定義：** 選ばれたPlanに対応する結果を確認、結果もとに、Planが妥当かどうかを判断する
* **役割：** バックテストで生成された詳細なデータ（損益グラフ、各トレードの詳細履歴、パフォーマンス指標など）をユーザーが視覚的・数値的に把握し、仮説の有効性を判断するための機能が含まれます。


#### **5. ExecutePlan（計画の実行）**
* **定義：** 計画を実行する処理、当日（前日までのデータ）をベースに既存のPlanに従ってEntryのサインを計測する。
* **役割：** これまで定義してきた「過去データでの検証（バックテスト）」とは異なり、**「実際の市場データ（当日または前日までの最新データ）を使って、現在有効な売買シグナルを検出する」** という、リアルタイムに近い実行フェーズを担います。これにより、ユーザーは過去の検証結果だけでなく、実際に「今日（または直近で）どの銘柄に買いサインが出ているか」を知ることができます。この機能は、StockCompassの利用目的（「10%上がるものを探すツール」）に直結する重要な役割です。

