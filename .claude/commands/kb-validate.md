---
description: Audit the knowledge base for sourcing/accuracy → validation/validation_report.md
argument-hint: "[optional: specific knowledge/*.md file]"
---

Use the **kb-knowledge-validator** agent to audit the knowledge base and write
`validation/validation_report.md`. Scope: **$ARGUMENTS** (if empty, audit all of
`knowledge/`).

Remind it to check that every statement has an official source, every figure
matches the official website (fetch and confirm), no eligibility is inferred, no
required section/requirement is missing, and every official link resolves. Rank
findings Critical / High / Medium / Low and end with an ordered action list.
