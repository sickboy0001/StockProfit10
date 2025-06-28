import crypto from "crypto";

/**
 * オブジェクトをキーでソートして安定したJSON文字列に変換します。
 * これにより、キーの順序が異なっていても同じ内容のオブジェクトは同じ文字列になります。
 * @param obj 文字列化するオブジェクト
 * @returns 安定したJSON文字列
 */
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => stableStringify(item)).join(",")}]`;
  }

  const sortedKeys = Object.keys(obj).sort();
  const keyValuePairs = sortedKeys.map((key) => {
    const value = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${stableStringify(value)}`;
  });

  return `{${keyValuePairs.join(",")}}`;
}

/**
 * 汎用的なハッシュ生成関数
 * @param {Array<unknown>} values - 任意の値の配列
 * @returns {string} - SHA256のハッシュ値（hex文字列）
 */
export function generateHash(values: unknown[]): string {
  const normalized = values.map((v: unknown) => {
    if (v === null || v === undefined) {
      return "";
    }
    if (typeof v === "object") {
      return stableStringify(v);
    }
    return String(v);
  });

  const joined = normalized.join("|");

  return crypto.createHash("sha256").update(joined).digest("hex");
}
