// src/app/convert-stocks/page.tsx
"use client";

import { convertAndImportStocks } from "@/app/actions/convertAndImportStocks";
import React, { useState } from "react";

export default function PageConvertSptStock() {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const handleConvertAndImport = async () => {
    setLoading(true);
    setStatusMessage("変換とインポートを開始しています...");
    setIsError(false);

    try {
      const result = await convertAndImportStocks(); // Server Actionを呼び出し

      if (result.success) {
        setStatusMessage(result.message);
        setIsError(false);
      } else {
        setStatusMessage(`エラーが発生しました: ${result.message}`);
        setIsError(true);
      }
    } catch (error: unknown) {
      console.error("Client-side error calling Server Action:", error);
      let errorMessage = "予期せぬエラーが発生しました。";
      if (error instanceof Error) {
        errorMessage = `予期せぬエラーが発生しました: ${error.message}`;
      } else if (typeof error === "string") {
        errorMessage = `予期せぬエラーが発生しました: ${error}`;
      }
      setStatusMessage(errorMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h1
        style={{ textAlign: "center", marginBottom: "1.5rem", color: "#333" }}
      >
        企業マスターデータ変換 & インポート
      </h1>
      <p style={{ textAlign: "center", marginBottom: "2rem", color: "#555" }}>
        「jpx_company_master」テーブルのデータを「spt_stocks」テーブルに変換してインポートします。
        この操作は大量のデータを処理する可能性があります。
      </p>

      <button
        onClick={handleConvertAndImport}
        disabled={loading}
        style={{
          display: "block",
          width: "80%",
          margin: "0 auto 1.5rem auto",
          padding: "1rem 2rem",
          backgroundColor: loading ? "#6c757d" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "1.1rem",
          fontWeight: "bold",
          transition: "background-color 0.3s ease",
        }}
      >
        {loading ? "処理中..." : "変換とインポートを実行"}
      </button>

      {statusMessage && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "4px",
            backgroundColor: isError ? "#ffe6e6" : "#e6ffe6",
            border: `1px solid ${isError ? "red" : "green"}`,
            color: isError ? "#cc0000" : "#006600",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
