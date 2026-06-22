import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToScheme, schemeToRow } from "@/lib/scheme-mapper";

// PUT：更新 scheme
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    .update(schemeToRow(body))
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ scheme: rowToScheme(data) });
}

// DELETE：刪除 scheme
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const { error } = await admin
    .from("subsidy_schemes")
    .delete()
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
