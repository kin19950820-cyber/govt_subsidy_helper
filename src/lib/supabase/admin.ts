import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, isSupabaseConfigured } from "./config";

// 服務角色 client：只限伺服器使用，會繞過 RLS。
// 用於 admin CRUD / seed。切勿喺前端 import。
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !serviceKey) return null;
  return createSupabaseClient(SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });
}
