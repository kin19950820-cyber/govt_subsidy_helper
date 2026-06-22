"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FinderAnswers,
  GRADE_LABELS,
  GradeLevel,
  INCOME_LABELS,
  IncomeBand,
} from "@/lib/types";
import { DEFAULT_ANSWERS, saveAnswers } from "@/lib/finder-storage";
import ProgressSteps from "@/components/ProgressSteps";

const STEP_LABELS = ["家庭", "學生", "收入", "需要"];

export default function FinderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<FinderAnswers>(DEFAULT_ANSWERS);

  function update<K extends keyof FinderAnswers>(key: K, value: FinderAnswers[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGrade(g: GradeLevel) {
    setA((prev) => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(g)
        ? prev.gradeLevels.filter((x) => x !== g)
        : [...prev.gradeLevels, g],
    }));
  }

  function submit() {
    saveAnswers(a);
    router.push("/results");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">答幾條問題，幫你搵津貼</h1>
      <ProgressSteps steps={STEP_LABELS} current={step} />

      <div className="card space-y-6">
        {step === 0 && (
          <>
            <NumberField
              label="你屋企有幾多人？（包括自己）"
              value={a.householdSize}
              min={1}
              onChange={(v) => update("householdSize", v)}
            />
            <NumberField
              label="當中有幾多個學生？"
              value={a.studentCount}
              min={0}
              onChange={(v) => update("studentCount", v)}
            />
            <ToggleField
              label="你係咪單親家庭？"
              value={a.singleParent}
              onChange={(v) => update("singleParent", v)}
            />
            <ToggleField
              label="你係咪新來港家庭？"
              value={a.newArrival}
              onChange={(v) => update("newArrival", v)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <p className="label">學生讀緊邊個階段？（可多選）</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(Object.keys(GRADE_LABELS) as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={[
                      "btn",
                      a.gradeLevels.includes(g)
                        ? "bg-brand text-white"
                        : "border-2 border-stone-300 bg-white text-stone-700",
                    ].join(" ")}
                  >
                    {GRADE_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
            <ToggleField
              label="有冇學生有殘疾或特殊教育需要？"
              value={a.hasSen}
              onChange={(v) => update("hasSen", v)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <ToggleField
              label="你屋企係咪正領取綜援？"
              value={a.onCssa}
              onChange={(v) => update("onCssa", v)}
            />
            <div>
              <p className="label">家庭每月總收入大約幾多？</p>
              <div className="mt-3 space-y-2">
                {(Object.keys(INCOME_LABELS) as IncomeBand[]).map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => update("incomeBand", band)}
                    className={[
                      "btn w-full justify-start",
                      a.incomeBand === band
                        ? "bg-brand text-white"
                        : "border-2 border-stone-300 bg-white text-stone-700",
                    ].join(" ")}
                  >
                    {INCOME_LABELS[band]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <ToggleField
              label="你需唔需要交通費（車船）支援？"
              value={a.needTravelSupport}
              onChange={(v) => update("needTravelSupport", v)}
            />
            <ToggleField
              label="你需唔需要上網費支援？"
              value={a.needInternetSupport}
              onChange={(v) => update("needInternetSupport", v)}
            />
            <p className="rounded-xl bg-stone-100 p-3 text-base text-stone-600">
              答完之後，我哋會列出可能啱你嘅津貼。呢個只係參考，唔代表一定批。
            </p>
          </>
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button className="btn-ghost flex-1" onClick={() => setStep((s) => s - 1)}>
            ← 上一步
          </button>
        )}
        {step < STEP_LABELS.length - 1 ? (
          <button className="btn-primary flex-1" onClick={() => setStep((s) => s + 1)}>
            下一步 →
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={submit}>
            睇結果
          </button>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          className="btn-ghost h-14 w-14 text-2xl"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="減少"
        >
          −
        </button>
        <span className="min-w-[3rem] text-center text-3xl font-bold">{value}</span>
        <button
          type="button"
          className="btn-ghost h-14 w-14 text-2xl"
          onClick={() => onChange(value + 1)}
          aria-label="增加"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={[
            "btn",
            value ? "bg-brand text-white" : "border-2 border-stone-300 bg-white text-stone-700",
          ].join(" ")}
        >
          係
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={[
            "btn",
            !value ? "bg-brand text-white" : "border-2 border-stone-300 bg-white text-stone-700",
          ].join(" ")}
        >
          唔係
        </button>
      </div>
    </div>
  );
}
