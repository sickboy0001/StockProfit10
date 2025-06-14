"use client";

import React, { useState, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントをインポート

// Supabaseクライアントの初期化
// 環境変数からSUPABASE_URLとSUPABASE_ANON_KEYを取得します
// .env.local ファイルに以下のように設定してください:
// NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// jpx_company_master テーブルのカラム名と対応するデータ型
// この型は、Supabaseに挿入する際のデータの形状を定義します。
interface JpxCompanyMasterData {
  code: string;
  company_name: string;
  market_segment: string;
  industry_33_code: string | null;
  industry_33_name: string | null;
  industry_17_code: string | null;
  industry_17_name: string | null;
  scale_code: string | null;
  scale_name: string | null;
  // updated_at はDB側で自動生成されるので、ここでは含めない
}

export default function PageImportJsx() {
  const [inputText, setInputText] = useState<string>("");
  const [parsedData, setParsedData] = useState<JpxCompanyMasterData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // 入力テキストを解析する関数
  const parseInputText = useCallback(() => {
    setError(null);
    setParsedData([]);
    const lines = inputText.trim().split("\n");

    if (lines.length <= 1) {
      setError("データが入力されていないか、ヘッダー行のみです。");
      return;
    }

    // ヘッダー行をスキップし、データ行のみを処理
    const dataLines = lines.slice(1);
    const parsed: JpxCompanyMasterData[] = [];

    // 各行をパース
    dataLines.forEach((line, index) => {
      // タブ区切りまたは複数のスペース区切りを想定して分割
      // 日付	コード	銘柄名	市場・商品区分	33業種コード	33業種区分	17業種コード	17業種区分	規模コード	規模区分
      const parts = line.split(/\t|\s{2,}/).map((part) => part.trim()); // タブ区切り or 2つ以上のスペース区切り

      // データ件数が正しくない場合はスキップまたはエラー
      if (parts.length < 10) {
        // 日付を除いた9項目 + 日付の合計10項目
        console.warn(`Skipping malformed line ${index + 2}: "${line}"`);
        // setError(`行 ${index + 2} の形式が正しくありません。期待される項目数: 10, 実際の項目数: ${parts.length}`);
        // return; // エラーとせず、スキップして続行することも可能
      }

      // 日付項目は不要なのでスキップし、コードから始める
      const code = parts[1];
      const company_name = parts[2];
      const market_segment = parts[3];
      const industry_33_code = parts[4] === "-" ? null : parts[4];
      const industry_33_name = parts[5] === "-" ? null : parts[5];
      const industry_17_code = parts[6] === "-" ? null : parts[6];
      const industry_17_name = parts[7] === "-" ? null : parts[7];
      const scale_code = parts[8] === "-" ? null : parts[8];
      const scale_name = parts[9] === "-" ? null : parts[9];

      // 必須項目が欠けていないかチェック
      if (!code || !company_name || !market_segment) {
        console.warn(
          `Skipping line ${index + 2} due to missing required fields: "${line}"`
        );
        setError(
          `必須項目 (コード, 銘柄名, 市場・商品区分) が欠けている行があります。`
        );
        return;
      }

      parsed.push({
        code,
        company_name,
        market_segment,
        industry_33_code,
        industry_33_name,
        industry_17_code,
        industry_17_name,
        scale_code,
        scale_name,
      });
    });

    if (parsed.length === 0 && !error) {
      setError("有効なデータ行が見つかりませんでした。");
    }
    setParsedData(parsed);
  }, [inputText, error]);

  // インポートボタンのハンドラー
  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("インポートするデータがありません。");
      return;
    }

    setLoading(true);
    setImportStatus(null);
    setError(null);

    // SupabaseにUPSERT（挿入または更新）を実行
    // 5000件のデータを一度に送信するとタイムアウトする可能性があるため、バッチ処理を検討
    // Supabaseはデフォルトで1000件のバッチサイズを推奨しています
    const BATCH_SIZE = 500; // 一度に送信するレコード数

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
      const batch = parsedData.slice(i, i + BATCH_SIZE);
      try {
        const { error: supabaseError } = await supabase
          .from("jpx_company_master")
          .upsert(batch, { onConflict: "code", ignoreDuplicates: false }); // codeが競合したら更新

        if (supabaseError) {
          console.error("Supabase Upsert Error:", supabaseError);
          errors.push(
            `バッチ ${
              i / BATCH_SIZE + 1
            } のインポート中にエラーが発生しました: ${supabaseError.message}`
          );
          failCount += batch.length; // エラーが発生したバッチの全件を失敗としてカウント
          break; // エラーが発生したら以降の処理を中止
        } else {
          successCount += batch.length;
          setImportStatus(
            `インポート中... ${successCount} / ${parsedData.length} 件処理済み`
          );
        }
      } catch (err: unknown) {
        console.error("Network or unexpected error during upsert:", err);
        if (err instanceof Error) {
          errors.push(`ネットワークまたは予期せぬエラー: ${err.message}`);
        } else {
          errors.push(`ネットワークまたは予期せぬエラーが発生しました。`);
        }
        failCount += batch.length;
        break; // エラーが発生したら以降の処理を中止
      }
    }

    setLoading(false);

    if (errors.length > 0) {
      setError(`インポート中にエラーが発生しました: ${errors.join("; ")}`);
      setImportStatus(
        `インポート失敗。成功: ${successCount} 件, 失敗: ${failCount} 件。`
      );
    } else {
      setImportStatus(
        `全 ${successCount} 件のデータを正常にインポートしました！`
      );
      setInputText(""); // 成功したら入力をクリア
      setParsedData([]); // 解析データもクリア
    }
  };

  // パースされたデータのプレビュー用テーブルヘッダー
  const tableHeaders = useMemo(
    () => [
      "銘柄コード",
      "銘柄名",
      "市場・商品区分",
      "33業種コード",
      "33業種区分",
      "17業種コード",
      "17業種区分",
      "規模コード",
      "規模区分",
    ],
    []
  );

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "2rem auto",
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        JPX企業マスターデータ インポート
      </h1>
      <p>
        [その他統計資料](https://www.jpx.co.jp/markets/statistics-equities/misc/01.html)のXmlから取得する。
        そこから、Xmlを開いて、全選択して、インポート画面へコピー
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <label
          htmlFor="import-data"
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          インポート対象データをテキストエリアに貼り付けてください:
        </label>
        <textarea
          id="import-data"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={15}
          style={{
            width: "100%",
            padding: "0.8rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
          placeholder="日付	コード	銘柄名	市場・商品区分	33業種コード	..."
        />
        <button
          onClick={parseInputText}
          style={{
            marginTop: "1rem",
            padding: "0.8rem 1.5rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          データを確認
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "red",
            marginBottom: "1rem",
            border: "1px solid red",
            padding: "0.8rem",
            borderRadius: "4px",
          }}
        >
          エラー: {error}
        </div>
      )}

      {parsedData.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
            確認: 解析されたデータ ({parsedData.length} 件)
          </h2>
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #eee",
              marginBottom: "1rem",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#f5f5f5",
                }}
              >
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "0.6rem",
                        border: "1px solid #eee",
                        textAlign: "left",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 100).map(
                  (
                    row,
                    index // 最初の100件のみプレビュー
                  ) => (
                    <tr key={index}>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.code}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.company_name}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.market_segment}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.industry_33_code || "NULL"}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.industry_33_name || "NULL"}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.industry_17_code || "NULL"}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.industry_17_name || "NULL"}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.scale_code || "NULL"}
                      </td>
                      <td
                        style={{ padding: "0.6rem", border: "1px solid #eee" }}
                      >
                        {row.scale_name || "NULL"}
                      </td>
                    </tr>
                  )
                )}
                {parsedData.length > 100 && (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      style={{
                        padding: "0.6rem",
                        border: "1px solid #eee",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      ... さらに {parsedData.length - 100}{" "}
                      件のデータがあります。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleImport}
            disabled={loading}
            style={{
              padding: "0.8rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "インポート中..." : "データをインポート"}
          </button>
        </div>
      )}

      {importStatus && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.8rem",
            borderRadius: "4px",
            backgroundColor: importStatus.includes("成功")
              ? "#e6ffe6"
              : "#ffe6e6",
            border: importStatus.includes("成功")
              ? "1px solid green"
              : "1px solid red",
          }}
        >
          {importStatus}
        </div>
      )}
    </div>
  );
}
