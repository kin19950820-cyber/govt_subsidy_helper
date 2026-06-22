"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SubsidyScheme } from "@/lib/types";

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<SubsidyScheme[]>([]);
  const [demo, setDemo] = useState(false);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/schemes")
      .then((r) => r.json())
      .then((d) => {
        setSchemes(d.schemes ?? []);
        setDemo(!!d.demo);
        setOk(!!d.ok);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">管理津貼</h1>
        <Link href="/admin/schemes/new" className="btn-primary px-5 py-3 text-base">
          ＋ 新增
        </Link>
      </div>

      {demo && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ 示範模式：未設定 Supabase 或未以管理員登入，改動唔會儲存。
        </div>
      )}
      {!demo && !ok && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">
          你未有管理員權限。請以 admin_users 內嘅帳戶登入。
        </div>
      )}

      {loading ? (
        <p className="text-stone-500">載入緊…</p>
      ) : (
        <div className="space-y-3">
          {schemes.map((s) => (
            <Link
              key={s.id}
              href={`/admin/schemes/${s.id}`}
              className="card flex items-center justify-between hover:border-brand"
            >
              <div>
                <p className="font-bold">{s.nameZh}</p>
                <p className="text-sm text-stone-500">{s.nameEn}</p>
              </div>
              <span
                className={`chip border ${
                  s.active
                    ? "border-green-300 bg-green-100 text-green-800"
                    : "border-stone-300 bg-stone-100 text-stone-600"
                }`}
              >
                {s.active ? "啟用中" : "已停用"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
