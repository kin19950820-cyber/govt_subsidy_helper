import { ExtractedScheme } from "../types.js";
import { f, rule } from "../util/field.js";

// 由官方 WFSFAA / 相關政府來源整理嘅結構化事實。
// 原則：
//  - 結構性、長期穩定嘅事實 → high confidence
//  - 每年會變嘅數字（入息上限、津貼金額、申請期）→ 唔寫死，標 needs_review
//  - 唔會聲稱保證合資格
// source_url 用官方頁面；確實深層連結可由 admin 於 review 階段更新。

const LAST_CHECKED = process.env.LAST_CHECKED_AT ?? new Date().toISOString();

const URLS = {
  wfsfaa: "https://www.wfsfaa.gov.hk/",
  sfo: "https://www.wfsfaa.gov.hk/en/sfo/index.htm",
  forms: "https://www.wfsfaa.gov.hk/en/resources/forms/form.htm",
  primarySecondary:
    "https://www.wfsfaa.gov.hk/en/sfo/primarysecondary/tt/overview.php",
  preprimary: "https://www.wfsfaa.gov.hk/en/sfo/preprimary/index.htm",
  wfa: "https://www.wfsfaa.gov.hk/wfao/en/index.htm",
  swdCssa:
    "https://www.swd.gov.hk/en/index/site_pubsvc/page_socsecu/sub_comprehens/",
  elink: "https://ess.wfsfaa.gov.hk/",
};

// 三個中小學津貼共用一張「學生資助計劃綜合申請表」+ 入息審查。
const COMBINED_APP =
  "屬「學生資助計劃」的入息審查資助，可用一份綜合申請表一次過申請多項津貼，毋須逐項分開申請。";
const COMMON_DEPT =
  "在學資助處（學生資助處），隸屬工作及學生資助辦事處（WFSFAA）";
const COMMON_PHONE = "2802 2345";

export const SCHEMES: ExtractedScheme[] = [
  // ---------------- 1. 書簿津貼 TA ----------------
  {
    scheme_code: "TA",
    name_zh: f("學校書簿津貼計劃", "high", URLS.primarySecondary),
    name_en: f("School Textbook Assistance Scheme", "high", URLS.primarySecondary),
    responsible_department: f(COMMON_DEPT, "high", URLS.sfo),
    target_applicants: f(
      "就讀本地小學或中學日校、家庭通過入息審查的清貧學生",
      "high",
      URLS.primarySecondary
    ),
    education_level: f(["primary", "secondary"], "high", URLS.primarySecondary),
    eligibility_criteria: f(
      [
        "學生就讀本地公營 / 受資助 / 符合資格的小學或中學日校",
        "家庭通過學生資助處的入息審查",
        "可獲全額或半額資助，視乎家庭經濟狀況",
      ],
      "medium",
      URLS.primarySecondary
    ),
    means_test_requirement: f(
      "須通過家庭入息審查（means test）。實際入息上限及全額／半額分界每學年公布，需以官方最新數字為準。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    residency_requirement: f(
      "申請人及學生一般須為香港居民；確實居留要求請以官方為準。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    student_status_requirement: f(
      "學生須為日校全日制在學學生。",
      "high",
      URLS.primarySecondary
    ),
    household_requirement: f(
      "以家庭（住戶）為單位計算入息及人數。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    application_period: f(
      "通常於每學年指定期間接受申請；確實日期每年公布，需人手核實。",
      "low",
      URLS.primarySecondary,
      true
    ),
    application_method: f(COMBINED_APP, "high", URLS.primarySecondary),
    required_documents: f(
      [
        "申請人身份證明文件",
        "學生身份證明 / 出生證明",
        "住址證明",
        "家庭成員入息證明",
        "銀行戶口資料（用作發放津貼）",
      ],
      "medium",
      URLS.forms,
      true
    ),
    submission_channel: f(
      "可經學生資助處網上服務（SFO E-link / 學資處電子通）遞交，或郵寄 / 親身遞交綜合申請表。",
      "medium",
      URLS.elink,
      true
    ),
    approval_timeline: f(
      "審批時間視乎申請數量及文件齊備程度，結果以通知書為準。",
      "low",
      URLS.primarySecondary,
      true
    ),
    payment_arrangement: f(
      "津貼一般以自動轉賬存入指定銀行戶口。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    enquiry_phone: f(COMMON_PHONE, "medium", URLS.sfo, true),
    enquiry_email: f("查詢電郵請參考官方網站聯絡頁。", "low", URLS.sfo, true),
    official_page_url: f(URLS.primarySecondary, "high", URLS.primarySecondary),
    form_url: f(URLS.forms, "medium", URLS.forms, true),
    notes: f(
      [
        "正領取綜援的家庭，學校相關開支一般已涵蓋於綜援內，毋須重複申請。",
        "全額／半額資助金額及入息上限每學年不同，須以官方公布為準。",
      ],
      "medium",
      URLS.primarySecondary,
      true
    ),
    child_friendly: {
      what_helps: "呢個資助幫你俾返買書同學習用品嘅錢。",
      who_can_apply: "讀緊小學或中學、屋企收入唔多嘅學生。",
      what_to_prepare: "身份證、學生證明、住址證明同收入證明。",
      how_to_apply: "填一張「學生資助計劃」綜合申請表，一次過申請。",
      after_apply: "政府會睇你屋企收入，再決定俾全額定半額。",
      when_money: "批咗之後，啲錢會直接過入你嘅銀行戶口。",
      who_to_ask: "有唔明可以打俾學生資助處，或者問學校社工。",
    },
    rule_set: {
      scheme_code: "TA",
      rules: [
        rule("education_level", "in", ["primary", "secondary"], URLS.primarySecondary, "high"),
        rule("means_test_required", "equals", true, URLS.primarySecondary, "high"),
        rule("is_hong_kong_resident", "equals", true, URLS.primarySecondary, "medium", true),
        rule("on_cssa", "equals", false, URLS.primarySecondary, "medium", true),
      ],
      manual_review_notes: [
        "入息上限及全額/半額分界線每學年更新，需人手核實。",
        "確認與綜援不可重複領取的最新條款。",
      ],
    },
    last_checked_at: LAST_CHECKED,
  },

  // ---------------- 2. 學生車船津貼 STS ----------------
  {
    scheme_code: "STS",
    name_zh: f("學生車船津貼計劃", "high", URLS.primarySecondary),
    name_en: f("Student Travel Subsidy Scheme", "high", URLS.primarySecondary),
    responsible_department: f(COMMON_DEPT, "high", URLS.sfo),
    target_applicants: f(
      "需以公共交通工具往返學校、家庭通過入息審查的學生",
      "high",
      URLS.primarySecondary
    ),
    education_level: f(
      ["primary", "secondary", "tertiary"],
      "medium",
      URLS.primarySecondary,
      true
    ),
    eligibility_criteria: f(
      [
        "學生就讀本地日校",
        "居住地點與學校距離須符合須使用公共交通的要求",
        "家庭通過入息審查",
      ],
      "medium",
      URLS.primarySecondary,
      true
    ),
    means_test_requirement: f(
      "須通過家庭入息審查；實際上限每學年公布，需人手核實。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    residency_requirement: f(
      "申請人及學生一般須為香港居民。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    student_status_requirement: f(
      "全日制日校在學學生。",
      "high",
      URLS.primarySecondary
    ),
    household_requirement: f("以家庭為單位審查。", "medium", URLS.primarySecondary, true),
    application_period: f(
      "每學年指定期間；確實日期需人手核實。",
      "low",
      URLS.primarySecondary,
      true
    ),
    application_method: f(COMBINED_APP, "high", URLS.primarySecondary),
    required_documents: f(
      ["申請人身份證明", "學生證明", "住址證明", "入息證明", "銀行戶口資料"],
      "medium",
      URLS.forms,
      true
    ),
    submission_channel: f(
      "經 SFO E-link 網上遞交，或郵寄／親身遞交綜合申請表。",
      "medium",
      URLS.elink,
      true
    ),
    approval_timeline: f("以通知書為準。", "low", URLS.primarySecondary, true),
    payment_arrangement: f("以自動轉賬發放。", "medium", URLS.primarySecondary, true),
    enquiry_phone: f(COMMON_PHONE, "medium", URLS.sfo, true),
    enquiry_email: f("請參考官方聯絡頁。", "low", URLS.sfo, true),
    official_page_url: f(URLS.primarySecondary, "high", URLS.primarySecondary),
    form_url: f(URLS.forms, "medium", URLS.forms, true),
    notes: f(
      ["住所與學校距離 / 可步行範圍的界定，需以官方準則核實。"],
      "low",
      URLS.primarySecondary,
      true
    ),
    child_friendly: {
      what_helps: "呢個資助幫你俾返搭車搭船返學嘅交通費。",
      who_can_apply: "要搭車先返到學校、屋企收入唔多嘅學生。",
      what_to_prepare: "身份證、學生證明、住址證明同收入證明。",
      how_to_apply: "填「學生資助計劃」綜合申請表一齊申請。",
      after_apply: "政府會睇你住得遠唔遠同屋企收入。",
      when_money: "批咗之後，啲錢會過入你嘅銀行戶口。",
      who_to_ask: "可以打俾學生資助處或者問學校。",
    },
    rule_set: {
      scheme_code: "STS",
      rules: [
        rule("education_level", "in", ["primary", "secondary", "tertiary"], URLS.primarySecondary, "medium", true),
        rule("means_test_required", "equals", true, URLS.primarySecondary, "high"),
        rule("needs_travel_support", "equals", true, URLS.primarySecondary, "medium", true),
        rule("is_hong_kong_resident", "equals", true, URLS.primarySecondary, "medium", true),
      ],
      manual_review_notes: [
        "距離 / 可步行範圍準則需核實。",
        "大專學生是否適用需以官方為準。",
      ],
    },
    last_checked_at: LAST_CHECKED,
  },

  // ---------------- 3. 上網費津貼 IA ----------------
  {
    scheme_code: "IA",
    name_zh: f("上網費津貼計劃", "high", URLS.primarySecondary),
    name_en: f(
      "Subsidy Scheme for Internet Access Charges",
      "high",
      URLS.primarySecondary
    ),
    responsible_department: f(COMMON_DEPT, "high", URLS.sfo),
    target_applicants: f(
      "有就讀中小學或以下學生、需要在家上網學習的低收入家庭",
      "medium",
      URLS.primarySecondary,
      true
    ),
    education_level: f(
      ["kindergarten", "primary", "secondary"],
      "medium",
      URLS.primarySecondary,
      true
    ),
    eligibility_criteria: f(
      [
        "家庭有合資格在學子女",
        "正領取綜援，或通過入息審查",
        "一般以每戶為單位發放定額津貼",
      ],
      "medium",
      URLS.primarySecondary,
      true
    ),
    means_test_requirement: f(
      "須通過入息審查或正領取綜援；定額金額每年公布，需人手核實。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    residency_requirement: f("一般須為香港居民。", "medium", URLS.primarySecondary, true),
    student_status_requirement: f(
      "家庭須有合資格在學學生。",
      "medium",
      URLS.primarySecondary,
      true
    ),
    household_requirement: f("以住戶為單位，每戶通常一份。", "medium", URLS.primarySecondary, true),
    application_period: f("每學年指定期間；需人手核實。", "low", URLS.primarySecondary, true),
    application_method: f(COMBINED_APP, "medium", URLS.primarySecondary, true),
    required_documents: f(
      ["申請人身份證明", "學生證明", "住址證明", "入息或綜援證明", "銀行戶口資料"],
      "medium",
      URLS.forms,
      true
    ),
    submission_channel: f("經 SFO E-link 或綜合申請表遞交。", "medium", URLS.elink, true),
    approval_timeline: f("以通知書為準。", "low", URLS.primarySecondary, true),
    payment_arrangement: f("一般以自動轉賬發放定額津貼。", "medium", URLS.primarySecondary, true),
    enquiry_phone: f(COMMON_PHONE, "medium", URLS.sfo, true),
    enquiry_email: f("請參考官方聯絡頁。", "low", URLS.sfo, true),
    official_page_url: f(URLS.primarySecondary, "medium", URLS.primarySecondary, true),
    form_url: f(URLS.forms, "medium", URLS.forms, true),
    notes: f(
      ["計劃名稱 / 涵蓋年級 / 金額按年度而定，需以官方公布核實。"],
      "low",
      URLS.primarySecondary,
      true
    ),
    child_friendly: {
      what_helps: "呢個資助幫你屋企俾返上網費，方便你喺屋企上堂同做功課。",
      who_can_apply: "屋企有學生、需要上網學習而收入唔多嘅家庭。",
      what_to_prepare: "身份證、學生證明、住址證明同收入或綜援證明。",
      how_to_apply: "填申請表，連文件一齊交。",
      after_apply: "政府會睇你屋企情況再決定。",
      when_money: "批咗會發一筆定額津貼入戶口。",
      who_to_ask: "有問題打俾學生資助處或問學校。",
    },
    rule_set: {
      scheme_code: "IA",
      rules: [
        rule("education_level", "in", ["kindergarten", "primary", "secondary"], URLS.primarySecondary, "medium", true),
        rule("means_test_required", "equals", true, URLS.primarySecondary, "medium", true),
        rule("needs_internet_support", "equals", true, URLS.primarySecondary, "medium", true),
      ],
      manual_review_notes: ["涵蓋年級、定額金額、與綜援關係需核實。"],
    },
    last_checked_at: LAST_CHECKED,
  },

  // ---------------- 4. 幼稚園及幼兒中心學費減免 KCFRS ----------------
  {
    scheme_code: "KCFRS",
    name_zh: f("幼稚園及幼兒中心學費減免計劃", "high", URLS.preprimary),
    name_en: f(
      "Kindergarten and Child Care Centre Fee Remission Scheme",
      "high",
      URLS.preprimary
    ),
    responsible_department: f(COMMON_DEPT, "high", URLS.sfo),
    target_applicants: f(
      "子女就讀參加計劃的幼稚園 / 幼兒中心、家庭通過入息審查的低收入家庭",
      "medium",
      URLS.preprimary,
      true
    ),
    education_level: f(["kindergarten"], "high", URLS.preprimary),
    eligibility_criteria: f(
      [
        "子女就讀參加「免費優質幼稚園教育計劃」/ 相關計劃的幼稚園或幼兒中心",
        "家庭通過入息審查",
        "可獲全免或部分減免學費",
      ],
      "medium",
      URLS.preprimary,
      true
    ),
    means_test_requirement: f(
      "須通過家庭入息審查；入息上限及減免比例每學年公布，需人手核實。",
      "medium",
      URLS.preprimary,
      true
    ),
    residency_requirement: f("一般須為香港居民。", "medium", URLS.preprimary, true),
    student_status_requirement: f(
      "子女須就讀合資格的幼稚園 / 幼兒中心。",
      "high",
      URLS.preprimary
    ),
    household_requirement: f("以家庭為單位審查。", "medium", URLS.preprimary, true),
    application_period: f("每學年指定期間；需人手核實。", "low", URLS.preprimary, true),
    application_method: f(
      "填寫學前學生資助申請表，連同入息證明遞交學生資助處。",
      "medium",
      URLS.preprimary,
      true
    ),
    required_documents: f(
      ["申請人身份證明", "子女出生證明 / 身份證明", "住址證明", "入息證明", "銀行戶口資料"],
      "medium",
      URLS.forms,
      true
    ),
    submission_channel: f("經 SFO E-link 或郵寄／親身遞交。", "medium", URLS.elink, true),
    approval_timeline: f("以通知書為準。", "low", URLS.preprimary, true),
    payment_arrangement: f(
      "學費減免一般直接調整應繳學費 / 透過學校處理。",
      "medium",
      URLS.preprimary,
      true
    ),
    enquiry_phone: f(COMMON_PHONE, "medium", URLS.sfo, true),
    enquiry_email: f("請參考官方聯絡頁。", "low", URLS.sfo, true),
    official_page_url: f(URLS.preprimary, "medium", URLS.preprimary, true),
    form_url: f(URLS.forms, "medium", URLS.forms, true),
    notes: f(
      ["減免比例（全免 / 半免）及上限每學年不同，需核實。"],
      "low",
      URLS.preprimary,
      true
    ),
    child_friendly: {
      what_helps: "呢個資助幫你細路俾少啲或者唔使俾幼稚園學費。",
      who_can_apply: "有細路讀緊幼稚園或幼兒中心、收入唔多嘅家庭。",
      what_to_prepare: "身份證、出世紙、住址證明同收入證明。",
      how_to_apply: "填學前學生資助申請表，連文件交俾學生資助處。",
      after_apply: "政府會睇你屋企收入，再決定減幾多。",
      when_money: "批咗之後會直接減你要俾嘅學費。",
      who_to_ask: "可以打俾學生資助處或問幼稚園。",
    },
    rule_set: {
      scheme_code: "KCFRS",
      rules: [
        rule("education_level", "in", ["kindergarten"], URLS.preprimary, "high"),
        rule("means_test_required", "equals", true, URLS.preprimary, "high"),
        rule("is_hong_kong_resident", "equals", true, URLS.preprimary, "medium", true),
      ],
      manual_review_notes: ["入息上限、減免比例需每年核實。"],
    },
    last_checked_at: LAST_CHECKED,
  },

  // ---------------- 5. 幼稚園學生就學開支津貼 KGSE ----------------
  {
    scheme_code: "KGSE",
    name_zh: f("幼稚園學生就學開支津貼", "high", URLS.preprimary),
    name_en: f(
      "Grant for School-related Expenses for Kindergarten Students",
      "high",
      URLS.preprimary
    ),
    responsible_department: f(COMMON_DEPT, "high", URLS.sfo),
    target_applicants: f(
      "獲幼稚園及幼兒中心學費減免（全免或半免）的合資格幼稚園學生家庭",
      "medium",
      URLS.preprimary,
      true
    ),
    education_level: f(["kindergarten"], "high", URLS.preprimary),
    eligibility_criteria: f(
      [
        "通常須先符合 / 已獲學費減免計劃資助",
        "用以補助書簿、文具等就學相關開支",
        "一般以定額發放",
      ],
      "medium",
      URLS.preprimary,
      true
    ),
    means_test_requirement: f(
      "與學費減免計劃同一入息審查掛鈎；金額每學年公布，需人手核實。",
      "medium",
      URLS.preprimary,
      true
    ),
    residency_requirement: f("一般須為香港居民。", "medium", URLS.preprimary, true),
    student_status_requirement: f(
      "子女須就讀合資格幼稚園 / 幼兒中心。",
      "high",
      URLS.preprimary
    ),
    household_requirement: f("以家庭為單位。", "medium", URLS.preprimary, true),
    application_period: f("通常隨學費減免一併申請；需人手核實。", "low", URLS.preprimary, true),
    application_method: f(
      "一般隨學前學生資助申請一併處理，毋須另交申請。",
      "medium",
      URLS.preprimary,
      true
    ),
    required_documents: f(
      ["與學費減免計劃相同的文件"],
      "medium",
      URLS.forms,
      true
    ),
    submission_channel: f("經 SFO E-link 或綜合學前申請遞交。", "medium", URLS.elink, true),
    approval_timeline: f("以通知書為準。", "low", URLS.preprimary, true),
    payment_arrangement: f("一般以定額自動轉賬發放。", "medium", URLS.preprimary, true),
    enquiry_phone: f(COMMON_PHONE, "medium", URLS.sfo, true),
    enquiry_email: f("請參考官方聯絡頁。", "low", URLS.sfo, true),
    official_page_url: f(URLS.preprimary, "medium", URLS.preprimary, true),
    form_url: f(URLS.forms, "medium", URLS.forms, true),
    notes: f(
      ["與學費減免計劃的資格掛鈎及定額金額需核實。"],
      "low",
      URLS.preprimary,
      true
    ),
    child_friendly: {
      what_helps: "呢個資助幫你買幼稚園嘅書同文具。",
      who_can_apply: "已經攞到幼稚園學費減免嘅家庭。",
      what_to_prepare: "同申請學費減免一樣嘅文件。",
      how_to_apply: "通常申請學費減免時會一齊計，唔使另外交。",
      after_apply: "政府會連同學費減免一齊批。",
      when_money: "批咗會發一筆定額津貼。",
      who_to_ask: "可以打俾學生資助處或問幼稚園。",
    },
    rule_set: {
      scheme_code: "KGSE",
      rules: [
        rule("education_level", "in", ["kindergarten"], URLS.preprimary, "high"),
        rule("means_test_required", "equals", true, URLS.preprimary, "high"),
        rule("linked_to_fee_remission", "equals", true, URLS.preprimary, "medium", true),
      ],
      manual_review_notes: ["與 KCFRS 的資格掛鈎關係及金額需核實。"],
    },
    last_checked_at: LAST_CHECKED,
  },

  // ---------------- 6. 在職家庭津貼 WFA ----------------
  {
    scheme_code: "WFA",
    name_zh: f("在職家庭津貼計劃", "high", URLS.wfa),
    name_en: f("Working Family Allowance Scheme", "high", URLS.wfa),
    responsible_department: f(
      "在職家庭津貼辦事處（隸屬工作及學生資助辦事處 WFSFAA）",
      "high",
      URLS.wfa
    ),
    target_applicants: f(
      "有成員在職、收入及資產低於上限、並非領取綜援的家庭；設有兒童津貼補助在學子女",
      "medium",
      URLS.wfa,
      true
    ),
    education_level: f(
      ["kindergarten", "primary", "secondary", "tertiary"],
      "medium",
      URLS.wfa,
      true
    ),
    eligibility_criteria: f(
      [
        "住戶須有成員達到每月工時要求",
        "住戶收入及資產不超過指定上限",
        "並非正領取綜援",
        "兒童津貼按合資格兒童人數發放",
      ],
      "medium",
      URLS.wfa,
      true
    ),
    means_test_requirement: f(
      "設入息及資產審查；工時要求、入息上限及津貼額每年公布，需人手核實。",
      "medium",
      URLS.wfa,
      true
    ),
    residency_requirement: f(
      "住戶成員一般須為香港居民並通常居於香港。",
      "medium",
      URLS.wfa,
      true
    ),
    student_status_requirement: f(
      "兒童津貼適用於 15 歲以下、或 15 歲或以上仍在學的合資格兒童（確實年齡 / 在學定義需核實）。",
      "medium",
      URLS.wfa,
      true
    ),
    household_requirement: f("以住戶為單位申請及審查。", "high", URLS.wfa),
    application_period: f(
      "可全年申請，每次申請涵蓋指定的申領月份；需人手核實。",
      "medium",
      URLS.wfa,
      true
    ),
    application_method: f(
      "填寫在職家庭津貼申請表，連同入息、工時及住址證明遞交在職家庭津貼辦事處。",
      "medium",
      URLS.wfa,
      true
    ),
    required_documents: f(
      [
        "申請人及住戶成員身份證明",
        "入息證明",
        "工時證明（如糧單 / 僱主證明）",
        "住址證明",
        "在學子女學生證明",
        "銀行戶口資料",
      ],
      "medium",
      URLS.wfa,
      true
    ),
    submission_channel: f(
      "可郵寄、親身或經電子途徑遞交（以官方公布為準）。",
      "medium",
      URLS.wfa,
      true
    ),
    approval_timeline: f("以審批通知書為準。", "low", URLS.wfa, true),
    payment_arrangement: f(
      "獲批津貼一般以自動轉賬一筆過或分期存入戶口。",
      "medium",
      URLS.wfa,
      true
    ),
    enquiry_phone: f("2558 3000", "medium", URLS.wfa, true),
    enquiry_email: f("請參考在職家庭津貼辦事處官方聯絡頁。", "low", URLS.wfa, true),
    official_page_url: f(URLS.wfa, "high", URLS.wfa),
    form_url: f(URLS.forms, "medium", URLS.forms, true),
    notes: f(
      [
        "綜援與在職家庭津貼不可同時領取。",
        "工時門檻、入息上限、全額/基本/中額分級及津貼額每年更新，需核實。",
      ],
      "medium",
      URLS.wfa,
      true
    ),
    child_friendly: {
      what_helps: "呢個資助幫有人返工但收入唔多嘅家庭，仲有錢幫補在學嘅小朋友。",
      who_can_apply: "屋企有人返工、收入唔高、又無攞綜援嘅家庭。",
      what_to_prepare: "身份證、入息證明、返工時數證明同住址證明。",
      how_to_apply: "填在職家庭津貼申請表，連文件交去津貼辦事處。",
      after_apply: "政府會睇你返工時數同屋企收入。",
      when_money: "批咗會過數入你嘅銀行戶口。",
      who_to_ask: "可以打俾在職家庭津貼辦事處查詢。",
    },
    rule_set: {
      scheme_code: "WFA",
      rules: [
        rule("means_test_required", "equals", true, URLS.wfa, "high"),
        rule("on_cssa", "equals", false, URLS.wfa, "high"),
        rule("has_working_member", "equals", true, URLS.wfa, "medium", true),
        rule("is_hong_kong_resident", "equals", true, URLS.wfa, "medium", true),
      ],
      manual_review_notes: [
        "工時要求、入息／資產上限、津貼分級及金額需每年核實。",
        "兒童津貼合資格年齡 / 在學定義需核實。",
      ],
    },
    last_checked_at: LAST_CHECKED,
  },

  // ---------------- 7. 綜援學生相關支援 CSSA ----------------
  {
    scheme_code: "CSSA",
    name_zh: f("綜合社會保障援助（綜援）學生相關支援", "high", URLS.swdCssa),
    name_en: f(
      "Comprehensive Social Security Assistance (Student-related support)",
      "high",
      URLS.swdCssa
    ),
    responsible_department: f("社會福利署（SWD）", "high", URLS.swdCssa),
    target_applicants: f(
      "正領取綜援、有在學子女的家庭",
      "high",
      URLS.swdCssa
    ),
    education_level: f(
      ["kindergarten", "primary", "secondary", "tertiary"],
      "medium",
      URLS.swdCssa,
      true
    ),
    eligibility_criteria: f(
      [
        "家庭正領取綜援",
        "有在學子女",
        "學校相關開支（如書簿、車船、就學津貼）一般隨綜援個案以特別津貼形式發放",
      ],
      "medium",
      URLS.swdCssa,
      true
    ),
    means_test_requirement: f(
      "綜援本身設入息及資產審查；學生相關特別津貼隨個案發放，金額每年公布，需核實。",
      "medium",
      URLS.swdCssa,
      true
    ),
    residency_requirement: f(
      "須符合綜援的居港年期等資格要求（以社署公布為準）。",
      "medium",
      URLS.swdCssa,
      true
    ),
    student_status_requirement: f(
      "子女須為在學學生。",
      "high",
      URLS.swdCssa
    ),
    household_requirement: f("以綜援住戶為單位。", "high", URLS.swdCssa),
    application_period: f("全年接受綜援申請。", "medium", URLS.swdCssa, true),
    application_method: f(
      "向社會福利署申請綜援；學生相關津貼由社署按個案發放，毋須另向學生資助處申請。",
      "medium",
      URLS.swdCssa,
      true
    ),
    required_documents: f(
      ["申請人及家庭成員身份證明", "在學子女學生證明", "綜援相關文件", "銀行戶口資料"],
      "medium",
      URLS.swdCssa,
      true
    ),
    submission_channel: f(
      "經社會福利署各區社會保障辦事處辦理。",
      "medium",
      URLS.swdCssa,
      true
    ),
    approval_timeline: f("以社署通知為準。", "low", URLS.swdCssa, true),
    payment_arrangement: f(
      "學生相關特別津貼隨綜援按月／按需發放。",
      "medium",
      URLS.swdCssa,
      true
    ),
    enquiry_phone: f("2343 2255", "medium", URLS.swdCssa, true),
    enquiry_email: f("請參考社會福利署官方聯絡頁。", "low", URLS.swdCssa, true),
    official_page_url: f(URLS.swdCssa, "high", URLS.swdCssa),
    form_url: f(URLS.swdCssa, "low", URLS.swdCssa, true),
    notes: f(
      [
        "本項由社會福利署（非 WFSFAA）負責，作為相關支援列出。",
        "綜援家庭一般毋須另行申請書簿等學生資助計劃津貼，以免重複。",
      ],
      "medium",
      URLS.swdCssa,
      true
    ),
    child_friendly: {
      what_helps: "如果你屋企攞緊綜援，讀書嘅開支通常已經包喺綜援度。",
      who_can_apply: "正領緊綜援、有小朋友讀書嘅家庭。",
      what_to_prepare: "綜援文件、學生證明同身份證。",
      how_to_apply: "向社會福利署講你有在學子女就得，唔使另外申請書簿津貼。",
      after_apply: "社署會喺你嘅綜援個案加返學生津貼。",
      when_money: "津貼會隨綜援一齊發放。",
      who_to_ask: "可以打俾社會福利署或問你個案嘅職員。",
    },
    rule_set: {
      scheme_code: "CSSA",
      rules: [
        rule("on_cssa", "equals", true, URLS.swdCssa, "high"),
        rule("has_student", "equals", true, URLS.swdCssa, "high"),
      ],
      manual_review_notes: [
        "由社署負責；學生相關特別津貼項目及金額需以社署公布核實。",
      ],
    },
    last_checked_at: LAST_CHECKED,
  },
];
