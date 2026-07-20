"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HANDOVER_PHASEN, TANKSTUFEN, type HandoverPhaseCode } from "@/lib/handover";
import { SignaturePad } from "@/components/admin/SignaturePad";

export function ProtokollForm({
  bookingId,
  blobKonfiguriert,
  standardPhase,
  fahrerNamen,
}: {
  bookingId: string;
  blobKonfiguriert: boolean;
  standardPhase: HandoverPhaseCode;
  fahrerNamen: string[];
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
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Neue Aufnahmen an die bestehende Liste anhängen. Bilder werden vorab
  // clientseitig verkleinert – so passen auch mehrere Handy-Fotos zuverlässig in
  // eine Anfrage und der Upload ist deutlich schneller.
  async function fotosHinzufuegen(files: FileList | null) {
    if (!files || files.length === 0) return;
    const verarbeitet = await Promise.all(Array.from(files).map((f) => verkleinereBild(f)));
    setFotos((prev) => {
      const vorhanden = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const neue = verarbeitet.filter((f) => !vorhanden.has(`${f.name}-${f.size}`));
      return [...prev, ...neue];
    });
  }

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
          {fahrerNamen.length > 0 ? (
            <select className="field" value={fahrer} onChange={(e) => setFahrer(e.target.value)} required>
              <option value="">– bitte wählen –</option>
              {fahrerNamen.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <>
              <select className="field" disabled>
                <option>– keine Fahrer hinterlegt –</option>
              </select>
              <span className="mt-1 block text-xs text-[var(--danger)]">
                Bitte zuerst unter „Mitarbeiter“ im Admin mindestens einen Fahrer anlegen (Kennzeichen „Ist Fahrer“).
              </span>
            </>
          )}
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
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => {
                fotosHinzufuegen(e.target.files);
                // Wert zurücksetzen, damit dasselbe Foto direkt erneut ausgewählt werden kann.
                e.target.value = "";
              }}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line-gold file:bg-transparent file:px-4 file:py-1.5 file:text-sm file:text-gold"
            />
            <p className="mt-1.5 text-xs text-subtle">
              Sie können mehrere Fotos aufnehmen oder auswählen – jede Aufnahme wird der Liste
              hinzugefügt. Auf dem Handy erscheint die Kamera-Option automatisch.
            </p>
            {fotos.length > 0 && (
              <>
                <p className="mt-3 text-xs text-subtle">{fotos.length} Foto(s):</p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {fotos.map((f, i) => (
                    <FotoVorschau
                      key={`${f.name}-${f.lastModified}-${i}`}
                      datei={f}
                      onEntfernen={() => setFotos((prev) => prev.filter((_, j) => j !== i))}
                    />
                  ))}
                </div>
              </>
            )}
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

/**
 * Verkleinert ein Bild clientseitig auf max. 1600 px Kantenlänge und komprimiert
 * es als JPEG. Bei Nicht-Bildern oder Fehlern wird die Originaldatei zurückgegeben.
 */
async function verkleinereBild(datei: File, maxKante = 1600, qualitaet = 0.82): Promise<File> {
  if (!datei.type.startsWith("image/")) return datei;
  try {
    const bitmap = await createImageBitmap(datei);
    const skala = Math.min(1, maxKante / Math.max(bitmap.width, bitmap.height));
    const breite = Math.round(bitmap.width * skala);
    const hoehe = Math.round(bitmap.height * skala);

    const canvas = document.createElement("canvas");
    canvas.width = breite;
    canvas.height = hoehe;
    const ctx = canvas.getContext("2d");
    if (!ctx) return datei;
    ctx.drawImage(bitmap, 0, 0, breite, hoehe);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", qualitaet)
    );
    if (!blob) return datei;
    // Nur übernehmen, wenn tatsächlich kleiner als das Original.
    if (blob.size >= datei.size) return datei;

    const name = datei.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return datei;
  }
}

/** Foto-Miniatur mit Entfernen-Button. Kümmert sich selbst um die Object-URL. */
function FotoVorschau({ datei, onEntfernen }: { datei: File; onEntfernen: () => void }) {
  const url = useMemo(() => URL.createObjectURL(datei), [datei]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="group relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={datei.name} className="h-24 w-full rounded-lg border border-line object-cover" />
      <button
        type="button"
        onClick={onEntfernen}
        aria-label="Foto entfernen"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white transition-opacity hover:bg-black/80"
      >
        ×
      </button>
    </div>
  );
}
