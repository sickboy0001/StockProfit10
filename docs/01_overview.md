[Top](./README.md)

# 要件定義書
## 1. 全体での概要と目的
### ◆概要
株式市場は常に変動し、多くの投資家が感情に左右されず、客観的かつ論理的な投資判断を下すことに困難を感じています。「StockProfit10」は、この課題を解決するために開発された株式投資シミュレーション＆シグナル提供アプリケーションです。過去の膨大な株価データと独自開発の分析アルゴリズムに基づいた「買い・売りシグナル」を提供し、さらにそのシグナルが過去の相場でどれほどの成果を上げたかを具体的に示す「シミュレーション機能」を搭載しています。これにより、ユーザーは冷静な判断を促され、自信を持って売買タイミングを見極められるよう支援します。


### ◆目的
本アプリケーションの究極の目的は、ユーザーが株式投資において**「もしあの時買っていたら、売っていたら」という疑問を解消し、具体的な根拠に基づいた自信ある売買判断を下せる環境を提供**することです。具体的には、以下の主要な価値を提供します。

- 「10%のキャピタルゲイン獲得」を現実的な目標としてサポート: アプリの提案するシグナルに従った場合の過去の取引成果をシミュレーションすることで、その有効性をユーザーが体感し、目標達成に向けた具体的なきっかけと安心感を得られるようにします。
- 感情に左右されない客観的な意思決定の支援: 過去のデータに基づいた買い・売りシグナルと、それによるシミュレーション結果を提供することで、ユーザーが自身の判断を客観的に検証し、感情的な売買を抑制できるようサポートします。
- 株式投資学習・検証の促進: 実際の資金を投入する前に、様々な条件でのシミュレーションを繰り返すことで、ユーザーが投資戦略の有効性を試行錯誤し、スキルを向上させるための学習ツールとしての役割も果たします。
この信頼性と納得感の醸成を通じて、ユーザーのアプリ利用継続を促し、最終的に彼らの安定的な資産形成に貢献します。

## 2. アプリケーションの提供価値と主要機能
### 2.1. 提供価値
「StockProfit10」は、以下の価値をユーザーに提供します。

- 過去実績に基づいた信頼性の可視化: 独自シグナルによるシミュレーションを通じて、「もしあの時取引していたらどうなっていたか」を明確に示し、アプリの信頼性を感覚だけでなくデータで納得いただけます。
- 客観的な売買タイミングの提示: 20日・60日移動平均線、出来高といった客観的指標に基づく「買い・売りシグナル」を提供し、感情に流されない冷静な投資判断を支援します。
- パーソナライズされた投資戦略の検証: 銘柄、期間、取引単位、手数料など、ユーザーが細かく条件を設定できるシミュレーション機能により、個々の投資スタイルに合わせた戦略の有効性を事前に検証できます。
- シンプルなUI/UX: 複雑な株価データを直感的かつ分かりやすく表示することで、投資初心者から経験者まで、誰もがストレスなくアプリを操作し、必要な情報を得られるデザインを目指します。
- 投資行動を促すための「きっかけ」提供: 実際の売買を直接サポートするのではなく、ユーザーが自信を持って売買判断を下すための「確かな情報と根拠」を提供することに特化し、自主的な投資行動を強力に後押しします。
### 2.2. 主要機能一覧
本アプリケーションは、上記提供価値を実現するために、以下の主要な機能を提供します。

- ユーザー管理機能:
    - ログイン、サインアップ、パスワード再設定、ユーザー情報編集
- ポートフォリオ管理機能:
    - 複数のポートフォリオ作成・管理
    - ポートフォリオへの銘柄追加・削除
    - ポートフォリオ内の銘柄表示順、グループ管理
- 株価情報表示機能:
    - 個別銘柄の株価チャート表示（日足、移動平均線表示）
    - 過去の株価データ閲覧
- 買い・売りシグナル通知機能:
    - 独自アルゴリズム（20日・60日移動平均線、出来高など）に基づく「買いシグナル」「売りシグナル」の算出と表示
    - シグナル発生時のユーザーへの通知（アプリ内通知、将来的にメール通知も検討）
- シミュレーション機能（中核機能）:
    - 指定銘柄・期間での売買シミュレーション実行
    - アプリ推奨シグナル、またはカスタム条件（指定価格、日付）による売買トリガー設定
    - 購入株数/金額、手数料の設定
    - シミュレーション結果の表示（総損益、損益率、取引履歴一覧）
    - 株価チャート上へのシミュレーション売買タイミング、シグナル表示
- データ連携機能:
    - YahooFinanceAPIからの最新株価データ取得、および過去データの蓄積管理

## 3. シミュレーション機能
### ◆目的
ユーザーが「StockProfit10」の提案する買いシグナルと売りシグナルに従って取引を行った場合、過去のデータに基づいてどの程度の利益または損失が発生したかをシミュレートし、その結果を可視化することで、アプリの有効性を体感し、利用継続を促します。

### ◆動機
「買い」「売り」候補を提示するだけでなく、「もしあの時買っていたら、売っていたら」というユーザーの疑問に答えることで、ツールの信頼性と納得感を高めます。これにより、ユーザーはより安心してアプリのシグナルを活用できるようになります。



## 要件
### シミュレーションの基本ロジック
対象銘柄: ポートフォリオに登録されている銘柄、またはユーザーが指定する単一の銘柄。
期間設定: ユーザーがシミュレーション対象期間（開始日、終了日）を指定できる。
買いのトリガー:
アプリの買いシグナル: 「20日平均線と60日平均線によるゴールデンクロス」と「出来高のボーダーライン」の条件を満たした場合。
ユーザー指定の買い値: 特定の株価になった場合。
日付指定: 特定の日に購入したと仮定する。
売りのトリガー:
アプリの売りシグナル: 「購入時より10%アップ」または「購入時より10%ダウン」の条件を満たした場合。
ユーザー指定の売り値: 特定の株価になった場合。
日付指定: 特定の日に売却したと仮定する。
購入・売却単位: ユーザーが1回の取引で売買する株数または購入金額を指定できる。
取引コスト: ユーザーが設定する手数料（購入時、売却時）を考慮する。
データソース: spt_daily_quotes テーブルに格納されている過去の株価データを使用。YahooFinanceAPIから取得した履歴データが前提。
### シミュレーション結果の表示
損益額: シミュレーション期間中の総損益（売却益 - 購入費用 - 手数料）。
損益率: 総損益を購入総額で割ったパーセンテージ。
取引履歴: シミュレーション期間中の各取引（購入、売却）の詳細（日付、銘柄、株数、価格、損益）。
チャート表示: 実際の株価チャート上に、購入・売却のタイミングとシグナルをプロットして可視化。
2.3. 設定項目
シミュレーション期間: 開始日、終了日
購入株数 / 購入金額: 1回あたりの取引単位
手数料: 購入時手数料、売却時手数料（固定額または割合）
買いシグナル利用: アプリのシグナル、またはカスタム条件
売りシグナル利用: アプリのシグナル、またはカスタム条件

### 術的考慮事項
シミュレーションの実装における考慮事項
データ量: 長期間、複数の銘柄でシミュレーションを行う場合、処理に時間がかかる可能性があります。非同期処理やバックグラウンドでの実行も検討が必要です。
精度: 日次データのみを使用するため、日中の値動きや指値・成行などの細かい取引条件は考慮できません。あくまで「ルール通りの売買」をシミュレートするツールであることを明記することが重要です。
パフォーマンス: 大量の過去データに対する移動平均線の計算や、売買条件のチェックは計算コストが高くなる可能性があります。効率的なアルゴリズムやデータベースクエリの最適化が必要です。
YahooFinanceAPIの利用制限: 過去データの取得期間やリクエスト回数に制限があるため、効率的にデータを取得・キャッシュする仕組みが必要です。
