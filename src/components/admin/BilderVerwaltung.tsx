"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BILD_KATEGORIEN } from "@/lib/image-categories";

type Bild = {
  id: string;
  kategorie: string;
  url: string;
  alt: string;
  sortOrder: number;
  active: boolean;
};

export function BilderVerwaltung() {
  const [bilder, setBilder] = useState<Bild[]>([]);
  const [blobOk, setBlobOk] = useState(true);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  const neuLaden = useCallback(async () => {
    const res = await fetch("/api/admin/bilder");
    const d = await res.json();
    if (res.ok) {
      setBilder(d.bilder);
      setBlobOk(d.blobKonfiguriert);
    } else {
      setFehler(d.error ?? "Konnte Bilder nicht laden.");
    }
    setLaden(false);
  }, []);

  useEffect(() => {
    let abbruch = false;
    fetch("/api/admin/bilder")
      .then((r) => r.json())
      .then((d) => {
        if (abbruch) return;
        setBilder(d.bilder ?? []);
        setBlobOk(Boolean(d.blobKonfiguriert));
        setLaden(false);
      })
      .catch(() => {
        if (abbruch) return;
        setFehler("Konnte Bilder nicht laden.");
        setLaden(false);
      });
    return () => {
      abbruch = true;
    };
  }, []);

  if (laden) return <p className="mt-6 text-sm text-muted">Wird geladen …</p>;

  return (
    <div className="mt-8 space-y-12">
      {!blobOk && (
        <div className="card border-line-gold p-4 text-sm text-muted">
          <strong className="text-ink">Bild-Speicher noch nicht eingerichtet.</strong> Lege in Vercel
          einen Blob-Store an und setze die Variable <code className="text-gold">BLOB_READ_WRITE_TOKEN</code>.
          Danach lassen sich hier Bilder hochladen.
        </div>
      )}
      {fehler && <p className="text-sm text-[var(--danger)]">{fehler}</p>}

      {BILD_KATEGORIEN.map((k) => (
        <KategorieBlock
          key={k.code}
          code={k.code}
          label={k.label}
          beschreibung={k.beschreibung}
          bilder={bilder.filter((b) => b.kategorie === k.code)}
          blobOk={blobOk}
          onChange={neuLaden}
        />
      ))}
    </div>
  );
}

function KategorieBlock({
  code,
  label,
  beschreibung,
  bilder,
  blobOk,
  onChange,
}: {
  code: string;
  label: string;
  beschreibung: string;
  bilder: Bild[];
  blobOk: boolean;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function hochladen(datei: File) {
    setUploading(true);
    setFehler(null);
    const form = new FormData();
    form.append("kategorie", code);
    form.append("datei", datei);
    const res = await fetch("/api/admin/bilder", { method: "POST", body: form });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setFehler(d.error ?? "Upload fehlgeschlagen.");
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (res.ok) onChange();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/bilder/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onChange();
  }

  async function loeschen(id: string) {
    if (!confirm("Bild wirklich löschen?")) return;
    await fetch(`/api/admin/bilder/${id}`, { method: "DELETE" });
    onChange();
  }

  async function verschieben(index: number, richtung: -1 | 1) {
    const a = bilder[index];
    const b = bilder[index + richtung];
    if (!a || !b) return;
    await Promise.all([
      fetch(`/api/admin/bilder/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/admin/bilder/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    onChange();
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">{label}</h2>
          <p className="text-sm text-muted">{beschreibung}</p>
        </div>
        <label className={`btn-outline cursor-pointer text-sm ${!blobOk || uploading ? "pointer-events-none opacity-40" : ""}`}>
          {uploading ? "Wird hochgeladen …" : "Bild hochladen"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            disabled={!blobOk || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) hochladen(f);
            }}
          />
        </label>
      </div>

      {fehler && <p className="mt-2 text-sm text-[var(--danger)]">{fehler}</p>}

      {bilder.length === 0 ? (
        <p className="mt-4 text-sm text-subtle">Noch keine Bilder in dieser Kategorie.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bilder.map((b, i) => (
            <div key={b.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.url} alt={b.alt} className={`h-40 w-full object-cover ${b.active ? "" : "opacity-40"}`} />
              <div className="space-y-2 p-3">
                <input
                  className="field text-sm"
                  placeholder="Bildbeschreibung (Alt-Text)"
                  defaultValue={b.alt}
                  onBlur={(e) => {
                    if (e.target.value !== b.alt) patch(b.id, { alt: e.target.value });
                  }}
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-1">
                    <button
                      onClick={() => verschieben(i, -1)}
                      disabled={i === 0}
                      className="rounded px-2 py-1 text-muted hover:text-ink disabled:opacity-30"
                      title="Nach vorne"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => verschieben(i, 1)}
                      disabled={i === bilder.length - 1}
                      className="rounded px-2 py-1 text-muted hover:text-ink disabled:opacity-30"
                      title="Nach hinten"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => patch(b.id, { active: !b.active })}
                    className="text-muted hover:text-ink"
                  >
                    {b.active ? "Sichtbar" : "Verborgen"}
                  </button>
                  <button onClick={() => loeschen(b.id)} className="text-[var(--danger)] hover:brightness-110">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
