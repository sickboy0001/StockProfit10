```sql

-- テーブル作成の順番留意すること。
-- updated_at を自動更新するトリガー関数 (任意だが推奨)
-- Supabaseのトリガー設定でこの関数をBEFORE UPDATEに設定してください
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 1. sptch_analysis_conditions
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

-- 2. sptch_stock_selections_header
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

-- 3. sptch_stock_selections_stocks
CREATE TABLE sptch_stock_selections_stocks (
    id BIGSERIAL PRIMARY KEY,
    header_id BIGINT NOT NULL REFERENCES sptch_stock_selections_header(id) ON DELETE CASCADE,
    order_no INTEGER NOT NULL, -- 銘柄の表示順/連番
    stock_code VARCHAR(10) NOT NULL, -- 銘柄コード
    UNIQUE (header_id, stock_code) -- 同じヘッダーID内で同じ銘柄コードは重複しない
);
CREATE INDEX idx_sptch_stock_selections_stocks_header_id ON sptch_stock_selections_stocks(header_id);

-- 4. sptch_simulation_periods
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

-- 5. sptch_trade_parameters
CREATE TABLE sptch_trade_parameters (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- 条件を作成したユーザーのID (RLSで管理)
    name TEXT NOT NULL, -- 条件セットの名前
    memo TEXT, -- 条件セットに関するメモ
    max_purchase_amount INTEGER, -- 最大購入金額
    min_purchase_amount INTEGER, -- 最小購入金額
    min_volume BIGINT, -- 最低出来高
    trade_unit INTEGER NOT NULL, -- 取引単位
    conditions_json JSONB , -- エントリー条件 (JSONで格納)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード作成日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- レコード更新日時
    deleted_at TIMESTAMP WITH TIME ZONE -- レコード削除日時 (論理削除の場合)
);

-- ALTER TABLE public.sptch_trade_parameters
-- ADD COLUMN min_purchase_amount INTEGER;
-- CREATE TRIGGER set_updated_at_on_trade_parameters
-- BEFORE UPDATE ON sptch_trade_parameters
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();
-- 6. sptch_signals
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

-- 7. sptch_entry_signals
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

-- 8. sptch_exit_signals
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

-- 9. sptch_fee_taxes
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


-- RLSを無効化（開発環境用。本番では適切に設定する）
ALTER TABLE public.sptch_analysis_conditions DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_stock_selections_header DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_stock_selections_stocks DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_simulation_periods DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_trade_parameters DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_entry_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_exit_signals DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.sptch_fee_taxes DISABLE ROW LEVEL SECURITY; 

-- 権限付与（開発環境用。本番では最小権限の原則に従う）
GRANT USAGE ON SCHEMA "public" TO anon; 
GRANT USAGE ON SCHEMA "public" TO authenticated; 

-- テーブルへのアクセス権限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated; 
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO anon;

-- シーケンスへのアクセス権限 (INSERT時の自動採番ID生成に必要)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO anon;

```
