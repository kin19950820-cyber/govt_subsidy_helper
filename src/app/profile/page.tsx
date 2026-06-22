"use client";

import { useEffect, useState } from "react";
import {
  GRADE_LABELS,
  GradeLevel,
  INCOME_LABELS,
  IncomeBand,
} from "@/lib/types";
import {
  EMPTY_PROFILE,
  FullProfile,
  loadProfile,
  maskIdNumber,
  saveProfile,
} from "@/lib/profile-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import AuthPanel from "@/components/AuthPanel";

export default function ProfilePage() {
  const [data, setData] = useState<FullProfile>(EMPTY_PROFILE);
  const [backend, setBackend] = useState<"supabase" | "local">("local");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const res = await loadProfile();
    setData(res.data);
    setBackend(res.backend);
    setSignedIn(res.signedIn);
    setLoading(false);
  }

  function setProfileField<K extends keyof FullProfile["profile"]>(
    key: K,
    value: FullProfile["profile"][K]
  ) {
    setData((d) => ({ ...d, profile: { ...d.profile, [key]: value } }));
  }

  function addStudent() {
    setData((d) => ({
      ...d,
      students: [
        ...d.students,
        { id: crypto.randomUUID(), name: "", gradeLevel: "primary", schoolName: null },
      ],
    }));
  }

  function addMember() {
    setData((d) => ({
      ...d,
      members: [
        ...d.members,
        { id: crypto.randomUUID(), name: "", relationship: "" },
      ],
    }));
  }

  async function handleSave() {
    // 身份證只存部分
    const masked = data.profile.idNumberPartial
      ? maskIdNumber(data.profile.idNumberPartial)
      : null;
    const toSave = {
      ...data,
      profile: { ...data.profile, idNumberPartial: masked },
    };
    await saveProfile(toSave);
    setData(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return <p className="py-10 text-center text-lg text-stone-500">載入緊…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">我的資料</h1>
        <p className="mt-1 text-stone-600">
          填一次，之後幫你整理申請草稿。你可以唔填敏感資料。
        </p>
      </div>

      <div
        className={`rounded-xl p-3 text-sm ${
          backend === "supabase"
            ? "bg-green-50 text-green-800"
            : "bg-amber-50 text-amber-900"
        }`}
      >
        {backend === "supabase"
          ? "✅ 已登入，你嘅資料安全儲存喺雲端，只有你自己睇到。"
          : "ℹ️ 資料只會暫存喺呢部裝置。" +
            (isSupabaseConfigured ? "登入後可安全雲端儲存。" : "")}
      </div>

      {isSupabaseConfigured && !signedIn && (
        <AuthPanel onSignedIn={refresh} />
      )}

      <section className="card space-y-4">
        <h2 className="text-lg font-bold">基本資料</h2>
        <Field label="申請人姓名">
          <input
            className="input"
            value={data.profile.applicantName ?? ""}
            onChange={(e) => setProfileField("applicantName", e.target.value)}
          />
        </Field>
        <Field label="身份證號碼（只需後 4 位，系統會自動遮蔽）">
          <input
            className="input"
            placeholder="例如 1234"
            value={data.profile.idNumberPartial ?? ""}
            onChange={(e) => setProfileField("idNumberPartial", e.target.value)}
          />
        </Field>
        <Field label="電話">
          <input
            className="input"
            inputMode="tel"
            value={data.profile.phone ?? ""}
            onChange={(e) => setProfileField("phone", e.target.value)}
          />
        </Field>
        <Field label="地址">
          <input
            className="input"
            value={data.profile.address ?? ""}
            onChange={(e) => setProfileField("address", e.target.value)}
          />
        </Field>
        <Field label="學校名稱">
          <input
            className="input"
            value={data.profile.schoolName ?? ""}
            onChange={(e) => setProfileField("schoolName", e.target.value)}
          />
        </Field>
        <Field label="家庭每月收入範圍（選填）">
          <select
            className="input"
            value={data.profile.incomeBand ?? ""}
            onChange={(e) =>
              setProfileField("incomeBand", (e.target.value || null) as IncomeBand | null)
            }
          >
            <option value="">唔想填</option>
            {(Object.keys(INCOME_LABELS) as IncomeBand[]).map((b) => (
              <option key={b} value={b}>
                {INCOME_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="銀行戶口資料（選填）">
          <input
            className="input"
            placeholder="銀行名 + 戶口號碼"
            value={data.profile.bankAccount ?? ""}
            onChange={(e) => setProfileField("bankAccount", e.target.value)}
          />
        </Field>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">學生資料</h2>
          <button className="btn-ghost px-4 py-2 text-base" onClick={addStudent}>
            ＋ 加學生
          </button>
        </div>
        {data.students.length === 0 && (
          <p className="text-stone-500">未有學生，撳「加學生」開始。</p>
        )}
        {data.students.map((s, i) => (
          <div key={s.id} className="space-y-3 rounded-xl border-2 border-stone-200 p-3">
            <input
              className="input"
              placeholder="學生姓名"
              value={s.name}
              onChange={(e) =>
                setData((d) => {
                  const students = [...d.students];
                  students[i] = { ...students[i], name: e.target.value };
                  return { ...d, students };
                })
              }
            />
            <select
              className="input"
              value={s.gradeLevel}
              onChange={(e) =>
                setData((d) => {
                  const students = [...d.students];
                  students[i] = {
                    ...students[i],
                    gradeLevel: e.target.value as GradeLevel,
                  };
                  return { ...d, students };
                })
              }
            >
              {(Object.keys(GRADE_LABELS) as GradeLevel[]).map((g) => (
                <option key={g} value={g}>
                  {GRADE_LABELS[g]}
                </option>
              ))}
            </select>
            <button
              className="text-sm text-rose-600"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  students: d.students.filter((x) => x.id !== s.id),
                }))
              }
            >
              刪除呢個學生
            </button>
          </div>
        ))}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">家庭成員</h2>
          <button className="btn-ghost px-4 py-2 text-base" onClick={addMember}>
            ＋ 加成員
          </button>
        </div>
        {data.members.map((m, i) => (
          <div key={m.id} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="姓名"
              value={m.name}
              onChange={(e) =>
                setData((d) => {
                  const members = [...d.members];
                  members[i] = { ...members[i], name: e.target.value };
                  return { ...d, members };
                })
              }
            />
            <input
              className="input w-28"
              placeholder="關係"
              value={m.relationship}
              onChange={(e) =>
                setData((d) => {
                  const members = [...d.members];
                  members[i] = { ...members[i], relationship: e.target.value };
                  return { ...d, members };
                })
              }
            />
            <button
              className="px-2 text-rose-600"
              aria-label="刪除"
              onClick={() =>
                setData((d) => ({
                  ...d,
                  members: d.members.filter((x) => x.id !== m.id),
                }))
              }
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <div className="sticky bottom-4">
        <button className="btn-primary w-full shadow-lg" onClick={handleSave}>
          {saved ? "✅ 已儲存" : "儲存我的資料"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label mb-1">{label}</label>
      {children}
    </div>
  );
}
