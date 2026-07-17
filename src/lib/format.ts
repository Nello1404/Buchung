const formatEUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function centZuEUR(cent: number): string {
  return formatEUR.format(cent / 100);
}

export const formatDatumZeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDatum = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
});

export const formatUhrzeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  timeStyle: "short",
});

export const STATUS_LABEL: Record<string, string> = {
  ANGEFRAGT: "Angefragt",
  BEZAHLT: "Bezahlt",
  UEBERGEBEN: "Auto übernommen",
  GEPARKT: "Geparkt",
  BEREITGESTELLT: "Bereitgestellt",
  ABGESCHLOSSEN: "Abgeschlossen",
  STORNIERT: "Storniert",
};
