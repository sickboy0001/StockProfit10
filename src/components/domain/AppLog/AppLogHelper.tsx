/**
 * Type guard to check if a value is a plain object (and not an array or null).
 * @param value The value to check.
 * @returns True if the value is a plain object.
 */
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

// contextオブジェクトを整形して表示するためのヘルパー関数
export const formatContextForDisplay = (context: unknown): string => {
  // contextがオブジェクトでない場合は、適切に処理する
  if (!isObject(context)) {
    if (context === null || context === undefined) {
      return "-";
    }
    return JSON.stringify(context);
  }

  // 'portfolioId' を優先的に表示するためにキーの順序を再構築
  const { portfolioId, ...rest } = context;

  if (portfolioId !== undefined) {
    // portfolioIdを先頭にした、より読みやすい文字列を生成
    const parts = [`portfolioId: ${String(portfolioId)}`];
    Object.entries(rest).forEach(([key, value]) => {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    });
    return parts.join(", ");
  }

  return JSON.stringify(context);
};
