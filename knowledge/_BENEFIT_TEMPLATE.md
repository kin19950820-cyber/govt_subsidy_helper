---
slug: <benefit-slug>              # kebab-case, matches knowledge file + content/benefits/<slug>.json
name_zh: <中文名稱>
name_en: <English name>
department: <responsible official department>
category_code: <one of content/taxonomy/categories.json codes>
life_events: [<codes from content/taxonomy/life_events.json>]
official_urls:
  - <official URL>
online_url: <online application URL, or null>
form_url: <downloadable form URL, or null>
guidance_url: <guidance notes URL, or null>
faq_url: <official FAQ URL, or null>
contact_phone: <hotline, or null>
contact_email: <email, or null>
last_verified: <YYYY-MM-DD>
status: draft                      # draft | needs_review | verified
---

# Overview

<Plain-language overview (Traditional Chinese first). No figures unless cited.>

# Official Purpose

<Stated objective, close to official wording. [n]>

# Eligibility

**Target beneficiaries:** …
**Who can apply / cannot apply:** …
**Means test requirement:** … (or 不設審查) [n]
**Residency requirement:** … [n]
**Income requirement:** … (quote figure + effective date, or ⚠️ Needs Manual Review)
**Asset requirement:** … (as above)
**Age requirement:** … [n]
**Employment requirement:** … [n]
**Student requirement:** … [n]

# Required Documents

- … (required)
- … (supporting, if applicable)

# Application Steps

<Numbered, simple Traditional Chinese steps. Include application method +
submission channel.>

# Processing / Renewal / Appeal

- **Processing time:** … (or ⚠️ Needs Manual Review)
- **Renewal:** …
- **Appeal:** …

# FAQs

**Q:** … **A:** … [n]

# Exceptions

<Cancellation, mutual exclusivity, special cases.>

# Life Events

<Which life events this benefit maps to and why (e.g. 退休, 搵工, 移居廣東).>

# Official References

1. <URL> — <title> (updated: <date if shown>)
2. …

---
> Quality rules: official `*.gov.hk` sources only · never invent eligibility ·
> never estimate amounts · cite every fact · mark uncertain items
> `⚠️ Needs Manual Review`. After verifying, create/update
> `content/benefits/<slug>.json` and run `npm run benefits:build`.
