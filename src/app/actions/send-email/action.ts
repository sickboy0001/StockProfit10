// c:\work\dev\spa\stockprofit10-app\src\app\actions\send-email\action.ts
"use server"; // これが重要: Server Actionであることを示す

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Actionの戻り値の型を定義しておくと、クライアント側でのハンドリングがしやすくなります
type ActionState = {
  error?: string;
  success?: string;
};

export async function sendEmailActionFormData(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const to = formData.get("to");
  const subject = formData.get("subject");
  const message = formData.get("message");

  // formData.get() の戻り値は string | File | null なので、string であることを確認します
  if (
    typeof to !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string"
  ) {
    return { error: "Invalid input types. All fields must be strings." };
  }
  // 必須フィールドのチェック
  if (!to || !subject || !message) {
    return { error: "Missing required fields: to, subject, message" };
  }

  try {
    // 送信元アドレスはResendで認証済みのドメインを使う必要があります。
    // ハードコードせず、環境変数で管理することをお勧めします。
    const fromAddress =
      process.env.RESEND_FROM_ADDRESS || "Your App <onboarding@resend.dev>";
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: `<p>${message}</p>`,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { error: error.message };
    }

    console.log("Email sent successfully:", data);
    return { success: "Email sent successfully!" };
  } catch (err) {
    console.error("Unexpected error:", err);
    // catchしたエラーがErrorインスタンスか確認し、より詳細なメッセージを返します
    if (err instanceof Error) {
      return { error: `Internal Server Error: ${err.message}` };
    }
    return { error: "An unexpected internal server error occurred." };
  }
}

// 直接値を受け取るバージョン
export async function sendEmailActionDirect(
  to: string,
  subject: string,
  message: string
): Promise<ActionState> {
  if (!to || !subject || !message) {
    return { error: "Missing required fields: to, subject, message" };
  }

  try {
    const fromAddress =
      process.env.RESEND_FROM_ADDRESS ||
      "Spt-DailyReport <onboarding@resend.dev>";
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: `<p>${message}</p>`,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { error: error.message };
    }

    console.log("Email sent successfully:", data);
    return { success: "Email sent successfully!" };
  } catch (err) {
    console.error("Unexpected error:", err);
    if (err instanceof Error) {
      return { error: `Internal Server Error: ${err.message}` };
    }
    return { error: "An unexpected internal server error occurred." };
  }
}
