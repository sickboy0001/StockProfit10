"use client"; // クライアントコンポーネント

import { sendEmailAction } from "@/app/actions/send-email/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";

// Server Actionから型をインポートするのが理想ですが、ここで定義しても動作します
type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {
  error: undefined,
  success: undefined,
};

// 送信ボタンを分離し、フォームの送信状態をuseFormStatusで管理
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          送信中...
        </>
      ) : (
        "Send Email"
      )}
    </Button>
  );
}

export default function PageContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(sendEmailAction, initialState);

  useEffect(() => {
    if (state.success) {
      alert(state.success); // またはトースト通知ライブラリを使用
      formRef.current?.reset(); // 成功時にフォームをリセット
    }
  }, [state]);

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground">
          We&apos;d love to hear from you. Please fill out the form below.
        </p>
      </div>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            type="email"
            id="to"
            name="to"
            placeholder="recipient@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            type="text"
            id="subject"
            name="subject"
            placeholder="Your subject"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Your message"
            required
            className="min-h-[120px]"
          />
        </div>
        <SubmitButton />
        {state.error && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}
      </form>
    </div>
  );
}
