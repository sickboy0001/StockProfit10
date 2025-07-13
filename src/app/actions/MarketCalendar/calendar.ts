// C:\work\dev\spa\stockprofit10-app\src\app\actions\MarketCalendar\calendar.ts

"use server"; // このファイル内の関数がサーバーアクションとして実行されることを宣言

import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントのインポート

// SupabaseのURLとAnonキーを環境変数から取得します。
// 実際のアプリケーションでは、これらの環境変数を設定する必要があります。
// 例: .env.local ファイルに NEXT_PUBLIC_SUPABASE_URL="あなたのURL" と NEXT_PUBLIC_SUPABASE_ANON_KEY="あなたのキー" を追加
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabaseクライアントの初期化
// ここで初期化されたクライアントは、サーバーアクション内で使用されます。
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 日付オブジェクトを 'YYYY-MM-DD' 形式の文字列にフォーマットします。
 * これはSupabaseのDATE型カラムに適しています。
 * @param date フォーマットする日付オブジェクト
 * @returns 'YYYY-MM-DD' 形式の文字列
 */
const formatDbDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 月は0-indexedなので+1
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 日付オブジェクトを 'YYYY/M/D' 形式の文字列にフォーマットします。
 * これはCSVからパースした日付をマップのキーとして使用するのに適しています。
 * @param date フォーマットする日付オブジェクト
 * @returns 'YYYY/M/D' 形式の文字列
 */
const formatDateKeyFromCsv = (date: Date): string => {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 指定された日付の市場開閉ステータスと備考を決定します。
 * 優先順位: 年始 -> CSV祝日 -> 週末 -> デフォルト
 * @param date 判定する日付
 * @param csvHolidaysMap CSVからパースされた祝日のマップ (日付文字列 -> 祝日名)
 * @returns is_open (boolean) と note (string | null) を含むオブジェクト
 */
function getMarketStatus(date: Date, csvHolidaysMap: Map<string, string>) {
  let isOpen = true;
  let note: string | null = null;

  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // 1. 年始のチェック (最優先)
  if (month === 0 && day >= 1 && day <= 3) {
    // 1月1日, 2日, 3日
    isOpen = false;
    if (day === 1) {
      note = "元日";
    } else {
      // 1月2日または3日
      note = "年始休暇";
    }
  }
  // 2. CSV祝日のチェック (次に優先、年始で設定されていない場合のみ)
  else {
    const dateKey = formatDateKeyFromCsv(date);
    const holidayNameFromCsv = csvHolidaysMap.get(dateKey);
    if (holidayNameFromCsv) {
      isOpen = false;
      note = holidayNameFromCsv;
    }
    // 3. 週末のチェック (次に優先、年始またはCSV祝日で設定されていない場合のみ)
    else if (dayOfWeek === 0) {
      // 日曜日
      isOpen = false;
      note = "日曜日";
    } else if (dayOfWeek === 6) {
      // 土曜日
      isOpen = false;
      note = "土曜日";
    }
  }
  // 4. デフォルト (上記いずれにも該当しない場合は isOpen=true, note=null のまま)

  return { is_open: isOpen, note: note };
}

/**
 * CSVテキストを受け取り、解析してSupabaseのmarket_calendarテーブルにインポートします。
 * CSVに含まれる祝日情報と、週末、年始のルールに基づいて、
 * CSVデータ内の最も古い日付から最も新しい日付までの市場開閉ステータスを生成し、upsertします。
 *
 * @param csvText インポートするCSV形式の文字列 (国民の祝日・休日月日,国民の祝日・休日名称)
 * @returns インポートの成功/失敗を示すオブジェクトとメッセージ
 */
export async function ImportCsv(csvText: string) {
  try {
    const lines = csvText.trim().split("\n");
    const dataRows = lines.slice(1); // ヘッダーをスキップ

    // CSVから祝日情報をマップに格納 (例: "1955/1/1" -> "元日")
    const csvHolidaysMap = new Map<string, string>();
    // forEachの代わりにreduceを使用してminDateとmaxDateを安全に取得します。
    // これにより、TypeScriptの型推論が正しく機能し、never型エラーを回避できます。
    const { minDate, maxDate } = dataRows.reduce(
      (acc, line) => {
        const [dateStr, name] = line.split(",");
        if (dateStr && name) {
          // 'YYYY/M/D'形式の日付文字列をパース
          const parsedDate = new Date(dateStr.trim());
          if (!isNaN(parsedDate.getTime())) {
            // 有効な日付かチェック
            csvHolidaysMap.set(formatDateKeyFromCsv(parsedDate), name.trim());

            // minDateとmaxDateを更新
            if (acc.minDate === null || parsedDate < acc.minDate) {
              acc.minDate = parsedDate;
            }
            if (acc.maxDate === null || parsedDate > acc.maxDate) {
              acc.maxDate = parsedDate;
            }
          }
        }
        return acc;
      },
      { minDate: null as Date | null, maxDate: null as Date | null }
    );

    console.log("importCSV", minDate, maxDate);

    if (minDate === null || maxDate === null) {
      throw new Error(
        "CSVデータから有効な日付範囲を特定できませんでした。CSVデータが正しい形式で提供されていることを確認してください。"
      );
    }

    const recordsToUpsert: {
      date: string;
      is_open: boolean;
      note: string | null;
    }[] = [];

    // CSVデータ内の最も古い日付から最も新しい日付までの全日付をループして、市場開閉ステータスを決定
    // forループだとTypeScriptの型推論がmaxDateをnever型と誤認することがあるため、whileループを使用します。
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      // getMarketStatusには新しいDateオブジェクトを渡すことが重要です。
      // ループ変数currentDateを直接渡すと、次のループで日付がずれる原因になります。
      const { is_open, note } = getMarketStatus(
        new Date(currentDate),
        csvHolidaysMap
      );

      recordsToUpsert.push({
        date: formatDbDate(currentDate), // SupabaseのDATE型に合う形式
        is_open: is_open,
        note: note,
      });

      // 次の日に進める
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log("upsert start", recordsToUpsert.slice(0, 10));

    // Supabaseの 'market_calendar' テーブルに対してupsert操作を実行します。
    // 'onConflict: "date"' により、もし'date'列の値が既存のレコードと競合する場合、
    // そのレコードを更新します。競合しない場合は新しいレコードが挿入されます。
    const { data, error } = await supabase
      .from("market_calendar") // ターゲットテーブル名
      .upsert(recordsToUpsert, { onConflict: "date" }); // 'date'列を競合解決のキーとして指定

    if (error) {
      console.error("Supabase upsert error:", error.message);
      throw new Error(
        `市場カレンダーのインポート中にエラーが発生しました: ${error.message}`
      );
    }

    console.log("市場カレンダーデータが正常にインポートされました。", data);
    return {
      success: true,
      message: `市場カレンダーデータが正常にインポートされました (${formatDbDate(
        minDate
      )} から ${formatDbDate(maxDate)} まで)。`,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "予期せぬ市場カレンダーインポートエラーが発生しました。";
    console.error("市場カレンダーインポート中にエラーが発生しました:", message);
    return {
      success: false,
      message: `市場カレンダーインポートエラー: ${message}`,
    };
  }
}

/**
 * 指定された年の市場カレンダーデータをSupabaseから取得します。
 * @param year 取得する年 (例: 2024)
 * @returns 指定された年の市場カレンダーレコードの配列。エラー時はエラーをスローします。
 */
export async function getYearMarketCalendar(year: number) {
  try {
    // 年の妥当性チェック
    if (!year || year < 1900 || year > 2100) {
      // 妥当でない年が指定された場合はエラーを投げることで、呼び出し元に問題を明確に伝えます。
      throw new Error("無効な年が指定されました。");
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from("market_calendar")
      .select("*")
      .gte("date", startDate) // 指定年の1月1日以降
      .lte("date", endDate) // 指定年の12月31日以前
      .order("date", { ascending: true }); // 日付順にソート

    if (error) {
      console.error("Supabase select error:", error.message);
      throw new Error(
        `市場カレンダーのデータ取得中にエラーが発生しました: ${error.message}`
      );
    }

    return data;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    console.error("getYearMarketCalendarでエラーが発生しました:", message);
    // エラーをクライアントに伝えるために、エラーを再スローします。
    throw new Error(message);
  }
}

/**
 * 指定された日付以前で、最も近い市場が開いていた日を取得します。
 * @param dateString 基準日 ('YYYY-MM-DD')
 * @returns 市場が開いていた直近の日付 ('YYYY-MM-DD')。見つからない場合はエラーをスローします。
 */
export async function getMostRecentOpenMarketDate(dateString: string) {
  try {
    const { data, error } = await supabase
      .from("market_calendar")
      .select("date")
      .eq("is_open", true)
      .lte("date", dateString)
      .order("date", { ascending: false })
      .limit(1)
      .single(); // .single() は1件のレコードを期待し、0件または複数件の場合はエラーをスローします

    if (error) {
      console.error(
        "Supabase select error for recent open date:",
        error.message
      );
      throw new Error(
        `直近の市場営業日の取得中にエラーが発生しました: ${error.message}`
      );
    }

    return data.date;
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "直近の市場営業日の取得中に予期せぬエラーが発生しました。";
    console.error(
      "getMostRecentOpenMarketDateでエラーが発生しました:",
      message
    );
    throw new Error(message);
  }
}

/**
 * 指定された日付の市場カレンダーレコードのis_openを更新します。
 * @param date 更新する日付 (YYYY-MM-DD)
 * @param isOpen 新しいis_openの値
 * @returns 成功/失敗を示すオブジェクト
 */
export async function updateMarketRecord(date: string, isOpen: boolean) {
  try {
    const { error } = await supabase
      .from("market_calendar")
      .update({ is_open: isOpen })
      .eq("date", date);

    if (error) {
      console.error("Supabase update error:", error.message);
      throw new Error(
        `市場カレンダーの更新中にエラーが発生しました: ${error.message}`
      );
    }

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    console.error("updateMarketRecordでエラーが発生しました:", message);
    // エラーをクライアントに伝えるために、エラーを再スローします。
    throw new Error(message);
  }
}
