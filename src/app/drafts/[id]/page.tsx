"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SubsidyScheme } from "@/lib/types";
import { buildPrefillFields, PrefillField } from "@/lib/prefill";
import { loadProfile } from "@/lib/profile-store";
import { DraftRecord, getDraft, saveDraft } from "@/lib/drafts-store";

const WARNING =
  "請檢查所有資料正確，才簽名及提交。系統只幫你整理資料，不代表政府已批准申請。";

export default function DraftDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [scheme, setScheme] = useState<SubsidyScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function init() {
    setLoading(true);
    const res = await fetch("/api/schemes").then((r) => r.json());
    const schemes: SubsidyScheme[] = res.schemes;

    // 1. 試當 id 係已存在草稿
    const existing = await getDraft(id);
    if (existing) {
      setDraft(existing);
      setScheme(schemes.find((s) => s.id === existing.schemeId) ?? null);
      setLoading(false);
      return;
    }

    // 2. 當 id 係 scheme id → 建立新草稿
    const s = schemes.find((x) => x.id === id || x.slug === id);
    if (s) {
      const { data } = await loadProfile();
      const fields = buildPrefillFields(s, data);
      setScheme(s);
      setDraft({
        id: crypto.randomUUID(),
        schemeId: s.id,
        schemeNameZh: s.nameZh,
        status: "draft",
        createdAt: new Date().toISOString(),
        fields,
      });
    }
    setLoading(false);
  }

  function updateField(i: number, value: string) {
    setDraft((d) => {
      if (!d) return d;
      const fields = [...d.fields];
      fields[i] = { ...fields[i], fieldValue: value };
      return { ...d, fields };
    });
  }

  async function persist(status?: string) {
    if (!draft) return;
    const toSave = { ...draft, status: status ?? draft.status };
    await saveDraft(toSave);
    setDraft(toSave);
    setSavedMsg(status === "reviewed" ? "已標記為已檢查並儲存" : "已儲存草稿");
    setTimeout(() => setSavedMsg(null), 2500);
  }

  function exportJson() {
    if (!draft) return;
    const payload = {
      scheme: { id: draft.schemeId, name: draft.schemeNameZh },
      generatedAt: new Date().toISOString(),
      note: WARNING,
      fields: draft.fields.reduce<Record<string, string>>((acc, f) => {
        acc[f.fieldKey] = f.fieldValue;
        return acc;
      }, {}),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-${draft.schemeId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="py-10 text-center text-lg text-stone-500">載入緊…</p>;
  }

  if (!draft) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
          搵唔到呢個草稿或津貼。
        </p>
        <Link href="/drafts" className="btn-secondary">
          ← 返回草稿
        </Link>
      </div>
    );
  }

  const filledCount = draft.fields.filter((f) => f.fieldValue.trim()).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">申請草稿</p>
        <h1 className="text-2xl font-bold">{draft.schemeNameZh}</h1>
      </div>

      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-900">
        <p className="font-bold">⚠️ 請注意</p>
        <p className="mt-1">{WARNING}</p>
      </div>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">檢查並修改資料</h2>
          <span className="text-sm text-stone-500">
            已填 {filledCount}/{draft.fields.length}
          </span>
        </div>
        <p className="text-sm text-stone-500">
          以下資料係由你「我的資料」自動帶入。請逐項檢查，唔啱可以直接改。
        </p>
        {draft.fields.map((f, i) => (
          <div key={f.fieldKey}>
            <label className="label mb-1">{f.fieldLabel}</label>
            <input
              className="input"
              value={f.fieldValue}
              placeholder="（未有資料，可手動填）"
              onChange={(e) => updateField(i, e.target.value)}
            />
          </div>
        ))}
      </section>

      {savedMsg && (
        <p className="rounded-xl bg-green-50 p-3 text-center text-green-800">
          ✅ {savedMsg}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-secondary" onClick={() => persist()}>
          💾 儲存草稿
        </button>
        <button className="btn-secondary" onClick={() => persist("reviewed")}>
          ✅ 我已檢查
        </button>
        <button className="btn-primary" onClick={exportJson}>
          ⬇️ 匯出 JSON
        </button>
        <button
          className="btn-ghost"
          disabled
          title="日後會支援匯出 PDF"
        >
          📄 匯出 PDF（即將推出）
        </button>
      </div>

      {scheme && (
        <div className="card bg-stone-100">
          <p className="font-semibold">準備好之後：</p>
          <p className="mt-1 text-stone-700">
            自己檢查清楚，再去官方途徑簽名及提交。系統唔會代你提交。
          </p>
          <a
            href={scheme.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-3 w-full"
          >
            🔗 開啟官方申請表
          </a>
        </div>
      )}

      <Link href="/drafts" className="block text-center text-brand">
        ← 返回所有草稿
      </Link>
    </div>
  );
}
