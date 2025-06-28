# プロジェクト定義書(ProjectSpecification)
## ■要求の背景・目的
「StockProfit10」

### ◆動機
株式ってどこまでいっても複雑だとは思う。
ただし、シンプルに、冷静に判断できないかなぁと
期待した判断ができない理由としては「」
なぜできないか？というと、外的要因の可能性が高いと思う
そこらへん含めて、冷静に判断して買い時を作るアプリを作りたい

### ◆目的
１０％のキャピタルゲインを得るためのきっかけを与えるアプリ
- 気になる株を登録
- 過去の実績の分析
- 買いシグナルとして、対象の株を気になる株から上げる
  - チャンスの基準は株価自体が日付単位でみたときに上がり調子
  - ２０日の平均線、６０日の平均線から判断する
  - 日ごとの出来高は別途ボーダーライン設ける
- 売り時シグナルも出す
  - 株価が購入時より１０％アップが出る
  - 株価が購入時より１０％ダウンでシグナルが出る
- 「買い」「売り」候補を挙げる
  - 実際の売買まではサポートしない

### ◆環境
|構成|内容|
|-|-|
|フロント|Next.js + React（買う・売るボタン、保有株リスト）|
|株価取得|J-Quants API（Japan Quants API）|
|バックエンド|API Routes (/api/price) を作ってサーバー側で取得・加工|
|状態管理|useState / Zustand などで保有株情報を管理|
|売却判定|購入価格 * 1.1 または 0.9 になったら売却|



### ◆ライブラリ
|分類|ライブラリ名|用途例|
|-|-|-|
|チャート描画|chart.js|株価・出来高の可視化|
|数値計算|simple-statistics|移動平均、分散など|
|時系列処理|date-fns, dayjs	|株価の期間フィルター|

### ◆株価トレンド（テクニカル分析）
目的：価格の動きから売買のタイミングを判断する。使う指標の例：
|指標|内容|
|-|-|
|移動平均（SMA）|過去n日間の終値の平均|
|ボリンジャーバンド|平均±標準偏差|
|RSI（相対力指数）|過熱感（70以上）／売られすぎ（30以下）|

### ◆J-Quants
#### ▲J-Quants API（Japan Quants API）とは？
|特徴|内容|
|-|-|
|対象|日本株（東証プライム／スタンダード／グロース）|
|運営|株式会社日本取引所グループ（JPX）|
|利用料|無料（個人利用）|
|データ|株価（終値）、銘柄情報、企業業績、財務情報、ニュース等|
|利用制限|APIトークン取得制（リクエスト上限あり）|

#### ▲J-Quants API のメリット・デメリット
|メリット|デメリット|
|-|-|
|✅ 日本株に特化（精度高い）|	⛔︎ 時系列は主に日次（リアルタイムではない）|
|✅ 財務・業績データも一括取得可能|	⛔︎ 初期の認証フローがやや複雑（OAuth風）|
|✅ 無料で使える	|⛔︎ WebSocketなし・株価変動はシミュレーション用途向け|


#### ▲提供される主なエンドポイント（抜粋）
エンドポイント	内容
/prices/daily_quotes	日々の株価（終値・始値・高値・安値・出来高など）
/companies	企業の基本情報（証券コード、業種、上場市場など）
/statements	財務諸表データ（PL・BS）
/news	市場ニュースや企業情報


#### ▲J-Quants APIの認証フロー
J-Quants APIでは、データ取得の際に**IDトークン（idToken）**が必要です。このトークンは、以下のステップで取得します：
qiita.com
リフレッシュトークンの取得
ユーザーのメールアドレスとパスワードを使用して、リフレッシュトークン（refreshToken）を取得します。
IDトークンの取得
取得したリフレッシュトークンを使用して、IDトークンを取得します。
これらのトークンを使用して、APIから株価データを取得できます。


### ◆用語定義
|用語|定義・説明|
|-|-|
|キャピタルゲイン|各ユーザーで稼働中のユーザーのオンプレサーバーの日々のチェックを行うもの|	
|株価||	
|出来高||	
|２０日線||	



#### ▼サーバーチェックの流れ
1. ユーザー環境：各サーバー：タスクでサーバーの状況ログとして、ファイルサーバーなど指定された場所に保存
1. 社内：ピンクスライム：定期タスク（１日回）として、全ユーザー対象で実行する。
	1. ピンクスライム：ポートオープン
	2. サーバーチェック履歴（srvSSIChkServer）：ユーザーのサーバー上に保存された、ログを取得
	1. サーバーチェック履歴（srvSSIChkServer）：社内に保存
	1. 社内のデータベースに保存
	1. 社内のデータベースの情報をもとにチェックする。
	1. ピンクスライム：ポートクローズ
1. 社内：サーバーチェック（SSISrvChkSearch）：登録されたサーバーチェックの状態を確認して、必要に応じてJOBを立てる対応する。


****
# MarkDown記載方法（サンプル）

オリジナルデータはWikiサイトから入手して、
「C:\temp\pages」に保存



### ■テーブル
 table name : **wiki_infradata**
|key|name|type|descritpion|
|--|-|-|-|
|*|id|連番ID|一意キー|
||directory_name|nvarchar(max)| ディレクトリ名　|
||directory_name_decode|nvarchar(max)| ディレクトリ名　|
||file_name |nvarchar(max)| ファイル名 |
||file_name_decode |nvarchar(max)| ファイル名 |
||contents |nvarchar(max)| コンテンツ  |



### ■テーブル作成スクリプト
Create_wiki_inforadata.sql

```SQL
CREATE TABLE wiki_infradata (
    id INT IDENTITY(1,1) PRIMARY KEY, -- 連番ID (一意キー)
    directory_name NVARCHAR(MAX),     -- ディレクトリ名
    directory_name_decode NVARCHAR(MAX), -- ディレクトリ名（デコード）
    file_name NVARCHAR(MAX),          -- ファイル名
    file_name_decode NVARCHAR(MAX),   -- ファイル名（デコード）
    contents NVARCHAR(MAX)            -- コンテンツ
);
```



### ■環境
- c:\GID\CnvWikiToDb\  
  - log
    - yyyy-mm-dd.log
      - 日付単位でのログ、１月以上古いファイル自動で削除される。
  - xxx.exe
  - Setting.xml -> 不要
  - Dbconnetion.xml -> 不要
    - データベース接続情報
  - WIkiToDbSetting.xml -> 不要
  - Create_wiki_inforadata.sql

### ■Exeの呼び出し方
前提１）前提として、対象のデータベースに、「Create_wiki_inforadata」でテーブル作ること。  
前提２）また権限は必要に応じて、「databaseuser」に応じて削除、登録の権限を付与すること。

```bash
xxx.exe -wikipath:"pathxxx" -host:"serverxx" -databasename:"xxxxdb" -databaseuser:"userxxx" -databasepassword:"passxxx" -dataclear:true/false -CurrentPath:"C:\GAI\WikiToDb" -wikitodbtemp:"c:\gai_temp" -output:csv

help ヘルプ
wikipath:pathxxx: wikiのデータのパス　def  C:\temp\pages
host:serverxx：ホスト名 sqlserverの名前
databasename:xxxxdb:SQLServerでのデータベース名
databaseuser:userxxx: sqlserverへのログインユーザー sa　など
databasepassword: ユーザーに対応するパスワード
dataclear:true　一度データを削除する false データは削除されない。同一テーブルに追加
currentpath:xxxx 実行ファイルのあるパス　C:\GAI\WikiToDb 
wikitodbtemp:"c:\gai_temp":currentpathないにある「temp」フォルダの場合、パス名が長いのを回避するためのパス
output:csv csv出力の場合には記載、記載なしなら、データベースへの登録 出力先はExeと同じ場所
```

```ini
Newton.ini
[BynSamKy]
;移動情報引用画面で、転科は退院とみなすかどうか(0:みなす(DEF) 1:みなさない)
;※Hoozuki.ini[SinkiInyou]NotTenkaCheckと設定を統一してください。
NotTenkaCheck=1
;同じ診療科に転科のときはサマリーを(1:わける,0=わけない(=Def))
NotSammaryDivide = 1"
```

### ■コンバート用のコンソールの作成（CnvWikiToDB)
- 設定ファイルもで持つもの。→不要説
- DBへの接続の仕方、現状推奨で。→引数で調整
- DBへの接続設定Xml
- 処理：ファイルの読み取り
- 処理：DBへの書き込み
- 処理：進捗など残すようにする。→ログフォルダの中に作成する。

### 連番
1. test
1. test2

### ■参考
htmlurl エンコーディング、デコーディング
https://dobon.net/vb/dotnet/internet/urlencode.html#google_vignette



<details><summary>すごく長い文章とかプログラムとか</summary>

```python
print('Hello world!')
```
</details>


### Html出力時の注意
Htmlの中で
markdown,highlightの参照がるので、以下に置き換えが必要
また、該当Html保存している場所に、「markdown.css」「highlight.css」が必要

```html
<link rel="stylesheet" href="./markdown.css">
<link rel="stylesheet" href="./highlight.css">
```
