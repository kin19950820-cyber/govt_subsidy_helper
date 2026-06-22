"use client";

import { createClient } from "./supabase/client";
import { PrefillField } from "./prefill";

// 申請草稿存取層：Supabase（已登入）或本機 localStorage。
// 注意：唔會自動提交申請，只係幫用戶整理資料。

export interface DraftRecord {
  id: string;
  schemeId: string;
  schemeNameZh: string;
  status: string; // draft / reviewed
  createdAt: string;
  fields: PrefillField[];
}

const LOCAL_KEY = "hk_subsidy_drafts";

function loadLocalAll(): DraftRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DraftRecord[];
  } catch {
    return [];
  }
}

function saveLocalAll(list: DraftRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

export async function listDrafts(): Promise<DraftRecord[]> {
  const supabase = createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("application_drafts")
        .select("*, application_draft_fields(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        return data.map((d: any) => ({
          id: d.id,
          schemeId: d.scheme_id,
          schemeNameZh: d.scheme_name_zh,
          status: d.status,
          createdAt: d.created_at,
          fields: (d.application_draft_fields ?? []).map((f: any) => ({
            fieldKey: f.field_key,
            fieldLabel: f.field_label,
            fieldValue: f.field_value,
          })),
        }));
      }
    }
  }
  return loadLocalAll();
}

export async function getDraft(id: string): Promise<DraftRecord | undefined> {
  const all = await listDrafts();
  return all.find((d) => d.id === id);
}

export async function saveDraft(draft: DraftRecord): Promise<void> {
  const supabase = createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("application_drafts").upsert({
        id: draft.id,
        user_id: user.id,
        scheme_id: draft.schemeId,
        scheme_name_zh: draft.schemeNameZh,
        status: draft.status,
      });
      await supabase
        .from("application_draft_fields")
        .delete()
        .eq("draft_id", draft.id);
      if (draft.fields.length > 0) {
        await supabase.from("application_draft_fields").insert(
          draft.fields.map((f) => ({
            draft_id: draft.id,
            field_key: f.fieldKey,
            field_label: f.fieldLabel,
            field_value: f.fieldValue,
          }))
        );
      }
      return;
    }
  }
  const all = loadLocalAll();
  const idx = all.findIndex((d) => d.id === draft.id);
  if (idx >= 0) all[idx] = draft;
  else all.unshift(draft);
  saveLocalAll(all);
}

export async function deleteDraft(id: string): Promise<void> {
  const supabase = createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("application_drafts").delete().eq("id", id);
      return;
    }
  }
  saveLocalAll(loadLocalAll().filter((d) => d.id !== id));
}
