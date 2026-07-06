"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AUDIENCE_LABELS,
  AUDIENCE_ORDER,
  AudienceGroup,
  DOCUMENT_LABELS,
  DocumentKey,
  SubsidyScheme,
} from "@/lib/types";

const EMPTY: SubsidyScheme = {
  id: "",
  slug: "",
  nameZh: "",
  nameEn: "",
  category: "",
  audience: [],
  summary: "",
  suitableFor: "",
  notSuitableFor: "",
  eligibility: [],
  documents: [],
  steps: [],
  officialUrl: "",
  formUrl: "",
  department: "",
  phone: "",
  lastVerified: new Date().toISOString().slice(0, 10),
  disclaimer:
    "本系統只幫你整理資料及估計，不代表政府已批准申請。最終批核以政府部門公佈為準。",
  rule: {},
  active: true,
};

export default function AdminSchemeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [s, setS] = useState<SubsidyScheme>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [msg, setMsg] = useState<string | null>(null);
  const [ruleText, setRuleText] = useState("{}");

  useEffect(() => {
    if (isNew) return;
    fetch("/api/admin/schemes")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.schemes as SubsidyScheme[]).find(
          (x) => x.id === params.id
        );
        if (found) {
          setS(found);
          setRuleText(JSON.stringify(found.rule, null, 2));
        }
      })
      .finally(() => setLoading(false));
  }, [isNew, params.id]);

  function set<K extends keyof SubsidyScheme>(key: K, value: SubsidyScheme[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDoc(d: DocumentKey) {
    setS((prev) => ({
      ...prev,
      documents: prev.documents.includes(d)
        ? prev.documents.filter((x) => x !== d)
        : [...prev.documents, d],
    }));
  }

  async function save() {
    setMsg(null);
    let rule = s.rule;
    try {
      rule = JSON.parse(ruleText);
    } catch {
      setMsg("配對規則 JSON 格式錯誤");
      return;
    }
    const payload = { ...s, rule };
    const res = await fetch(
      isNew ? "/api/admin/schemes" : `/api/admin/schemes/${s.id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (data.error) {
      setMsg(`儲存失敗：${data.error}`);
    } else {
      setMsg("已儲存");
      router.push("/admin/schemes");
    }
  }

  async function remove() {
    if (!confirm("確定刪除呢個津貼？")) return;
    const res = await fetch(`/api/admin/schemes/${s.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) setMsg(`刪除失敗：${data.error}`);
    else router.push("/admin/schemes");
  }

  if (loading) return <p className="py-10 text-center text-stone-500">載入緊…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "新增津貼" : "編輯津貼"}</h1>
        <Link href="/admin/schemes" className="text-brand">
          ← 返回
        </Link>
      </div>

      {msg && (
        <p className="rounded-xl bg-stone-100 p-3 text-stone-800">{msg}</p>
      )}

      <Text label="Slug（網址用，英文）" value={s.slug} onChange={(v) => set("slug", v)} />
      <Text label="中文名稱" value={s.nameZh} onChange={(v) => set("nameZh", v)} />
      <Text label="英文名稱" value={s.nameEn} onChange={(v) => set("nameEn", v)} />
      <Text label="分類" value={s.category} onChange={(v) => set("category", v)} />

      <div>
        <p className="label">受惠群組（可多選）</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {AUDIENCE_ORDER.map((g) => (
            <label key={g} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand"
                checked={s.audience.includes(g)}
                onChange={() =>
                  set(
                    "audience",
                    s.audience.includes(g)
                      ? s.audience.filter((x) => x !== g)
                      : [...s.audience, g]
                  )
                }
              />
              {AUDIENCE_LABELS[g]}
            </label>
          ))}
        </div>
      </div>
      <Area label="簡單說明" value={s.summary} onChange={(v) => set("summary", v)} />
      <Area label="適合邊類家庭" value={s.suitableFor} onChange={(v) => set("suitableFor", v)} />
      <Area
        label="不適合邊類家庭"
        value={s.notSuitableFor}
        onChange={(v) => set("notSuitableFor", v)}
      />
      <Area
        label="申請資格（每行一項）"
        value={s.eligibility.join("\n")}
        onChange={(v) => set("eligibility", splitLines(v))}
      />

      <div>
        <p className="label">需要文件</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(DOCUMENT_LABELS) as DocumentKey[]).map((d) => (
            <label key={d} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand"
                checked={s.documents.includes(d)}
                onChange={() => toggleDoc(d)}
              />
              {DOCUMENT_LABELS[d]}
            </label>
          ))}
        </div>
      </div>

      <Area
        label="申請步驟（每行一步，會自動編號）"
        value={s.steps.map((st) => st.text).join("\n")}
        onChange={(v) =>
          set(
            "steps",
            splitLines(v).map((text, i) => ({ order: i + 1, text }))
          )
        }
      />

      <Text label="官方連結" value={s.officialUrl} onChange={(v) => set("officialUrl", v)} />
      <Text label="表格連結" value={s.formUrl} onChange={(v) => set("formUrl", v)} />
      <Text label="負責部門" value={s.department} onChange={(v) => set("department", v)} />
      <Text label="查詢電話" value={s.phone} onChange={(v) => set("phone", v)} />
      <Text
        label="最後更新日期 (YYYY-MM-DD)"
        value={s.lastVerified}
        onChange={(v) => set("lastVerified", v)}
      />
      <Area label="免責聲明" value={s.disclaimer} onChange={(v) => set("disclaimer", v)} />

      <div>
        <p className="label">配對規則（JSON，進階）</p>
        <textarea
          className="input font-mono text-sm"
          rows={8}
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 rounded-xl border-2 border-stone-200 p-3">
        <input
          type="checkbox"
          className="h-6 w-6 accent-brand"
          checked={s.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        <span className="font-medium">啟用（公開顯示）</span>
      </label>

      <div className="flex gap-3">
        <button className="btn-primary flex-1" onClick={save}>
          儲存
        </button>
        {!isNew && (
          <button className="btn-ghost text-rose-600" onClick={remove}>
            刪除
          </button>
        )}
      </div>
    </div>
  );
}

function splitLines(v: string): string[] {
  return v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label mb-1">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label mb-1">{label}</label>
      <textarea
        className="input"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
