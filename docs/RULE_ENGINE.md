# Eligibility Rule Engine

Typed, reusable, **explainable** engine that gives an *indicative* eligibility
result. **It never makes a final government decision.**

Location: `src/lib/eligibility/`
- `facts.ts` — normalized `ApplicantFacts` (all optional; absent = unknown) + `ApplicantFactKey` + `SENSITIVE_FACTS`.
- `rules.ts` — `Condition`, `RuleGroup` (`all`/`any`/`none`, nestable), `Operator`.
- `schema.ts` — Zod contract for rules (recursive via `z.lazy`).
- `engine.ts` — `evaluate(facts, {ruleSet, verification})` and `evaluateBenefit(facts, benefit)`.
- `outcome.ts` — `EligibilityOutcome`, `EligibilityResult`, labels.
- `compat.ts` — converts the legacy `EligibilityRule` bag → `RuleGroup` (so the 21 existing benefits work with no content change).
- `factsFromFinder.ts` — maps the existing `FinderAnswers` → `ApplicantFacts` (backward compatible).

## Rule model

```ts
type Operator = "eq"|"neq"|"gt"|"gte"|"lt"|"lte"|"in"|"not_in"
              |"contains"|"between"|"exists"|"not_exists"|"before"|"after";
interface Condition { fact: ApplicantFactKey; op: Operator; value?: unknown;
                      labelZh?; labelEn?; sourceRef? }
interface RuleGroup { all?: RuleNode[]; any?: RuleNode[]; none?: RuleNode[] }  // nestable
```

## Three-valued evaluation

Each condition → `pass | fail | unknown` (unknown = required fact missing).
Groups combine three-valued:
- `all`: fail if any fail; else unknown if any unknown; else pass.
- `any`: pass if any pass; else unknown if any unknown; else fail.
- `none`: fail if any pass; else unknown if any unknown; else pass.

## Outcomes & gating

| Root result | verified | not verified (needs_review / stale / draft) |
| --- | --- | --- |
| pass | `likely_eligible` | `possibly_eligible` (+ warning) |
| fail | `likely_not_eligible` | `likely_not_eligible` |
| unknown, some matched | `manual_review_required` | `manual_review_required` (+ warning) |
| unknown, none matched | `insufficient_information` | `insufficient_information` |
| no ruleSet | `not_assessed` | `not_assessed` |

**Only `verified` benefits may return `likely_eligible`.** `needs_review`/`stale`/`draft`
can never be high-confidence — they cap at `possibly_eligible` and always add a warning.

## Explainable result

`evaluate()` returns `{ outcome, confidence, matchedConditions, failedConditions,
unknownConditions, reasonsZh, reasonsEn, missingFacts, warnings, verificationStatus }`.
The UI must explain *why it may fit*, *why it may not*, *what's missing*, and *which
official requirement to confirm* — never only a score.

## Adding a curated ruleSet to a benefit

Add a `ruleSet` (RuleGroup) to `content/benefits/<slug>.json`. If absent, the engine
falls back to `compat.matchRuleToRuleSet(matchRule)` (hard conditions only). Every
`Condition` should carry `labelZh`/`sourceRef` pointing at the official requirement.

Tests: `tests/rule-engine.test.ts` (all/any/none, nested, unknown, numeric/date/band
operators, conflicting conditions, verified vs stale/needs_review gating).
