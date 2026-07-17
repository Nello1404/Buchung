import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getWarnungen } from "@/lib/warnings";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  return NextResponse.json({ warnungen: await getWarnungen() });
}
