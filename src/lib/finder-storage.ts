import { FinderAnswers } from "./types";

const KEY = "hk_subsidy_finder_answers";

export function saveAnswers(answers: FinderAnswers) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(answers));
}

export function loadAnswers(): FinderAnswers | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FinderAnswers;
  } catch {
    return null;
  }
}

export const DEFAULT_ANSWERS: FinderAnswers = {
  group: "student",
  householdSize: 3,
  onCssa: false,
  incomeBand: "10k_20k",
  newArrival: false,
  isHkResident: true,
  studentCount: 1,
  gradeLevels: [],
  singleParent: false,
  hasSen: false,
  needTravelSupport: false,
  needInternetSupport: false,
  ageBand: "65_69",
  assetBand: "low",
  hasDisability: false,
  livingAlone: false,
  needMedicalSupport: false,
  hasWorkingMember: false,
};
