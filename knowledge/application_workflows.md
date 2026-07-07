---
maintained_by: kb-workflow-analyst
last_verified: 2026-06-22
status: needs_review
---

# 申請流程 · Application Workflows

> Seed draft. The generic journey below reflects the common structure of HK
> subsidy applications. **Official per-stage timelines and channels must be
> confirmed** by kb-workflow-analyst against each scheme's official guide; items
> not yet confirmed are `⚠️ Needs Manual Review`.

## Generic end-to-end journey

```mermaid
flowchart TD
    A[市民發現津貼<br/>Citizen discovers subsidy] --> B[資格檢查<br/>Eligibility checking]
    B -->|可能合資格| C[準備文件<br/>Prepare documents]
    B -->|明顯唔合資格| X[考慮其他支援 /<br/>問社工]
    C --> D[遞交申請<br/>Submit application]
    D --> E[政府審核<br/>Government review]
    E -->|需補交資料| F[要求補充資料<br/>Additional info requested]
    F --> E
    E -->|批准| G[批准<br/>Approval]
    E -->|拒絕| H[可提出上訴<br/>Appeal]
    H -->|上訴成功| G
    H -->|維持原決定| Z[結案<br/>Closure]
    G --> I[發放款項 / 服務<br/>Payment or service]
    I --> J{需要續期?<br/>Renewal?}
    J -->|是| C
    J -->|否 / 完結| Z
```

**Steps (plain 中文):**

1. **發現津貼** — 透過本 App、政府網站或社工得知。
2. **資格檢查** — 對照年齡、學生身分、收入、資產、居港等條件。⚠️ Needs Manual Review（各計劃條件以官方為準）。
3. **準備文件** — 身份證、住址證明、收入證明、學生 / 年齡 / 殘疾證明等。
4. **遞交申請** — 網上（SFO E-link / iAM Smart）、郵寄或親身。
5. **政府審核** — 核對文件與資格。⚠️ 審核時間以官方為準。
6. **要求補充資料** — 如文件不齊或需澄清，會通知補交。
7. **批准 / 拒絕** — 以通知書為準。
8. **上訴** — 如被拒，可按official機制提出。⚠️ 上訴期限以官方為準。
9. **發放** — 自動轉賬 / 直接減免 / 服務券 / 上門服務。
10. **續期** — 部分計劃需每年重新申請或審查。
11. **結案 / 取消** — 不再符合資格、遷離、或計劃完結。

## A. 入息審查學生資助（綜合申請）— Textbook / Travel / Internet

三項中小學津貼共用一份「學生資助計劃」綜合申請表及同一次入息審查。

```mermaid
flowchart TD
    A[一份綜合申請表<br/>Combined application] --> B[入息審查<br/>Means test]
    B --> C{全額 / 半額 / 不合資格}
    C -->|全額| D[全額資助]
    C -->|半額| E[半額資助]
    C -->|不合資格| F[不獲資助]
    D --> G[自動轉賬入戶口]
    E --> G
```

- 遞交渠道：SFO E-link 網上 / 郵寄。⚠️ 申請期以官方為準。[1]
- 正領綜援家庭：學校相關開支已涵蓋於綜援，一般毋須重複申請。

## B. 免審查長者津貼 — Old Age Allowance（生果金）

```mermaid
flowchart TD
    A[年滿 70 歲] --> B[填申請表 + 身份/銀行資料]
    B --> C[社會福利署處理]
    C --> D[批准]
    D --> E[每月自動轉賬]
```

- 毋須入息 / 資產審查（70 歲或以上）。⚠️ 確認年齡與居港規定。[2]
- 不可同時領取長者生活津貼或綜援。

## C. 服務券 / 社區照顧 — Community Care Service Voucher

```mermaid
stateDiagram-v2
    [*] --> 評估: 安老服務統一評估
    評估 --> 編配: 合資格
    評估 --> 不合資格
    編配 --> 選用服務: 揀認可服務單位
    選用服務 --> 共同付款: 按家庭收入分擔
    共同付款 --> 定期檢討
    定期檢討 --> [*]
```

- 先經統一評估，再編配服務券；費用按家庭入息共同付款。⚠️ 確認評估準則與付款比例。[2]

## D. 出院長者支援 — Integrated Discharge Support

```mermaid
flowchart TD
    A[住院] --> B[出院前評估<br/>醫院 / 社工]
    B --> C[轉介去計劃]
    C --> D[上門過渡支援<br/>家居照顧 / 復康 / 送飯]
    D --> E[轉介長期社區服務]
```

- 由醫院 / 社工評估及轉介，非自行網上申請。⚠️ 確認年齡門檻與服務期。[2][3]

# Source References

1. WFSFAA SFO — Primary & Secondary schemes:
   https://www.wfsfaa.gov.hk/en/sfo/primarysecondary/tt/overview.php
2. Social Welfare Department — Elderly / Social Security:
   https://www.swd.gov.hk/en/index/site_pubsvc/page_elderly/
3. Hospital Authority: https://www.ha.org.hk/

> ⚠️ Needs Manual Review: confirm every timeline, application window and appeal
> period against the official guides before marking `status: verified`.
