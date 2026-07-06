"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AGE_LABELS,
  AgeBand,
  ASSET_LABELS,
  AssetBand,
  AUDIENCE_LABELS,
  AUDIENCE_ORDER,
  AudienceGroup,
  FinderAnswers,
  GRADE_LABELS,
  GradeLevel,
  INCOME_LABELS,
  IncomeBand,
} from "@/lib/types";
import { DEFAULT_ANSWERS, saveAnswers } from "@/lib/finder-storage";
import ProgressSteps from "@/components/ProgressSteps";

const GROUP_ICON: Record<AudienceGroup, string> = {
  student: "🎒",
  elderly: "👵",
  low_income: "🏠",
  disability: "♿",
  other: "❓",
};

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
      <ProgressSteps steps={["揀群組", "答問題"]} current={step} />

      {step === 0 && (
        <div className="card space-y-4">
          <p className="label">邊個描述最啱你？</p>
          <div className="grid gap-3">
            {AUDIENCE_ORDER.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  update("group", g);
                  setStep(1);
                }}
                className={[
                  "btn w-full justify-start gap-3 text-left",
                  a.group === g
                    ? "bg-brand text-white"
                    : "border-2 border-stone-300 bg-white text-stone-800",
                ].join(" ")}
              >
                <span className="text-2xl" aria-hidden>
                  {GROUP_ICON[g]}
                </span>
                {AUDIENCE_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <>
          <div className="card space-y-6">
            <div className="flex items-center gap-2 text-brand">
              <span className="text-2xl" aria-hidden>
                {GROUP_ICON[a.group]}
              </span>
              <span className="font-bold">{AUDIENCE_LABELS[a.group]}</span>
            </div>

            {/* ---- 共用 ---- */}
            <ToggleField
              label="你係咪香港居民？"
              value={a.isHkResident}
              onChange={(v) => update("isHkResident", v)}
            />

            {/* ---- 學生 / 在學家庭 ---- */}
            {(a.group === "student" || a.group === "low_income") && (
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
                {a.studentCount > 0 && (
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
                )}
              </>
            )}

            {a.group === "student" && (
              <>
                <ToggleField
                  label="你係咪單親家庭？"
                  value={a.singleParent}
                  onChange={(v) => update("singleParent", v)}
                />
                <ToggleField
                  label="有冇學生有殘疾或特殊教育需要？"
                  value={a.hasSen}
                  onChange={(v) => update("hasSen", v)}
                />
              </>
            )}

            {a.group === "low_income" && (
              <ToggleField
                label="屋企有冇成員返緊工？"
                value={a.hasWorkingMember}
                onChange={(v) => update("hasWorkingMember", v)}
              />
            )}

            {/* ---- 長者 ---- */}
            {a.group === "elderly" && (
              <SelectField
                label="你今年幾多歲？"
                options={Object.keys(AGE_LABELS) as AgeBand[]}
                labels={AGE_LABELS}
                value={a.ageBand}
                onChange={(v) => update("ageBand", v)}
              />
            )}

            {/* ---- 殘疾 ---- */}
            {(a.group === "disability" || a.group === "elderly") && (
              <ToggleField
                label={
                  a.group === "elderly"
                    ? "你有冇殘疾或長期病？"
                    : "你係咪經評估為殘疾人士？"
                }
                value={a.hasDisability}
                onChange={(v) => update("hasDisability", v)}
              />
            )}
            {a.group === "disability" && (
              <SelectField
                label="你今年幾多歲？"
                options={Object.keys(AGE_LABELS) as AgeBand[]}
                labels={AGE_LABELS}
                value={a.ageBand}
                onChange={(v) => update("ageBand", v)}
              />
            )}

            {/* ---- 收入 / 綜援（大部分群組共用）---- */}
            {a.group !== "other" && (
              <ToggleField
                label="你屋企係咪正領取綜援？"
                value={a.onCssa}
                onChange={(v) => update("onCssa", v)}
              />
            )}
            <SelectField
              label="家庭每月總收入大約幾多？"
              options={Object.keys(INCOME_LABELS) as IncomeBand[]}
              labels={INCOME_LABELS}
              value={a.incomeBand}
              onChange={(v) => update("incomeBand", v)}
            />

            {/* ---- 資產（長者 / 殘疾）---- */}
            {(a.group === "elderly" || a.group === "disability") && (
              <SelectField
                label="你嘅資產（存款等）大約幾多？"
                options={Object.keys(ASSET_LABELS) as AssetBand[]}
                labels={ASSET_LABELS}
                value={a.assetBand}
                onChange={(v) => update("assetBand", v)}
              />
            )}

            {/* ---- 獨居（長者）---- */}
            {a.group === "elderly" && (
              <ToggleField
                label="你係咪獨居？"
                value={a.livingAlone}
                onChange={(v) => update("livingAlone", v)}
              />
            )}

            {/* ---- 需求 ---- */}
            {(a.group === "elderly" || a.group === "disability") && (
              <ToggleField
                label="你需唔需要醫療費支援？"
                value={a.needMedicalSupport}
                onChange={(v) => update("needMedicalSupport", v)}
              />
            )}
            <ToggleField
              label="你需唔需要交通費支援？"
              value={a.needTravelSupport}
              onChange={(v) => update("needTravelSupport", v)}
            />
            {(a.group === "student" || a.group === "low_income") && (
              <ToggleField
                label="你需唔需要上網費支援？"
                value={a.needInternetSupport}
                onChange={(v) => update("needInternetSupport", v)}
              />
            )}

            {/* ---- 其他 ---- */}
            {a.group === "other" && (
              <NumberField
                label="你屋企有幾多人？"
                value={a.householdSize}
                min={1}
                onChange={(v) => update("householdSize", v)}
              />
            )}

            <p className="rounded-xl bg-stone-100 p-3 text-base text-stone-600">
              答完之後，我哋會列出可能啱你嘅津貼。呢個只係參考，唔代表一定批。
            </p>
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep(0)}>
              ← 揀過群組
            </button>
            <button className="btn-primary flex-1" onClick={submit}>
              睇結果
            </button>
          </div>
        </>
      )}
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

function SelectField<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-3 space-y-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={[
              "btn w-full justify-start",
              value === opt
                ? "bg-brand text-white"
                : "border-2 border-stone-300 bg-white text-stone-700",
            ].join(" ")}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}
