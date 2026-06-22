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
  householdSize: 3,
  studentCount: 1,
  gradeLevels: [],
  onCssa: false,
  incomeBand: "10k_20k",
  singleParent: false,
  newArrival: false,
  hasSen: false,
  needTravelSupport: false,
  needInternetSupport: false,
};
