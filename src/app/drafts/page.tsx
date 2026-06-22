"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DraftRecord, deleteDraft, listDrafts } from "@/lib/drafts-store";
import { SubsidyScheme } from "@/lib/types";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftRecord[] | null>(null);
  const [schemes, setSchemes] = useState<SubsidyScheme[]>([]);

  useEffect(() => {
    listDrafts().then(setDrafts);
    fetch("/api/schemes")
      .then((r) => r.json())
      .then((d) => setSchemes(d.schemes))
      .catch(() => setSchemes([]));
  }, []);

  async function remove(id: string) {
    await deleteDraft(id);
    setDrafts((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">申請草稿</h1>
        <p className="mt-1 text-stone-600">
          幫你整理咗嘅申請資料。檢查清楚先自己去交。
        </p>
      </div>

      <section className="card">
        <h2 className="text-lg font-bold">開始新草稿</h2>
        <p className="mt-1 text-sm text-stone-500">揀一個津貼，幫你填好資料。</p>
        <div className="mt-3 space-y-2">
          {schemes.map((s) => (
            <Link
              key={s.id}
              href={`/drafts/${s.id}`}
              className="flex items-center justify-between rounded-xl border-2 border-stone-200 p-3 hover:border-brand"
            >
              <span className="font-medium">{s.nameZh}</span>
              <span className="text-brand">整草稿 →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">已儲存草稿</h2>
        {drafts === null ? (
          <p className="text-stone-500">載入緊…</p>
        ) : drafts.length === 0 ? (
          <p className="rounded-xl bg-stone-100 p-4 text-stone-600">
            未有草稿。喺上面揀一個津貼開始。
          </p>
        ) : (
          drafts.map((d) => (
            <div key={d.id} className="card flex items-center justify-between">
              <div>
                <p className="font-bold">{d.schemeNameZh}</p>
                <p className="text-sm text-stone-500">
                  狀態：{d.status === "reviewed" ? "已檢查" : "草稿"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/drafts/${d.id}`} className="btn-ghost px-4 py-2 text-base">
                  開啟
                </Link>
                <button
                  className="px-3 text-rose-600"
                  onClick={() => remove(d.id)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
