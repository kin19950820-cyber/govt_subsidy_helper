"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MATCH_COLORS,
  MATCH_LABELS,
  MatchLevel,
  MatchResult,
  SubsidyScheme,
} from "@/lib/types";
import { loadAnswers } from "@/lib/finder-storage";
import { matchSchemes } from "@/lib/matching";
import Disclaimer from "@/components/Disclaimer";

const SELECTED_KEY = "hk_subsidy_selected_schemes";
const LEVEL_ORDER: MatchLevel[] = ["very_likely", "likely", "consult", "unlikely"];

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const answers = loadAnswers();
    if (!answers) {
      router.replace("/finder");
      return;
    }
    fetch("/api/schemes")
      .then((r) => r.json())
      .then((data: { schemes: SubsidyScheme[] }) => {
        setResults(matchSchemes(answers, data.schemes));
      })
      .catch(() => setResults([]));
  }, [router]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function goChecklist() {
    sessionStorage.setItem(SELECTED_KEY, JSON.stringify(selected));
    router.push("/checklist");
  }

  if (!results) {
    return <p className="py-10 text-center text-lg text-stone-500">幫緊你計算…</p>;
  }

  const grouped = LEVEL_ORDER.map((level) => ({
    level,
    items: results.filter((r) => r.level === level),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">幫你搵到嘅津貼</h1>
        <p className="mt-1 text-stone-600">
          揀返你想申請嘅，再整一張文件清單。呢個只係參考，唔代表一定批。
        </p>
      </div>

      {grouped.map((group) => (
        <section key={group.level} className="space-y-3">
          <h2 className="text-xl font-bold">
            <span
              className={`chip border ${MATCH_COLORS[group.level]}`}
            >
              {MATCH_LABELS[group.level]}
            </span>
          </h2>
          {group.items.map(({ scheme, reasons }) => (
            <div key={scheme.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{scheme.nameZh}</h3>
                  <p className="text-sm text-stone-500">{scheme.nameEn}</p>
                </div>
                <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-7 w-7 accent-brand"
                    checked={selected.includes(scheme.id)}
                    onChange={() => toggle(scheme.id)}
                  />
                  <span className="text-xs text-stone-500">揀</span>
                </label>
              </div>
              <p className="mt-2 text-stone-700">{scheme.summary}</p>
              {reasons.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-stone-600">
                  {reasons.slice(0, 3).map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
              <Link
                href={`/schemes/${scheme.id}`}
                className="mt-3 inline-block text-sm font-semibold text-brand"
              >
                睇詳情同申請步驟 →
              </Link>
            </div>
          ))}
        </section>
      ))}

      <div className="sticky bottom-4 z-10">
        <button
          className="btn-primary w-full shadow-lg disabled:opacity-50"
          disabled={selected.length === 0}
          onClick={goChecklist}
        >
          {selected.length > 0
            ? `用揀咗嘅 ${selected.length} 個津貼整文件清單 →`
            : "請先揀一個或多個津貼"}
        </button>
      </div>

      <div className="flex gap-3">
        <Link href="/finder" className="btn-ghost flex-1">
          ← 重新答問題
        </Link>
        <Link href="/schemes" className="btn-secondary flex-1">
          睇晒所有津貼
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}
