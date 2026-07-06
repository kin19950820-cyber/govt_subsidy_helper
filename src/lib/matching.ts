import {
  AgeBand,
  AssetBand,
  FinderAnswers,
  IncomeBand,
  MatchLevel,
  MatchResult,
  SubsidyScheme,
} from "./types";

const INCOME_ORDER: IncomeBand[] = [
  "below_10k",
  "10k_20k",
  "20k_30k",
  "30k_40k",
  "above_40k",
];
const AGE_ORDER: AgeBand[] = ["below_60", "60_64", "65_69", "70_plus"];
const ASSET_ORDER: AssetBand[] = ["low", "medium", "high"];

const incomeRank = (b: IncomeBand) => INCOME_ORDER.indexOf(b);
const ageRank = (b: AgeBand) => AGE_ORDER.indexOf(b);
const assetRank = (b: AssetBand) => ASSET_ORDER.indexOf(b);

// 核心配對：用簡單評分制，再轉成 4 個信心等級。
// 不會聲稱保證合資格 —— 等級只係參考。
// 只會配對同用戶所選群組相關嘅津貼。
export function matchSchemes(
  answers: FinderAnswers,
  schemes: SubsidyScheme[]
): MatchResult[] {
  const results: MatchResult[] = schemes
    .filter((s) => s.active && s.audience.includes(answers.group))
    .map((scheme) => evaluateScheme(answers, scheme));

  const levelWeight: Record<MatchLevel, number> = {
    very_likely: 3,
    likely: 2,
    consult: 1,
    unlikely: 0,
  };

  return results.sort((a, b) => levelWeight[b.level] - levelWeight[a.level]);
}

function evaluateScheme(
  answers: FinderAnswers,
  scheme: SubsidyScheme
): MatchResult {
  const rule = scheme.rule;
  const reasons: string[] = [];
  let score = 1; // 已屬所選群組，基本分
  let hardFail = false;

  // ---- 綜援 ----
  if (rule.requiresCssa) {
    if (answers.onCssa) {
      score += 3;
      reasons.push("你正領取綜援，呢個支援同你有關。");
    } else {
      hardFail = true;
      reasons.push("呢項只適合正領取綜援嘅家庭。");
    }
  }
  if (rule.excludeIfCssa && answers.onCssa) {
    hardFail = true;
    reasons.push("你已領取綜援，通常唔可以同時申請呢項。");
  }

  // ---- 香港居民 ----
  if (!answers.isHkResident) {
    reasons.push("大部分政府津貼要求申請人為香港居民，請留意居港規定。");
  }

  // ---- 年齡（長者相關）----
  if (rule.requiresElderly || rule.minAgeBand) {
    const need = rule.minAgeBand ?? "65_69";
    if (ageRank(answers.ageBand) >= ageRank(need)) {
      score += 3;
      reasons.push("你嘅年齡符合呢項津貼嘅要求。");
    } else {
      hardFail = true;
      reasons.push("你嘅年齡未到呢項津貼嘅要求。");
    }
  }

  // ---- 殘疾 ----
  if (rule.requiresDisability) {
    if (answers.hasDisability) {
      score += 3;
      reasons.push("你有殘疾 / 長期病，呢項津貼同你有關。");
    } else {
      hardFail = true;
      reasons.push("呢項只適合經評估為殘疾嘅人士。");
    }
  }

  // ---- 年級（學生相關）----
  if (rule.gradeLevels && rule.gradeLevels.length > 0) {
    const overlap = answers.gradeLevels.some((g) =>
      rule.gradeLevels!.includes(g)
    );
    if (overlap) {
      score += 2;
      reasons.push("你有就讀適用年級嘅學生。");
    } else if (answers.gradeLevels.length > 0) {
      hardFail = true;
      reasons.push("你嘅學生年級唔啱呢個計劃。");
    }
  }

  // ---- 入息審查 ----
  if (rule.meansTested !== false && rule.maxIncomeBand) {
    if (incomeRank(answers.incomeBand) <= incomeRank(rule.maxIncomeBand)) {
      score += 2;
      reasons.push("你嘅收入喺審查範圍內。");
    } else {
      score -= 2;
      reasons.push("你嘅收入可能超出上限，未必合資格。");
    }
  }
  if (rule.meansTested === false) {
    reasons.push("呢項毋須入息審查。");
  }

  // ---- 資產審查 ----
  if (rule.maxAssetBand) {
    if (assetRank(answers.assetBand) <= assetRank(rule.maxAssetBand)) {
      score += 1;
      reasons.push("你嘅資產喺審查範圍內。");
    } else {
      score -= 2;
      reasons.push("你嘅資產可能超出上限，未必合資格。");
    }
  }

  // ---- 交通 / 上網 / 醫療 需求 ----
  if (rule.travelRelated) {
    if (answers.needTravelSupport) {
      score += 2;
      reasons.push("你需要交通費支援。");
    } else {
      score -= 1;
    }
  }
  if (rule.internetRelated) {
    if (answers.needInternetSupport) {
      score += 2;
      reasons.push("你需要上網費支援。");
    } else {
      score -= 1;
    }
  }
  if (rule.medicalRelated) {
    if (answers.needMedicalSupport) {
      score += 2;
      reasons.push("你需要醫療費支援。");
    }
  }

  // ---- 加分條件 ----
  if (rule.boostSingleParent && answers.singleParent) {
    score += 1;
    reasons.push("單親家庭通常較優先處理。");
  }
  if (rule.boostNewArrival && answers.newArrival) {
    score += 1;
    reasons.push("新來港家庭可獲額外支援。");
  }
  if (rule.boostSen && answers.hasSen) {
    score += 1;
    reasons.push("有特殊教育需要嘅學生可獲額外支援。");
  }
  if (rule.boostLivingAlone && answers.livingAlone) {
    score += 1;
    reasons.push("獨居長者通常較優先處理。");
  }

  const level = toLevel(score, hardFail, answers);
  return { scheme, level, reasons };
}

function toLevel(
  score: number,
  hardFail: boolean,
  answers: FinderAnswers
): MatchLevel {
  // 背景較複雜，建議搵社工 / 相關部門確認
  const complex =
    answers.hasSen ||
    answers.newArrival ||
    answers.singleParent ||
    answers.hasDisability ||
    answers.livingAlone;

  if (hardFail) return complex ? "consult" : "unlikely";
  if (score >= 6) return "very_likely";
  if (score >= 4) return "likely";
  if (score >= 2) return complex ? "consult" : "likely";
  return complex ? "consult" : "unlikely";
}
