import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllSchemes } from "@/lib/schemes";
import { rowToScheme, schemeToRow } from "@/lib/scheme-mapper";

// GET：列出全部 schemes（admin）
export async function GET() {
  const schemes = await getAllSchemes();
  const check = await requireAdmin();
  return NextResponse.json({ schemes, demo: check.demo, ok: check.ok });
}

// POST：新增 scheme
export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason ?? "沒有權限" },
      { status: check.demo ? 200 : 403 }
    );
  }
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase 未設定" }, { status: 400 });
  }
  const body = await req.json();
  const { data, error } = await admin
    .from("subsidy_schemes")
    .insert(schemeToRow(body))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ scheme: rowToScheme(data) });
}
