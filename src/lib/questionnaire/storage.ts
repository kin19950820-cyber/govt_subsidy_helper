"use client";

import { ApplicantFacts } from "../eligibility/facts";

// 動態問卷狀態：可儲存 / 續答 / 修改。
// 用獨立 key，唔影響舊 finder-storage（向後相容）。
const KEY = "hk_finder_v2";

export interface FinderState {
  facts: ApplicantFacts;
  answered: string[]; // 已處理（含跳過 / 唔知）嘅 fact key
  order: string[]; // 作答次序（供「上一題」）
}

export const EMPTY_STATE: FinderState = { facts: {}, answered: [], order: [] };

export function saveState(s: FinderState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

export function loadState(): FinderState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...(JSON.parse(raw) as FinderState) };
  } catch {
    return EMPTY_STATE;
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
