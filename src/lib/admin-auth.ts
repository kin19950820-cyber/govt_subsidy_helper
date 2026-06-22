import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";

export interface AdminCheck {
  ok: boolean;
  // demo: 未設定 Supabase 時，admin 介面以唯讀示範模式運作
  demo: boolean;
  reason?: string;
}

// 確認目前登入用戶係 admin（喺 admin_users 表內）。
export async function requireAdmin(): Promise<AdminCheck> {
  if (!isSupabaseConfigured) {
    return { ok: false, demo: true, reason: "未設定 Supabase，admin 以示範模式運作。" };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, demo: false, reason: "請先登入。" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, demo: false, reason: "缺少 service role key。" };

  const { data } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return { ok: false, demo: false, reason: "你唔係管理員。" };
  }
  return { ok: true, demo: false };
}
