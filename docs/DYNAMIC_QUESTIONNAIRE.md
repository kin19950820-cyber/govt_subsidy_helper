# Dynamic Questionnaire

Questions are generated from the eligibility rules + `ApplicantFacts` schema —
**not** a hardcoded questionnaire per benefit.

Location: `src/lib/questionnaire/`
- `questions.ts` — the question registry (`Question` keyed by `ApplicantFactKey`):
  stable `id`, `fact`, zh/en labels, `helperYue`, `type` (yesno / single / multi /
  number / currency / date / text / district / income_band / asset_band),
  `options`, `sensitive`, `importance`, `whyZh/whyEn` (why we ask), `showIf`
  (conditional display), `allowUnknown`, `allowSkip`.
- `select.ts` — `collectRequiredFacts`, `selectQuestions`, `nextQuestion`.

## Selection algorithm

For the current `ApplicantFacts` and a candidate `Benefit[]`:
1. Collect the facts each benefit's `ruleSet` (or legacy `matchRule` shim) needs.
2. Drop facts already known or in `answeredKeys` (no re-asking; supports skip /
   "I don't know" / "prefer not to answer" — the key is recorded so we never ask again).
3. Rank remaining questions by: **(a) number of benefits affected**, then
   **(b) importance**, then **(c) least sensitive** (a non-sensitive question that
   resolves the same set is preferred).
4. `showIf` gives **progressive disclosure** — a question only appears once its
   prerequisite facts are known and satisfied (e.g. asset band only after age).

Results **recalculate** as facts arrive (answering removes that question and can
eliminate benefits early). Never asks for HKID, bank account, or exact medical
diagnosis during discovery — sensitive facts (`SENSITIVE_FACTS`) are deferred.

## Integration (C4, upcoming)

A dynamic finder UI will iterate `nextQuestion(facts, candidates, answeredKeys)`,
persist `{facts, answeredKeys}` (save/resume/revise), and re-run
`evaluateBenefit(facts, benefit)` after each answer to show explainable results.
The existing `FinderAnswers` + `sessionStorage` remain supported via
`factsFromFinder()` for backward compatibility.

Tests: `tests/questionnaire.test.ts` (no duplicates, answered/skip exclusion,
count & importance priority, progressive disclosure, recalculation).
