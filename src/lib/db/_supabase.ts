// src/lib/db/supabase.ts (サーバーサイド用)
// サーバーコンポーネントやサーバーアクションで使う
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // (cookieStore as any).set({ name, value, ...options });
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn("Could not set cookie from server client:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // (cookieStore as any).set({ name, value: "", ...options });
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.warn("Could not remove cookie from server client:", error);
          }
        },
      },
    }
  );
};
