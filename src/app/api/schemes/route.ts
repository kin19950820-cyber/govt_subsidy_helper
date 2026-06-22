import { NextResponse } from "next/server";
import { getActiveSchemes } from "@/lib/schemes";

// 公開 API：回傳所有 active 津貼（client 端配對 / 文件清單會用到）。
export async function GET() {
  const schemes = await getActiveSchemes();
  return NextResponse.json({ schemes });
}
