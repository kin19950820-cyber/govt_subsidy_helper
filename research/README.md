# Research drafts (not canonical)

Human-reviewed research staging. **Nothing here is published automatically.**
Research agents may prepare drafts; a human must review before a record becomes
`verified`. Canonical benefit JSON under `content/benefits/` is **never**
overwritten by automation.

## Layout

```
research/benefits/<slug>/
  research-summary.md     what was found, in plain language
  sources.json           source manifest (official_domains-checked)
  extracted-facts.json    structured facts pulled from sources
  proposed-benefit.json   a proposed content/benefits/<slug>.json
  differences.md          diff vs the existing canonical record
  unresolved.md           open questions, conflicts, uncertainty
```

Templates: `research/benefits/_TEMPLATE/`.

## Pipeline (see docs/RESEARCH_AND_VERIFICATION.md)

Discover → Fetch → Extract → Normalize → Compare → Validate → **Human review** →
Publish. Only official sources on the `content/taxonomy/official_domains.json`
allowlist. Never mark `verified` from a news article or third-party summary.
