
## 1.概要（Summary）
株の投資やるうえで、勝率のみを優先した仕組みがゴール
ひとまず実用的に使えるようにしたい
ポートフォリオなどは有用、シミュレーション機能を考え中

## 2.セットアップ手順（Getting Started）

```bash
# リポジトリをクローン
git clone https://github.com/sickboy0001/hadbit-app.git
cd hadbit-app

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 3. 使用技術一覧（技術スタックの要約）
調整中）**ひと目でわかるスタック表**

###  使用技術（Tech Stack）
- フロントエンド: React, Next.js, TypeScript
- UI: Tailwind CSS, shadcn/ui
- データベース: Supabase
- デプロイ: Vercel

#### チャート、タイムラインについて
ガントチャートは自作になりました。といっても、実際には生成AIに問い合わせた結果

test-3

## 4.デモ or スクリーンショット

* Vercel:[Vercel](https://stock-profit10.vercel.app/)
* Github:[GitHub](https://github.com/sickboy0001/StockProfit10)

## 5.環境
### ■開発環境

|No.|項目|ソフトウェア名、バージョン等			|
|-|-|-|
|1|OS|Edition:Window 10 Pro / バージョン:1607 以降 / 32-bit or 64-bit			|
|2|開発言語|TypeScript			|
|3|フレームワーク|React+NextJS|
|4|ソース管理|GitHub|
|5|開発ツール|VSCode|

### ■ハードウェア構成
|No.|項目|配置場所|構成|役割など|
|-|-|-|-|-|
|1|開発環境（ローカル）|ローカル||コードの実装|
|2|GItHub|インターネット||ソースの保存場所、vercel連携でも利用|
|3|Vercel|インターネット||デプロイ先|
|4|Supabase|インターネット||データベース|

## 6.設計
### ■システム配置

### ■機能要件・一覧

### ■画面設計
- tailwindcss、shadcnuiを利用すること。
- AtomicDesingを意識した構成にすること。


## 7.経緯

## 8.既知の課題


## memo
Python利用時  
実行時には環境作成、環境の利用が必要
‘‘‘bash
 .venv\Scripts\activate.ps1
‘‘‘ [debug] [2025-06-12T20:42:14.347Z] Found config in file "C:\work\dev\spa\stockprofit10-app\vercel.json"

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## sample


<details>
<summary>ここをクリックして詳細を表示（例: ポートフォリオの作成クエリ）</summary>

この中に折りたたまれるコンテンツが入ります。
説明文やその他のMarkdown記法も使用できます。

```sql
-- 新しいポートフォリオを挿入するSQLクエリの例
INSERT INTO public.spt_portfolios (user_id, name, memo, display_order)
VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef', -- 例: ユーザーID
    '新しいポートフォリオ名',
    'これはポートフォリオのメモです。',
    (SELECT COALESCE(MAX(display_order), 0) + 1 FROM public.spt_portfolios WHERE user_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef')
);
さらにテキストを追加することも可能です。
```
</details>