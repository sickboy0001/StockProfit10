
// src/app/api/send-email/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// 環境変数から Resend API キーを取得
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    // リクエストボディからメール送信に必要な情報を取得
    const { to, subject, message } = await request.json();

    // 簡単なバリデーション
    if (!to || !subject || !message) {
      return NextResponse.json(
        { message: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Resend API を呼び出してメールを送信
    const { data, error } = await resend.emails.send({
      from: 'Your App <onboarding@your-domain.com>', // Resendで認証したドメインのメールアドレス
      to: [to], // 送信先メールアドレス (配列で複数指定可能)
      subject: subject, // 件名
      html: `<p>${message}</p>`, // HTML形式の本文
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return NextResponse.json(
      { message: 'Email sent successfully!', data: data },
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}