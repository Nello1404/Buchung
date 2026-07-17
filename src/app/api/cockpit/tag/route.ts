import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getTagDetail } from "@/lib/cockpit";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const datum = new URL(request.url).searchParams.get("datum");
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    return NextResponse.json({ error: "Ungültiges Datum." }, { status: 400 });
  }
  const detail = await getTagDetail(datum);
  return NextResponse.json(detail);
}
