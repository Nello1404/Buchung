import { STATUS_LABEL } from "@/lib/format";

const farbe: Record<string, string> = {
  ANGEFRAGT: "border-line text-muted",
  BEZAHLT: "border-[rgba(111,174,125,0.4)] text-[var(--success)]",
  UEBERGEBEN: "border-line-gold text-gold",
  GEPARKT: "border-line-gold text-gold",
  BEREITGESTELLT: "border-line-gold text-gold",
  ABGESCHLOSSEN: "border-line text-muted",
  STORNIERT: "border-[rgba(217,138,128,0.4)] text-[var(--danger)]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${farbe[status] ?? "border-line text-muted"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
