"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDatumZeit } from "@/lib/format";

type Status = "NEU" | "IN_BEARBEITUNG" | "ERLEDIGT" | "ABGELEHNT";

interface Anfrage {
  id: string;
  name: string;
  email: string;
  telefon: string | null;
  kennzeichen: string | null;
  fahrzeug: string | null;
  wunschtermin: string | null;
  leistungen: string;
  nachricht: string | null;
  status: string;
  createdAt: string;
}

const statusLabel: Record<Status, string> = {
  NEU: "Neu",
  IN_BEARBEITUNG: "In Bearbeitung",
  ERLEDIGT: "Erledigt",
  ABGELEHNT: "Abgelehnt",
};

const statusFarbe: Record<Status, string> = {
  NEU: "text-gold",
  IN_BEARBEITUNG: "text-[var(--info,#5b8def)]",
  ERLEDIGT: "text-[var(--success)]",
  ABGELEHNT: "text-subtle",
};

export function ServiceAnfragenListe({ anfragen }: { anfragen: Anfrage[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setzeStatus(id: string, status: Status) {
    setBusy(id);
    await fetch(`/api/admin/service-anfragen/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  if (anfragen.length === 0) {
    return <p className="mt-8 text-muted">Noch keine Anfragen eingegangen.</p>;
  }

  return (
    <div className="mt-8 space-y-4">
      {anfragen.map((a) => {
        const s = (a.status as Status) in statusLabel ? (a.status as Status) : "NEU";
        return (
          <div key={a.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{a.name}</p>
                <p className="text-sm text-muted">
                  <a href={`mailto:${a.email}`} className="text-gold hover:underline">{a.email}</a>
                  {a.telefon && <> · <a href={`tel:${a.telefon}`} className="hover:underline">{a.telefon}</a></>}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${statusFarbe[s]}`}>{statusLabel[s]}</span>
                <p className="text-xs text-subtle">{formatDatumZeit.format(new Date(a.createdAt))} Uhr</p>
              </div>
            </div>

            <div className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <p><span className="text-subtle">Leistungen:</span> <span className="text-ink">{a.leistungen}</span></p>
              {a.fahrzeug && <p><span className="text-subtle">Fahrzeug:</span> <span className="text-ink">{a.fahrzeug}</span></p>}
              {a.kennzeichen && <p><span className="text-subtle">Kennzeichen:</span> <span className="text-ink">{a.kennzeichen}</span></p>}
              {a.wunschtermin && <p><span className="text-subtle">Wunschtermin:</span> <span className="text-ink">{a.wunschtermin}</span></p>}
            </div>
            {a.nachricht && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[rgba(0,0,0,0.03)] p-3 text-sm text-muted">{a.nachricht}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {(["NEU", "IN_BEARBEITUNG", "ERLEDIGT", "ABGELEHNT"] as Status[]).map((st) => (
                <button
                  key={st}
                  disabled={busy === a.id || s === st}
                  onClick={() => setzeStatus(a.id, st)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    s === st
                      ? "border-line-gold bg-[rgba(200,164,92,0.1)] text-gold"
                      : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {statusLabel[st]}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
