import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// 伺服器端 Supabase client（App Router / Server Components / Route Handlers）。
// 未設定時回傳 null，呼叫方需自行 fallback 到靜態資料。
export function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 喺 Server Component 內 set cookie 會 throw，可安全忽略，
          // 因為通常已經有 middleware 處理 session 更新。
        }
      },
    },
  });
}
