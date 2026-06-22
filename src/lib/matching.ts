import {
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

function incomeRank(band: IncomeBand): number {
  return INCOME_ORDER.indexOf(band);
}

// 核心配對：用簡單評分制，再轉成 4 個信心等級。
// 不會聲稱保證合資格 —— 等級只係參考。
export function matchSchemes(
  answers: FinderAnswers,
  schemes: SubsidyScheme[]
): MatchResult[] {
  const results: MatchResult[] = schemes
    .filter((s) => s.active)
    .map((scheme) => evaluateScheme(answers, scheme));

  // 排序：信心高在前
  const levelWeight: Record<MatchLevel, number> = {
    very_likely: 3,
    likely: 2,
    consult: 1,
    unlikely: 0,
  };

  return results.sort(
    (a, b) => levelWeight[b.level] - levelWeight[a.level]
  );
}

function evaluateScheme(
  answers: FinderAnswers,
  scheme: SubsidyScheme
): MatchResult {
  const rule = scheme.rule;
  const reasons: string[] = [];
  let score = 0;
  let hardFail = false;

  // 1. 綜援相關
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
    reasons.push("你已領取綜援，呢個計劃通常唔可以同時申請。");
  }

  // 2. 年級配對
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

  // 3. 收入審查
  if (rule.maxIncomeBand) {
    if (incomeRank(answers.incomeBand) <= incomeRank(rule.maxIncomeBand)) {
      score += 2;
      reasons.push("你嘅家庭收入喺審查範圍內。");
    } else {
      score -= 2;
      reasons.push("你嘅家庭收入可能超出上限，未必合資格。");
    }
  }

  // 4. 交通 / 上網 需求對應
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

  // 5. 加分條件
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

  // 學生人數基本檢查
  if (answers.studentCount <= 0 && !rule.requiresCssa) {
    reasons.push("你話冇在學學生，建議再確認。");
  }

  const level = toLevel(score, hardFail, answers);
  return { scheme, level, reasons };
}

function toLevel(
  score: number,
  hardFail: boolean,
  answers: FinderAnswers
): MatchLevel {
  // 特殊情況：複雜家庭背景，建議搵社工
  const complex = answers.hasSen || answers.newArrival || answers.singleParent;

  if (hardFail) {
    return complex ? "consult" : "unlikely";
  }
  if (score >= 5) return "very_likely";
  if (score >= 3) return "likely";
  if (score >= 1) return complex ? "consult" : "unlikely";
  return complex ? "consult" : "unlikely";
}
