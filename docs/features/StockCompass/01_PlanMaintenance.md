
#### **2. `01_PlanMaintenance.md` (計画の管理)**

# 01_PlanMaintenance: 計画の管理

## 役割の説明
### PlanMaintenance（計画の管理）
* **定義：** プランの一覧画面、実施の有無、GenerateResultの実施のトリガー
* **役割：** ユーザーが作成した多様な**分析計画（プラン）を一覧で確認し、管理する中心的な機能**を担います。「GeneratResultの実施のトリガー」がここに含まれます。ユーザーは管理画面から直接シミュレーション実行を指示できる流れが想像できます。プランの有効/無効の切り替え（実施の有無）なども含まれます。

## 機能詳細

### 1. プラン一覧表示
* ユーザーがこれまでに作成・保存した全ての分析計画を一覧で表示します。
* 各プランの状態（有効/無効）や、最終更新日などの概要情報を表示します。
* 各プランの詳細編集画面、またはシミュレーション実行画面へのリンクを提供します。

### 2. プランの有効/無効切り替え
* 特定のプランをシミュレーション対象から除外したり、再度有効にしたりする機能です。
* 「実施の有無」として、プランのステータス管理を行います。

### 3. シミュレーション実行トリガー
* 一覧画面から、選択したプランに基づいてGenerateResultPlanの処理を起動するトリガーを提供します。
* これにより、ユーザーは過去のプランを簡単に再実行できます。

### 関連する画面
* **6. 検証実行・履歴画面:**
    * 「過去の検証実行リスト」の表示と、それらの管理。
    * 選択中の条件を表示し、「検証実行」をトリガーする。

### 関連するテーブル
* **`sptch_analysis_conditions`**: 分析条件のメインテーブルであり、プランのID、名前、メモ、各サブ条件への参照、有効/無効ステータス（必要であれば追加）、作成・更新・削除日時を管理します。
    * このテーブルのレコードが、一覧表示される各「プラン」に対応します。


## 画面
### プランの一覧
* 無効は一覧に上がらくなるだけです。
* すべて表示で無効も表示されます。

|参照|作成日時|作成者|名前|メモ|銘柄|スクリーニング|期間|S/L|Entry|Exit|利益率|-|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|結果参照/編集/引用新規	|2025/01/07 11:12|sickboy|検証用||(9)1234,1111,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|+2%|無効|
|結果参照/編集/引用新規	|2025/01/11 23:12|sickboy|検証用||(21)1234,2222,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|+11%|無効|
|プラン実行/編集/引用新規	|2025/01/14 20:12|sickboy|検証用||(10)5555,4444,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|-|無効|
|プラン実行/編集/引用新規	|2025/01/16 08:12|sickboy|検証用||(2)1234,2123・・・・|出来高:100以上、資本金|2024/01/01-2025/01/01|ロング|Entry↓|Exit↓|-|無効|


```sql
-- drop function get_analysis_conditions_for_display
-- select * from get_analysis_conditions_for_display('76b8d0ed-825d-43a6-a725-37e10c11015b')
CREATE OR REPLACE FUNCTION public.get_analysis_conditions_for_display(
    p_user_id UUID DEFAULT NULL -- Optional: filter by user
)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    user_name TEXT, -- User's display name
    plan_name TEXT,
    plan_memo TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    stock_selection_id BIGINT,
    stock_selection_name TEXT,
    simulation_period_id BIGINT,
    simulation_period_name TEXT,
    simulation_start_date DATE,
    simulation_end_date DATE,
    trade_parameter_id BIGINT,
    trade_parameter_name TEXT,
    signal_id BIGINT,
    signal_name TEXT,
    transaction_type VARCHAR(10),
    entry_signal_id BIGINT,
    entry_signal_name TEXT,
    exit_signal_id BIGINT,
    exit_signal_name TEXT,
    fee_tax_id BIGINT,
    fee_tax_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sac.id,
        sac.user_id,
        su.name AS user_name, -- Fetch user name from spt_user
        sac.name AS plan_name,
        sac.memo AS plan_memo,
        sac.deleted_at,
        sac.created_at,
        sac.updated_at,
        sssh.id AS stock_selection_id,
        sssh.name AS stock_selection_name,
        ssp.id AS simulation_period_id ,
        ssp.name AS simulation_period_name,
        ssp.start_date AS simulation_start_date,
        ssp.end_date AS simulation_end_date,
        stp.id AS trade_parameter_id,
        stp.name AS trade_parameter_name,
        ss.id as signal_id ,
        ss.name AS signal_name,
        ss.transaction_type,
        ses.id as entry_signal_id ,
        ses.name AS entry_signal_name,
        sexs.id as exit_signal_id,
        sexs.name AS exit_signal_name,
        sft.id as fee_tax_id ,
        sft.name AS fee_tax_name
    FROM
        sptch_analysis_conditions sac
    LEFT JOIN
        spt_user su ON sac.user_id = su.id -- Join with spt_user
    LEFT JOIN
        sptch_stock_selections_header sssh ON sac.stock_selection_header_id = sssh.id
    LEFT JOIN
        sptch_simulation_periods ssp ON sac.simulation_period_id = ssp.id
    LEFT JOIN
        sptch_trade_parameters stp ON sac.trade_parameter_id = stp.id
    LEFT JOIN
        sptch_signals ss ON sac.signal_id = ss.id
    LEFT JOIN
        sptch_entry_signals ses ON ss.entry_signal_id = ses.id
    LEFT JOIN
        sptch_exit_signals sexs ON ss.exit_signal_id = sexs.id
    LEFT JOIN
        sptch_fee_taxes sft ON sac.fee_tax_id = sft.id
    WHERE
        (p_user_id IS NULL OR sac.user_id = p_user_id)     ORDER BY
        sac.created_at DESC;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_analysis_conditions_for_display(UUID) TO authenticated;


-- select * from get_analysis_conditions_for_display('76b8d0ed-825d-43a6-a725-37e10c11015b')



```

```js

```