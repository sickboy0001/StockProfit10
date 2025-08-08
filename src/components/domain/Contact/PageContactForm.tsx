"use client"; // クライアントコンポーネント

import { sendEmailActionDirect } from "@/app/actions/send-email/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";

export default function PageContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setSuccess(undefined);
    const result = await sendEmailActionDirect(to, subject, message);
    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(result.success);
      setTo("");
      setSubject("");
      setMessage("");
      formRef.current?.reset();
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground">
          We&apos;d love to hear from you. Please fill out the form below.
        </p>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            type="email"
            id="to"
            name="to"
            placeholder="recipient@example.com"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={loading}
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
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              送信中...
            </>
          ) : (
            "Send Email"
          )}
        </Button>
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
        {success && (
          <p className="text-sm font-medium text-green-600">{success}</p>
        )}
      </form>
    </div>
  );
}
