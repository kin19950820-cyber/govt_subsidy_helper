"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getActiveBenefits } from "@/lib/benefits/registry";
import { evaluateBenefit } from "@/lib/eligibility/engine";
import { EligibilityOutcome, OUTCOME_LABELS_ZH } from "@/lib/eligibility/outcome";
import { ApplicantFacts, SENSITIVE_FACTS } from "@/lib/eligibility/facts";
import { nextQuestion, selectQuestions } from "@/lib/questionnaire/select";
import { Question } from "@/lib/questionnaire/questions";
import {
  FinderState,
  EMPTY_STATE,
  loadState,
  saveState,
  clearState,
} from "@/lib/questionnaire/storage";
import { loadAnswers } from "@/lib/finder-storage";
import { factsFromFinder } from "@/lib/eligibility/factsFromFinder";
import Disclaimer from "@/components/Disclaimer";
import VerificationBadge from "@/components/VerificationBadge";

const ALL = getActiveBenefits();

const OUTCOME_ORDER: EligibilityOutcome[] = [
  "likely_eligible",
  "possibly_eligible",
  "manual_review_required",
  "insufficient_information",
  "likely_not_eligible",
  "not_assessed",
];
const OUTCOME_STYLE: Record<EligibilityOutcome, string> = {
  likely_eligible: "border-green-300 bg-green-50 text-green-800",
  possibly_eligible: "border-lime-300 bg-lime-50 text-lime-800",
  manual_review_required: "border-sky-300 bg-sky-50 text-sky-800",
  insufficient_information: "border-stone-300 bg-stone-100 text-stone-700",
  likely_not_eligible: "border-amber-300 bg-amber-50 text-amber-800",
  not_assessed: "border-stone-300 bg-stone-100 text-stone-500",
};
const PRIMARY: EligibilityOutcome[] = [
  "likely_eligible",
  "possibly_eligible",
  "manual_review_required",
];

export default function DynamicFinder() {
  const [state, setState] = useState<FinderState>(EMPTY_STATE);
  const [showOthers, setShowOthers] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 載入已儲存進度；若無，嘗試由舊 finder 答案帶入（向後相容）。
  useEffect(() => {
    const saved = loadState();
    if (saved.answered.length > 0 || Object.keys(saved.facts).length > 0) {
      setState(saved);
    } else {
      const legacy = loadAnswers();
      if (legacy) {
        const facts = factsFromFinder(legacy);
        setState({ facts, answered: Object.keys(facts), order: Object.keys(facts) });
      }
    }
    setLoaded(true);
  }, []);

  const update = (next: FinderState) => {
    setState(next);
    saveState(next);
  };

  const results = useMemo(
    () => ALL.map((b) => ({ benefit: b, result: evaluateBenefit(state.facts, b) })),
    [state.facts]
  );

  const inPlay = useMemo(
    () => results.filter((r) => r.result.outcome !== "likely_not_eligible").map((r) => r.benefit),
    [results]
  );

  const answeredSet = useMemo(() => new Set(state.answered), [state.answered]);
  const remaining = useMemo(
    () => selectQuestions(state.facts, inPlay, answeredSet),
    [state.facts, inPlay, answeredSet]
  );
  const q: Question | null = remaining[0] ?? nextQuestion(state.facts, inPlay, answeredSet);

  function answer(fact: string, value: unknown) {
    const facts = { ...state.facts, [fact]: value } as ApplicantFacts;
    const answered = state.answered.includes(fact) ? state.answered : [...state.answered, fact];
    const order = state.order.includes(fact) ? state.order : [...state.order, fact];
    update({ facts, answered, order });
  }
  function skip(fact: string) {
    const answered = state.answered.includes(fact) ? state.answered : [...state.answered, fact];
    const order = state.order.includes(fact) ? state.order : [...state.order, fact];
    update({ facts: state.facts, answered, order });
  }
  function back() {
    if (state.order.length === 0) return;
    const order = [...state.order];
    const last = order.pop()!;
    const facts = { ...state.facts };
    delete (facts as Record<string, unknown>)[last];
    update({ facts, answered: state.answered.filter((a) => a !== last), order });
  }
  function reset() {
    clearState();
    setState(EMPTY_STATE);
  }

  const grouped = OUTCOME_ORDER.map((o) => ({
    outcome: o,
    items: results
      .filter((r) => r.result.outcome === o)
      .sort((a, b) => b.result.confidence - a.result.confidence),
  })).filter((g) => g.items.length > 0);
  const primaryGroups = grouped.filter((g) => PRIMARY.includes(g.outcome));
  const otherGroups = grouped.filter((g) => !PRIMARY.includes(g.outcome));

  const answeredCount = state.answered.length;
  const progressTotal = answeredCount + remaining.length || 1;
  const pct = Math.round((answeredCount / progressTotal) * 100);

  if (!loaded) return <p className="py-10 text-center text-stone-500">載入緊…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">答問題，即刻睇邊啲福利啱你</h1>
        <p className="mt-1 text-stone-600">
          唔使一次過答晒。答得越多，結果越準。呢個只係參考，唔代表一定批。
        </p>
      </div>

      {/* 進度 */}
      <div>
        <div className="flex justify-between text-sm text-stone-500">
          <span>已答 {answeredCount} 條</span>
          <span>{q ? `仲有大約 ${remaining.length} 條` : "已答完"}</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-200">
          <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* 當前問題 */}
      {q ? (
        <div className="card space-y-4">
          <div>
            <p className="label">{q.labelZh}</p>
            {q.whyZh && <p className="mt-1 text-sm text-stone-500">為何要問：{q.whyZh}</p>}
            {(q.sensitive || SENSITIVE_FACTS.has(q.fact)) && (
              <p className="mt-1 text-xs text-amber-700">🔒 敏感資料 · 可揀「唔想答」</p>
            )}
          </div>
          <QuestionInput q={q} onAnswer={(v) => answer(q.fact, v)} />
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-ghost px-4 py-2 text-base" onClick={() => skip(q.fact)}>
              我唔知道
            </button>
            <button className="btn-ghost px-4 py-2 text-base" onClick={() => skip(q.fact)}>
              唔想答
            </button>
            {state.order.length > 0 && (
              <button className="btn-ghost px-4 py-2 text-base" onClick={back}>
                ← 上一題
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card bg-brand/5">
          <p className="font-semibold">已經答完可以問嘅問題。</p>
          <p className="mt-1 text-stone-600">下面係按你答案嘅指示性結果，記得以官方為準。</p>
        </div>
      )}

      {/* 即時結果 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">你嘅結果（會隨答案更新）</h2>
        {primaryGroups.length === 0 && (
          <p className="rounded-xl bg-stone-100 p-4 text-stone-600">
            暫時未有明顯符合嘅福利，答多幾條問題睇下，或者睇下所有福利。
          </p>
        )}
        {primaryGroups.map((g) => (
          <section key={g.outcome} className="space-y-2">
            <h3>
              <span className={`chip border ${OUTCOME_STYLE[g.outcome]}`}>
                {OUTCOME_LABELS_ZH[g.outcome]}（{g.items.length}）
              </span>
            </h3>
            {g.items.map(({ benefit, result }) => (
              <div key={benefit.slug} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold">{benefit.nameZh}</h4>
                    <p className="text-sm text-stone-500">{benefit.nameEn}</p>
                  </div>
                  <VerificationBadge
                    status={benefit.status}
                    lastVerified={benefit.lastUpdated}
                    active={benefit.active}
                  />
                </div>
                <ul className="mt-2 space-y-1 text-sm text-stone-700">
                  {result.reasonsZh.slice(0, 4).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                {result.warnings.map((w, i) => (
                  <p key={i} className="mt-1 text-sm text-amber-700">
                    ⚠️ {w}
                  </p>
                ))}
                <Link href={`/schemes/${benefit.slug}`} className="mt-2 inline-block text-sm font-semibold text-brand">
                  睇詳情同申請方法 →
                </Link>
              </div>
            ))}
          </section>
        ))}

        {otherGroups.length > 0 && (
          <div>
            <button className="text-sm text-brand underline" onClick={() => setShowOthers((s) => !s)}>
              {showOthers ? "收埋" : "睇埋"}其他 / 未必符合（{otherGroups.reduce((n, g) => n + g.items.length, 0)}）
            </button>
            {showOthers &&
              otherGroups.map((g) => (
                <section key={g.outcome} className="mt-2 space-y-1">
                  <span className={`chip border ${OUTCOME_STYLE[g.outcome]}`}>
                    {OUTCOME_LABELS_ZH[g.outcome]}
                  </span>
                  {g.items.map(({ benefit }) => (
                    <Link
                      key={benefit.slug}
                      href={`/schemes/${benefit.slug}`}
                      className="block rounded-lg border border-stone-200 p-2 text-sm hover:border-brand"
                    >
                      {benefit.nameZh}
                    </Link>
                  ))}
                </section>
              ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button className="btn-ghost flex-1" onClick={reset}>
          重新開始
        </button>
        <Link href="/schemes" className="btn-secondary flex-1">
          睇所有福利
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}

function QuestionInput({ q, onAnswer }: { q: Question; onAnswer: (v: unknown) => void }) {
  const [text, setText] = useState("");
  if (q.type === "yesno") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-secondary" onClick={() => onAnswer(true)}>
          係
        </button>
        <button className="btn-secondary" onClick={() => onAnswer(false)}>
          唔係
        </button>
      </div>
    );
  }
  if (q.options && q.options.length > 0) {
    return (
      <div className="space-y-2">
        {q.options.map((o) => (
          <button
            key={String(o.value)}
            className="btn-secondary w-full justify-start"
            onClick={() => onAnswer(o.value)}
          >
            {o.labelZh}
          </button>
        ))}
      </div>
    );
  }
  const numeric = q.type === "number" || q.type === "currency";
  return (
    <div className="flex gap-2">
      <input
        className="input flex-1"
        inputMode={numeric ? "numeric" : "text"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={numeric ? "輸入數字" : "輸入答案"}
      />
      <button
        className="btn-primary"
        onClick={() => onAnswer(numeric ? Number(text) : text)}
        disabled={!text}
      >
        確定
      </button>
    </div>
  );
}
