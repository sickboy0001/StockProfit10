

# StockCompass

[Top](../../README.md)


README.md (全体概要)
01_PlanMaintenance.md (計画の管理)
02_FormulatePlan.md (計画の作成)
03_GenerateResultPlan.md (計画に基づく結果生成)
04_AnalyzeResults.md (プラン結果分析)
05_ExecutePlan.md (計画の実行)


## StockCompassの概要

### 目的
市場の動向を過去のデータをベースに分析するツールです。
取得済みの市場データをベースに１０％上がる銘柄を探し、過去の株式市場データを用いて仮説を立て、期待値１０％を見つけることを目指します。

### 動き
15日（市場公開日）ベースで、過去のデータの中で、以下のシナリオに沿うものを選別します。
* [チャート](./DisplayChart.md) - ※このリンクは現状の「チャート表示」に関するものですが、もし`04_AnalyzeResults.md`内でチャート機能が詳細化される場合、リンクを調整することを推奨します。


## ユースケース
![ユースケース](images/StockCompass_UC_image03.drawio.png)

## ワークフロー全体

![ワークフロー](images/StockCompass_DF_image01.drawio.png)

+ ※各データベースの役割はテーブル一覧（概要）参照のこと。


## 基本的な利用手順

### 目的
利用者が、株式市場で株価上昇のサインを探すための処理です。



## 画面一覧 New

|機能|画面|機能|
|:----|:----|:----|
|01_PlanMaintenance：計画管理|一覧画面|ユーザーが所有する計画の一覧が確認可能|
|01_PlanMaintenance：計画管理|一覧画面|新規で計画作成画面への遷移|
|01_PlanMaintenance：計画管理|一覧画面|結果表示の画面へ遷移|
|01_PlanMaintenance：計画管理|一覧画面|計画に対する結果があるときには、編集画面へ遷移できない|
|01_PlanMaintenance：計画管理|一覧画面|計画に対して結果の有無を持つ|
|01_PlanMaintenance：計画管理|一覧画面|計画に対して、実行の有無を確認できる|
|02_FormulatePlan：計画作成|計画作成|計画を作成する機能を持つ。|
|02_FormulatePlan：計画作成|計画作成|ポートフォリオから銘柄は引用できる。|
|03:GeneratePlanResult:計画に基づく結果生成|進捗確認|慎重の確認ができる|
|04_AnalyzeResults.md (プラン結果分析)|結果分析画面|０３で取得した結果を参照する画面。|
|05_ExecutePlan.md (計画の実行)|実行設定画面| |

## テーブル一覧 (概要)

StockCompassの機能を実現するための主要なテーブル群です。ユーザーの分析条件を柔軟かつ構造的に保存するために設計されています。詳細な定義は[DDL](./90_ddl.sql.md)を参照してください。


|責務(*)|役割|テーブル名|説明|
|:----|:----|:----|:----|
|内|計画情報|**sptch_analysis_conditions**|分析条件のメインセット|
|内|計画情報|**sptch_stock_selections_header**|銘柄選択条件のヘッダー情報|
|内|計画情報|**sptch_stock_selections_stocks**|銘柄選択条件の実データ（銘柄コード）|
|内|計画情報|**sptch_simulation_periods**|シミュレーション期間条件|
|内|計画情報|**sptch_trade_parameters**|取引前提条件|
|内|計画情報|**sptch_signals**|売買シグナル条件（エントリー・エグジットのセット）|
|内|計画情報|**sptch_entry_signals**|エントリーシグナル条件の詳細|
|内|計画情報|**sptch_exit_signals**|エグジットシグナル条件の詳細|
|内|計画情報|**sptch_fee_taxes**|手数料・税金条件|
|内|計画に基づく結果|**sptch_simulation_results_stocks**|フィルタリング銘柄結果|
|内|計画に基づく結果|**sptch_simulation_results_trade** |トレードシミュレーション結果|
|内|計画に基づく結果|**sptch_simulation_results_summary**|プラン全体の総合損益|
|内|計画の状態| | |
|内|計画の状態| | |
|外|銘柄情報|**spt_stocks**|銘柄基本情報|
|外|株価情報|**spt_daily_quotes**|株価情報|

* (*)責務内かどうか、責務外のものは別システムでの作成とする。



## 検討すること
* Vercelのサーバーアクションで頑張る方が、体験的には優位
* Yahoo.APIからの取得もサーバーアクションで頑張るケースでてくるので。
* 
![実装指針の比較（Supabaseで頑張るかServerActionで頑張るか）](./images/StockCompass_image01.drawio.png)


## ハッシュ値の計算方法

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
