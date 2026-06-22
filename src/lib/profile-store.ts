"use client";

import { createClient } from "./supabase/client";
import { HouseholdMember, Profile, Student } from "./types";

// 統一 Profile 存取層：
// - 有設定 Supabase 而且已登入 → 存喺資料庫（受 RLS 保護，只有本人睇到）
// - 否則 → 暫存喺本機裝置（localStorage），並提示用戶資料只喺呢部機。

export interface FullProfile {
  profile: Profile;
  students: Student[];
  members: HouseholdMember[];
}

const LOCAL_KEY = "hk_subsidy_profile";

export const EMPTY_PROFILE: FullProfile = {
  profile: {
    id: "local",
    applicantName: null,
    idNumberPartial: null,
    phone: null,
    address: null,
    schoolName: null,
    bankAccount: null,
    incomeBand: null,
  },
  students: [],
  members: [],
};

function loadLocal(): FullProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return EMPTY_PROFILE;
  try {
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROFILE;
  }
}

function saveLocal(data: FullProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// 只儲存身份證後 4 位 / 部分，預設唔存全部
export function maskIdNumber(input: string): string {
  const cleaned = input.replace(/\s/g, "");
  if (cleaned.length <= 4) return cleaned;
  return `****${cleaned.slice(-4)}`;
}

export async function loadProfile(): Promise<{
  data: FullProfile;
  backend: "supabase" | "local";
  signedIn: boolean;
}> {
  const supabase = createClient();
  if (!supabase) {
    return { data: loadLocal(), backend: "local", signedIn: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: loadLocal(), backend: "local", signedIn: false };
  }

  const [{ data: prof }, { data: students }, { data: members }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("students").select("*").eq("user_id", user.id),
      supabase.from("household_members").select("*").eq("user_id", user.id),
    ]);

  const data: FullProfile = {
    profile: {
      id: user.id,
      applicantName: prof?.applicant_name ?? null,
      idNumberPartial: prof?.id_number_partial ?? null,
      phone: prof?.phone ?? null,
      address: prof?.address ?? null,
      schoolName: prof?.school_name ?? null,
      bankAccount: prof?.bank_account ?? null,
      incomeBand: prof?.income_band ?? null,
    },
    students: (students ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      gradeLevel: s.grade_level,
      schoolName: s.school_name ?? null,
    })),
    members: (members ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      relationship: m.relationship,
    })),
  };
  return { data, backend: "supabase", signedIn: true };
}

export async function saveProfile(data: FullProfile): Promise<void> {
  const supabase = createClient();
  if (!supabase) {
    saveLocal(data);
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    saveLocal(data);
    return;
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    applicant_name: data.profile.applicantName,
    id_number_partial: data.profile.idNumberPartial,
    phone: data.profile.phone,
    address: data.profile.address,
    school_name: data.profile.schoolName,
    bank_account: data.profile.bankAccount,
    income_band: data.profile.incomeBand,
  });

  // 簡單做法：刪晒再插入（students / members）
  await supabase.from("students").delete().eq("user_id", user.id);
  if (data.students.length > 0) {
    await supabase.from("students").insert(
      data.students.map((s) => ({
        user_id: user.id,
        name: s.name,
        grade_level: s.gradeLevel,
        school_name: s.schoolName,
      }))
    );
  }

  await supabase.from("household_members").delete().eq("user_id", user.id);
  if (data.members.length > 0) {
    await supabase.from("household_members").insert(
      data.members.map((m) => ({
        user_id: user.id,
        name: m.name,
        relationship: m.relationship,
      }))
    );
  }
}
