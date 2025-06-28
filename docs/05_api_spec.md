
[Top](./README.md)

# 外部インターフェース仕様
## 4.1. API仕様（Yahoo Financeなど外部APIとの連携）
YahooFinanceAPIからのデータ取得は既存の定義で問題ありません。シミュレーションロジックは主にバックエンド（Supabase FunctionsまたはNext.js Server Actions）で実装し、spt_daily_quotesテーブルに蓄積されたデータを利用します。
本システムでは、株価情報などを取得するために外部APIとの連携を行います。以下に各APIの仕様を記載します。

### API 1: 株価時系列情報取得（YahooFinanceAPI）

- **レスポンス例**:

- 主な利用目的:
  - 過去の株価情報を取得し、買いシグナルの判定に利用。
  - 20日・60日移動平均線の算出。

### エラー仕様（共通）
401 Unauthorized: トークンの期限切れ、未認証
429 Too Many Requests: APIの利用制限を超過（一定時間リトライを停止）
500 Server Error: YahooFinance側の問題、再試行を推奨
