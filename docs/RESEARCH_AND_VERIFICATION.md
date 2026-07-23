# Research & Verification Workflow

A repeatable, **human-gated** process for adding and maintaining reliable
government information. No uncontrolled autonomous crawler publishes to
production. Agents prepare drafts; **a human reviews before a record becomes
`verified`.**

## Pipeline

1. **Discover** — from the official allowlist only
   (`content/taxonomy/official_domains.json`). Publisher identity is stored
   separately; do not assume every subdomain or external org is official.
2. **Fetch** — retrieve official pages/PDFs (network job, not unit tests).
3. **Extract** — structured facts → `research/benefits/<slug>/extracted-facts.json`.
4. **Normalize** — to the Benefit content shape → `proposed-benefit.json`.
5. **Compare** — vs the canonical record → `differences.md`.
6. **Validate** — Zod + completeness + `source-audit` (below).
7. **Human review** — resolve `unresolved.md`; decide status.
8. **Publish** — a human copies the approved `proposed-benefit.json` into
   `content/benefits/<slug>.json` and runs `npm run benefits:build`.
   **Automation never overwrites canonical benefit JSON.**

Drafts live under `research/benefits/<slug>/` (templates in `_TEMPLATE/`).

## Source checks — `npm run source-audit`

Deterministic (offline) by default: invalid/malformed URLs, non-HTTPS, domains
outside the allowlist, duplicate sources, stale verification dates
(`lastUpdated`/`sources[].lastCheckedAt` older than the review window), and
missing `sourceType`. Add `--network` to also check HTTP status, redirects, and
`contentHash` changes. Local dev and normal builds must **not** fail because a
government site is briefly unavailable — network checks run in a separate,
non-blocking CI job (`scripts/check-links.mjs`, `--network` audits).

Output: `reports/source-change-report.md`.

## Change monitoring

The audit + link checks flag: source content changed (hash), form URL changed,
guidance replaced, deadline/amount/eligibility wording changed, application
method changed, scheme suspended/closed. **Never silently update eligibility
rules from an automated diff** — a human confirms and edits the canonical record.

## Data-quality rules (enforced by tests)

Never invent amounts/thresholds/dates. Never mark `verified` from a news article
or third-party summary. Prefer the scheme owner's page over general GovHK
summaries. Store `effectiveFrom` for changing values; preserve history in
`changeLog[]`. Distinguish statutory eligibility from simplified explanations.
Store uncertainty in `knownUncertainty[]`. Archive closed schemes (never delete).
Don't treat every public service as a subsidy. Don't reuse one income rule across
schemes unless the official methodology is genuinely shared.
