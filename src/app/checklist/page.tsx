"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DOCUMENT_LABELS,
  DocumentKey,
  SubsidyScheme,
} from "@/lib/types";
import Disclaimer from "@/components/Disclaimer";

const SELECTED_KEY = "hk_subsidy_selected_schemes";

export default function ChecklistPage() {
  const [schemes, setSchemes] = useState<SubsidyScheme[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SELECTED_KEY);
      if (raw) setSelected(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    fetch("/api/schemes")
      .then((r) => r.json())
      .then((data: { schemes: SubsidyScheme[] }) => setSchemes(data.schemes))
      .catch(() => setSchemes([]));
  }, []);

  function toggleScheme(id: string) {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      sessionStorage.setItem(SELECTED_KEY, JSON.stringify(next));
      return next;
    });
  }

  const activeSchemes = useMemo(
    () => (schemes ?? []).filter((s) => selected.includes(s.id)),
    [schemes, selected]
  );

  // 文件 -> 需要呢份文件嘅津貼
  const docMap = useMemo(() => {
    const map = new Map<DocumentKey, string[]>();
    for (const s of activeSchemes) {
      for (const d of s.documents) {
        const list = map.get(d) ?? [];
        list.push(s.nameZh);
        map.set(d, list);
      }
    }
    return map;
  }, [activeSchemes]);

  if (!schemes) {
    return <p className="py-10 text-center text-lg text-stone-500">載入緊…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">你嘅文件清單</h1>
        <p className="mt-1 text-stone-600">
          揀返你想申請嘅津貼，我哋會幫你合併成一張清單，唔使重複準備。
        </p>
      </div>

      <section className="card">
        <h2 className="text-lg font-bold">1. 揀津貼</h2>
        <div className="mt-3 space-y-2">
          {schemes.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-stone-200 p-3"
            >
              <input
                type="checkbox"
                className="h-6 w-6 accent-brand"
                checked={selected.includes(s.id)}
                onChange={() => toggleScheme(s.id)}
              />
              <span className="font-medium">{s.nameZh}</span>
            </label>
          ))}
        </div>
      </section>

      {activeSchemes.length === 0 ? (
        <p className="rounded-xl bg-stone-100 p-4 text-center text-stone-600">
          請喺上面揀一個或多個津貼。
        </p>
      ) : (
        <section className="card">
          <h2 className="text-lg font-bold">2. 準備呢啲文件</h2>
          <ul className="mt-3 space-y-3">
            {Array.from(docMap.entries()).map(([doc, usedBy]) => (
              <li
                key={doc}
                className="flex items-start gap-3 rounded-xl border border-stone-200 p-3"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-6 w-6 accent-brand"
                  checked={!!checked[doc]}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [doc]: e.target.checked }))
                  }
                />
                <div>
                  <p className="text-lg font-semibold">{DOCUMENT_LABELS[doc]}</p>
                  <p className="text-sm text-stone-500">
                    用喺：{usedBy.join("、")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="btn-secondary mt-4 w-full"
            onClick={() => window.print()}
          >
            🖨️ 列印 / 儲存呢張清單
          </button>
        </section>
      )}

      <div className="flex gap-3">
        <Link href="/finder" className="btn-ghost flex-1">
          重新搵津貼
        </Link>
        <Link href="/drafts" className="btn-secondary flex-1">
          整理申請資料 →
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}
