"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AUDIENCE_LABELS,
  AUDIENCE_ORDER,
  AudienceGroup,
  SubsidyScheme,
} from "@/lib/types";
import SchemeCard from "./SchemeCard";

type Filter = AudienceGroup | "all";

// 受惠群組下拉選單 + 津貼列表。?group= 由 client 端讀取（保持列表頁可 SSG）。
export default function SchemesBrowser({
  schemes,
}: {
  schemes: SubsidyScheme[];
}) {
  const params = useSearchParams();
  const g = params.get("group");
  const initialGroup: Filter =
    g && (AUDIENCE_ORDER as string[]).includes(g) ? (g as AudienceGroup) : "all";
  const [group, setGroup] = useState<Filter>(initialGroup);

  const filtered = useMemo(
    () =>
      group === "all"
        ? schemes
        : schemes.filter((s) => s.audience.includes(group)),
    [schemes, group]
  );

  return (
    <div className="space-y-4">
      <div className="card">
        <label htmlFor="group-select" className="label mb-2">
          揀受惠群組
        </label>
        <select
          id="group-select"
          className="input"
          value={group}
          onChange={(e) => setGroup(e.target.value as Filter)}
        >
          <option value="all">全部津貼</option>
          {AUDIENCE_ORDER.map((g) => (
            <option key={g} value={g}>
              {AUDIENCE_LABELS[g]}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-stone-500">
          搵到 {filtered.length} 項津貼
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-stone-100 p-4 text-center text-stone-600">
          呢個群組暫時未有津貼資料。
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <SchemeCard key={s.id} scheme={s} />
          ))}
        </div>
      )}
    </div>
  );
}
