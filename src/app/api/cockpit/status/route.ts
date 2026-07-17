import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { setzeStatus } from "@/lib/cockpit";

const schema = z.object({
  bookingId: z.string().min(1),
  aktion: z.enum(["ankunft", "abholung"]),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const result = await setzeStatus(parsed.data.bookingId, parsed.data.aktion);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
