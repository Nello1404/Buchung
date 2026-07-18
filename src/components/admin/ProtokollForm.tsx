"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HANDOVER_PHASEN, TANKSTUFEN, type HandoverPhaseCode } from "@/lib/handover";
import { SignaturePad } from "@/components/admin/SignaturePad";

export function ProtokollForm({
  bookingId,
  blobKonfiguriert,
  standardPhase,
}: {
  bookingId: string;
  blobKonfiguriert: boolean;
  standardPhase: HandoverPhaseCode;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<HandoverPhaseCode>(standardPhase);
  const [fahrer, setFahrer] = useState("");
  const [kmStand, setKmStand] = useState("");
  const [tankstand, setTankstand] = useState("");
  const [bemerkung, setBemerkung] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [unterschrift, setUnterschrift] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setLaeuft(true);
    setFehler(null);
    try {
      const form = new FormData();
      form.append("bookingId", bookingId);
      form.append("phase", phase);
      form.append("fahrer", fahrer.trim());
      form.append("kmStand", kmStand.trim());
      form.append("tankstand", tankstand);
      form.append("bemerkung", bemerkung.trim());
      form.append("unterschrift", unterschrift);
      fotos.forEach((f) => form.append("fotos", f));

      const res = await fetch("/api/admin/protokoll", { method: "POST", body: form });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(d.error ?? "Speichern fehlgeschlagen.");
        setLaeuft(false);
        return;
      }
      // Formular zurücksetzen und Seite (Server-Komponente) neu laden.
      setFahrer("");
      setKmStand("");
      setTankstand("");
      setBemerkung("");
      setFotos([]);
      setUnterschrift("");
      router.refresh();
    } catch {
      setFehler("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <form onSubmit={absenden} className="card space-y-4 p-6">
      <h2 className="font-medium text-ink">Neues Protokoll erfassen</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Zeitpunkt</span>
          <select className="field" value={phase} onChange={(e) => setPhase(e.target.value as HandoverPhaseCode)}>
            {HANDOVER_PHASEN.map((p) => (
              <option key={p.code} value={p.code}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Fahrer *</span>
          <input className="field" value={fahrer} onChange={(e) => setFahrer(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Kilometerstand</span>
          <input type="number" min="0" inputMode="numeric" className="field" value={kmStand} onChange={(e) => setKmStand(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Tank-/Ladestand</span>
          <select className="field" value={tankstand} onChange={(e) => setTankstand(e.target.value)}>
            <option value="">– bitte wählen –</option>
            {TANKSTUFEN.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Zustand / Bemerkungen</span>
        <textarea
          className="field min-h-24"
          placeholder="Vorhandene Schäden, Kratzer, Besonderheiten …"
          value={bemerkung}
          onChange={(e) => setBemerkung(e.target.value)}
        />
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">Fotos</span>
        {blobKonfiguriert ? (
          <>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              capture="environment"
              onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line-gold file:bg-transparent file:px-4 file:py-1.5 file:text-sm file:text-gold"
            />
            {fotos.length > 0 && <p className="mt-1 text-xs text-subtle">{fotos.length} Foto(s) ausgewählt.</p>}
          </>
        ) : (
          <p className="text-sm text-subtle">Foto-Upload benötigt einen eingerichteten Blob-Speicher (BLOB_READ_WRITE_TOKEN).</p>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">Unterschrift Kunde</span>
        {blobKonfiguriert ? (
          <SignaturePad onChange={setUnterschrift} />
        ) : (
          <p className="text-sm text-subtle">Unterschrift benötigt einen eingerichteten Blob-Speicher.</p>
        )}
      </div>

      {fehler && <p className="text-sm text-[var(--danger)]">{fehler}</p>}

      <button type="submit" disabled={laeuft || fahrer.trim().length < 2} className="btn-gold">
        {laeuft ? "Wird gespeichert …" : "Protokoll speichern"}
      </button>
    </form>
  );
}
