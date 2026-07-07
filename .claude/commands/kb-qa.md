---
description: Compare the web app against the knowledge base → qa/qa_report.md
argument-hint: "[optional: scheme slug]"
---

Use the **kb-web-qa-reviewer** agent to verify the web application against the
knowledge base (the single source of truth) and write `qa/qa_report.md`. Scope:
**$ARGUMENTS** (if empty, review every scheme).

Remind it to compare app → knowledge → official for every eligibility text,
document checklist, application step, warning, FAQ, definition, hyperlink, phone
number, department name, and downloadable form; to test that official links
resolve; and to rank findings Critical / High / Medium / Low grouped by
Incorrect / Missing / Outdated / Broken links / Misleading. Report, do not fix,
unless I explicitly ask for fixes.
