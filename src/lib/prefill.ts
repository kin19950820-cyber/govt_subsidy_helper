import { FullProfile } from "./profile-store";
import { GRADE_LABELS, INCOME_LABELS, SubsidyScheme } from "./types";

export interface PrefillField {
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
}

// 將 Profile 對應到通用申請表欄位。
// 之後可按 scheme 加更多專屬欄位。
export function buildPrefillFields(
  scheme: SubsidyScheme,
  data: FullProfile
): PrefillField[] {
  const p = data.profile;
  const firstStudent = data.students[0];

  const fields: PrefillField[] = [
    { fieldKey: "applicant_name", fieldLabel: "申請人姓名", fieldValue: p.applicantName ?? "" },
    { fieldKey: "id_number", fieldLabel: "身份證號碼（部分）", fieldValue: p.idNumberPartial ?? "" },
    { fieldKey: "phone", fieldLabel: "聯絡電話", fieldValue: p.phone ?? "" },
    { fieldKey: "address", fieldLabel: "通訊地址", fieldValue: p.address ?? "" },
    {
      fieldKey: "household_size",
      fieldLabel: "家庭人數",
      fieldValue: String(data.members.length + 1 + data.students.length || ""),
    },
    {
      fieldKey: "student_count",
      fieldLabel: "學生人數",
      fieldValue: String(data.students.length || ""),
    },
    {
      fieldKey: "student_name",
      fieldLabel: "學生姓名",
      fieldValue: firstStudent?.name ?? "",
    },
    {
      fieldKey: "student_grade",
      fieldLabel: "就讀年級",
      fieldValue: firstStudent ? GRADE_LABELS[firstStudent.gradeLevel] : "",
    },
    {
      fieldKey: "school_name",
      fieldLabel: "學校名稱",
      fieldValue: firstStudent?.schoolName ?? p.schoolName ?? "",
    },
    {
      fieldKey: "income_band",
      fieldLabel: "家庭每月收入",
      fieldValue: p.incomeBand ? INCOME_LABELS[p.incomeBand] : "",
    },
    {
      fieldKey: "bank_account",
      fieldLabel: "銀行戶口資料",
      fieldValue: p.bankAccount ?? "",
    },
  ];

  return fields;
}
