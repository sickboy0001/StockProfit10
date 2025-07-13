import { SupabaseClient } from "@supabase/supabase-js";

/**
 * エントリーシグナルの個別条件
 */
interface EntryCondition {
  type: string;
  variableADays?: number;
  macdLongEma?: number;
}

/**
 * エグジットシグナルの個別条件
 */
interface ExitCondition {
  type: string;
  days?: number;
}

/**
 * エントリーシグナル全体のJSON構造
 */
interface EntrySignalConditions {
  entryConditions: EntryCondition[];
}

/**
 * エグジットシグナル全体のJSON構造
 */
interface ExitSignalConditions {
  exitConditions: ExitCondition[];
}

export function getDaysNBefore(conditions_json: string | object): number {
  // console.log("getDaysNBefore", conditions_json);
  try {
    // 引数が文字列ならパースし、オブジェクトならそのまま使用する
    const conditions: EntrySignalConditions =
      typeof conditions_json === "string"
        ? JSON.parse(conditions_json)
        : (conditions_json as EntrySignalConditions);

    if (conditions && Array.isArray(conditions.entryConditions)) {
      const entryConditions = conditions.entryConditions;

      const daysArray = entryConditions.map((cond) => {
        if (cond.type === "priceMovement") return cond.variableADays || 0;
        if (cond.type === "macdCrossover") return cond.macdLongEma || 0;
        if (cond.type === "macdZeroCrossover") return cond.macdLongEma || 0;
        return 0;
      });

      return Math.max(...daysArray, 3);
    }
  } catch (error) {
    console.error("Error parsing entry conditions JSON:", error);
  }
  return 3;
}

export function getDaysMAfter(conditions_json: string | object): number {
  // console.log("getDaysMAfter", conditions_json);
  try {
    // 引数が文字列ならパースし、オブジェクトならそのまま使用する
    const conditions: ExitSignalConditions =
      typeof conditions_json === "string"
        ? JSON.parse(conditions_json)
        : (conditions_json as ExitSignalConditions);

    // `exitConditions` 配列が存在するかチェック
    if (conditions && Array.isArray(conditions.exitConditions)) {
      // `type` が 'fixedDays' の条件を探す
      const fixedDaysCondition = conditions.exitConditions.find(
        (cond) => cond.type === "fixedDays"
      );

      // 条件が見つかり、`days` プロパティが数値であればその値を返す
      if (fixedDaysCondition && typeof fixedDaysCondition.days === "number") {
        return fixedDaysCondition.days;
      }
    }
  } catch (error) {
    console.error("Error parsing exit conditions JSON:", error);
  }

  // 'fixedDays' が見つからない場合やJSONパースに失敗した場合のデフォルト値
  return 10;
}
//start_dateから、dayN日前の日付の入手
// start_date:2025-07-04(Fri)
// dayN:1
// return 2025-07-03(Thu)
// start_date:2025-07-05(Sun)
// dayN:5
// return 2025-06-30(Mon)
//
// start_date:2025-07-05(Sun)
// dayN:6
// return 2025-06-27(Fri)
//
// start_date:2025-07-05(Sun)
// dayN:0
// return 2025-06-27(Fri)
//
export async function getDateWithPeriosStart(
  supabase: SupabaseClient,
  start_date: string | undefined,
  daysN: number
): Promise<string> {
  if (!start_date) {
    throw new Error("開始日が指定されていません。");
  }
  // Nが0以下の場合は、ロジック上意味がないためエラーとします。
  if (daysN <= 0) {
    throw new Error("N日前を指定する日数は1以上である必要があります。");
  }

  // Supabaseの .range(from, to) を使って OFFSET と LIMIT を実現します。
  // N番目のレコードを取得するには、オフセットを N-1 に設定します。
  const offset = daysN - 1;

  const { data, error } = await supabase
    .from("market_calendar")
    .select("date")
    .lt("date", start_date) // 開始日を含まない前の日付
    .eq("is_open", true) // 営業日のみ
    .order("date", { ascending: false }) // 新しい順にソート
    .range(offset, offset); // N番目のレコードを1つだけ取得

  if (error) {
    console.error("Error fetching previous business day:", error);
    throw new Error(`営業日前の日付の取得に失敗しました: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      `指定された開始日(${start_date})の${daysN}営業日前のデータが見つかりませんでした。カレンダーの範囲を確認してください。`
    );
  }

  console.log("getDateWithPeriosEnd:start_date", start_date);
  console.log("getDateWithPeriosStart:result", data[0].date);
  return data[0].date;
}

export async function getDateNextOpenMarketDate(
  supabase: SupabaseClient,
  start_date: string | undefined
): Promise<string> {
  if (!start_date) {
    throw new Error("開始日が指定されていません。");
  }
  // // Nが0以下の場合は、ロジック上意味がないためエラーとします。
  // if (daysN <= 0) {
  //   throw new Error("N日前を指定する日数は1以上である必要があります。");
  // }

  // Supabaseの .range(from, to) を使って OFFSET と LIMIT を実現します。
  // N番目のレコードを取得するには、オフセットを N-1 に設定します。
  const offset = 1;

  const { data, error } = await supabase
    .from("market_calendar")
    .select("date")
    .gte("date", start_date) // 開始日を含まない前の日付
    .eq("is_open", true) // 営業日のみ
    .order("date", { ascending: true }) // 古い順
    .range(offset, offset); // N番目のレコードを1つだけ取得

  if (error) {
    console.error("Error fetching previous business day:", error);
    throw new Error(`今日以降の営業日を取得できませんでした: ${error.message}`);
  }

  // console.log("getDateNextOpenMarketDate:start_date", start_date);
  // console.log("getDateNextOpenMarketDate:result", data[0].date);
  return data[0].date;
}

//end_dateから、dayM日後の日付の入手
// end_date:2025-07-04(Fri)
// dayM:1
// return 2025-07-07(Mon)
// end_date:2025-07-05(Sun)
// dayM:5
// return 2025-07-11(Fri)
// end_date:2025-07-05(Sun)
// dayM:6
export async function getDateWithPeriosEnd(
  supabase: SupabaseClient,
  end_date: string | undefined,
  daysM: number
): Promise<string> {
  if (!end_date) {
    throw new Error("終了日が指定されていません。");
  }
  // Mが0以下の場合は、ロジック上意味がないためエラーとします。
  if (daysM <= 0) {
    throw new Error("M日後を指定する日数は1以上である必要があります。");
  }

  // Supabaseの .range(from, to) を使って OFFSET と LIMIT を実現します。
  // M番目のレコードを取得するには、オフセットを M-1 に設定します。
  const offset = daysM - 1;

  const { data, error } = await supabase
    .from("market_calendar")
    .select("date")
    .gt("date", end_date) // 終了日を含まない後の日付
    .eq("is_open", true) // 営業日のみ
    .order("date", { ascending: true }) // 古い順にソート
    .range(offset, offset); // M番目のレコードを1つだけ取得

  if (error) {
    console.error("Error fetching next business day:", error);
    throw new Error(`営業日後の日付の取得に失敗しました: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      `指定された終了日(${end_date})の${daysM}営業日後のデータが見つかりませんでした。カレンダーの範囲を確認してください。`
    );
  }
  // console.log("getDateWithPeriosEnd:end_date", end_date);
  // console.log("getDateWithPeriosEnd:result", data[0].date);
  return data[0].date;
}
