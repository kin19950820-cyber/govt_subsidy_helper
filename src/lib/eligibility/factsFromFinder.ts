import { FinderAnswers } from "../types";
import { ApplicantFacts } from "./facts";

// 向後相容：將現有 FinderAnswers 轉成 ApplicantFacts。
// 令舊 sessionStorage 答案可直接餵畀新規則引擎。
export function factsFromFinder(a: Partial<FinderAnswers>): ApplicantFacts {
  const f: ApplicantFacts = {};
  if (a.isHkResident !== undefined) f.hkResident = a.isHkResident;
  if (a.householdSize !== undefined) f.householdSize = a.householdSize;
  if (a.onCssa !== undefined) f.onCssa = a.onCssa;
  if (a.incomeBand !== undefined) f.incomeBand = a.incomeBand;
  if (a.newArrival !== undefined) f.newArrival = a.newArrival;
  if (a.singleParent !== undefined) f.singleParent = a.singleParent;
  if (a.ageBand !== undefined) f.ageBand = a.ageBand;
  if (a.assetBand !== undefined) f.assetBand = a.assetBand;
  if (a.hasDisability !== undefined) f.hasDisability = a.hasDisability;
  if (a.needMedicalSupport !== undefined) f.needsMedicalSupport = a.needMedicalSupport;
  if (a.needTravelSupport !== undefined) f.needsTravelSupport = a.needTravelSupport;
  if (a.needInternetSupport !== undefined) f.needsInternetSupport = a.needInternetSupport;
  if (a.studentCount !== undefined) f.isStudent = a.studentCount > 0;
  if (a.gradeLevels && a.gradeLevels.length > 0) f.educationLevel = a.gradeLevels[0];
  if (a.livingAlone) f.livingArrangement = "alone";
  if (a.hasWorkingMember !== undefined)
    f.employmentStatus = a.hasWorkingMember ? "employed" : undefined;
  return f;
}
