// src/components/domain/Stock/api/stockApi.ts
import { useQuery } from "@tanstack/react-query";
import { DailyQuote } from "@/types/stock";

import { useEffect, useState } from "react";
import {
  readAndRegistCompanyDailyQuotesEntry,
  ReadAndRegistCompanyDailyQuotesEntryResultResult,
} from "@/app/actions/readAndRegistEntry";
import { getDailyQuotes } from "@/app/actions/readAndRegistStockCompanyDetails";

interface UseStockQuotesOptions {
  stockCode: string;
  startDate: string;
  endDate: string;
  enabled?: boolean; // クエリの有効/無効を制御
}

export const useStockQuotes = ({
  stockCode,
  startDate,
  endDate,
  enabled = true,
}: UseStockQuotesOptions) => {
  // stockCodeから末尾の ".T" を削除
  const processedStockCode = stockCode.endsWith(".T")
    ? stockCode.slice(0, -2)
    : stockCode;

  // readAndRegistStockInfo の結果を保持する state
  const [registrationResult, setRegistrationResult] = useState<
    Partial<ReadAndRegistCompanyDailyQuotesEntryResultResult> & {
      actionError?: string | null;
    }
  >({
    successMessages: [],
    errorMessages: [],
    stockData: null,
    companyInfo: null,
    actionError: null,
  });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // processedStockCode, startDate, endDate が有効な場合のみ実行
    if (processedStockCode && startDate && endDate) {
      const callReadAndRegistStockInfo = async () => {
        setIsRegistering(true);
        setRegistrationResult({
          successMessages: [],
          errorMessages: [],
          stockData: null,
          companyInfo: null,
          actionError: null,
        }); // 呼び出し前にリセット
        try {
          // ★ サーバーアクションを呼び出し
          const result = await readAndRegistCompanyDailyQuotesEntry(
            processedStockCode,
            startDate,
            endDate
          );
          setRegistrationResult({
            successMessages: result.successMessages || [],
            errorMessages: result.errorMessages || [],
            stockData: result.stockData,
            companyInfo: result.companyInfo,
            actionError: null,
          });

          if (result.errorMessages && result.errorMessages.length > 0) {
            console.error(
              "readAndRegistStockInfo errors:",
              result.errorMessages.join("\n")
            );
            if (result.successMessages && result.successMessages.length > 0) {
              console.log(
                "readAndRegistStockInfo partial successes:",
                result.successMessages.join("\n")
              );
            }
          } else if (
            result.successMessages &&
            result.successMessages.length > 0
          ) {
            console.log(
              "readAndRegistStockInfo successes:",
              result.successMessages.join("\n")
            );
          } else {
            console.log(
              "readAndRegistStockInfo completed with no specific messages."
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown error during registration process";
          console.error(
            "Error calling readAndRegistStockInfo in effect:",
            error
          );
          setRegistrationResult({
            successMessages: [],
            errorMessages: [],
            stockData: null,
            companyInfo: null,
            actionError: errorMessage,
          });
        } finally {
          setIsRegistering(false);
        }
      };
      callReadAndRegistStockInfo();
    }
  }, [processedStockCode, startDate, endDate]); // 依存配列: これらの値が変わるたびにeffectが再実行される

  const queryResult = useQuery<DailyQuote[], Error>({
    queryKey: ["dailyQuotes", processedStockCode, startDate, endDate],
    queryFn: async () => {
      const result = await getDailyQuotes(
        processedStockCode,
        startDate,
        endDate
      );
      if ("error" in result) {
        throw new Error(result.error);
      }
      // console.log("useQuery", result);
      return result;
    },
    enabled: enabled && !!processedStockCode && !!startDate && !!endDate, // 全てのパラメータが存在する場合にのみクエリを実行
    staleTime: 1000 * 60 * 5, // 5分間はデータをfreshとして扱う
  });

  return {
    ...queryResult, // data, isLoading, isError, error など
    registrationResult, // readAndRegistStockInfo の結果
    isRegistering, // readAndRegistStockInfo の実行状態
  };
};
