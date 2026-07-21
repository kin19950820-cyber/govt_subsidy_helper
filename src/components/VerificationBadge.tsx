import {
  VERIFICATION_LABELS,
  VerificationState,
  verificationState,
} from "@/lib/benefits/status";
import { BenefitStatus } from "@/lib/types";

const STYLE: Record<VerificationState, string> = {
  verified: "border-green-300 bg-green-50 text-green-800",
  needs_review: "border-amber-300 bg-amber-50 text-amber-800",
  stale: "border-orange-300 bg-orange-50 text-orange-800",
  inactive: "border-stone-300 bg-stone-100 text-stone-600",
};

const ICON: Record<VerificationState, string> = {
  verified: "✅",
  needs_review: "⚠️",
  stale: "🕓",
  inactive: "⏸️",
};

// 顯示核實狀態。detail=true 時另顯示最後核實日期。
export default function VerificationBadge({
  status,
  lastVerified,
  active = true,
  detail = false,
}: {
  status?: BenefitStatus;
  lastVerified?: string | null;
  active?: boolean;
  detail?: boolean;
}) {
  const state = verificationState({ status, lastVerified, active });
  return (
    <span
      className={`chip border ${STYLE[state]}`}
      title="核實狀態以官方最新資料為準"
    >
      {ICON[state]} {VERIFICATION_LABELS[state]}
      {detail && lastVerified ? ` · 最後核實 ${lastVerified}` : ""}
    </span>
  );
}
