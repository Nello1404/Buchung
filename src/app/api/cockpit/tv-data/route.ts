import { NextResponse } from "next/server";
import { hatTvZugang } from "@/lib/auth";
import { getTvData } from "@/lib/cockpit";

export async function GET() {
  if (!(await hatTvZugang())) {
    return NextResponse.json({ error: "Kein Zugang." }, { status: 401 });
  }
  return NextResponse.json(await getTvData());
}
