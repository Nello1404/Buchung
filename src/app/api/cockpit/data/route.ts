import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getCockpitData } from "@/lib/cockpit";

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const data = await getCockpitData();
  return NextResponse.json(data);
}
