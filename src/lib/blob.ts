import { put, del } from "@vercel/blob";

/**
 * Dünne Hülle um Vercel Blob. Der Token wird von @vercel/blob automatisch aus
 * der Umgebungsvariable BLOB_READ_WRITE_TOKEN gelesen. Fehlt der Token, werfen
 * wir einen klaren Fehler, damit die Admin-Oberfläche eine verständliche
 * Meldung anzeigen kann, statt eine kryptische Exception.
 */
export class BlobNichtKonfiguriertError extends Error {
  constructor() {
    super(
      "Bild-Speicher ist nicht eingerichtet. Bitte in Vercel einen Blob-Store " +
        "anlegen und die Variable BLOB_READ_WRITE_TOKEN setzen."
    );
    this.name = "BlobNichtKonfiguriertError";
  }
}

export function blobKonfiguriert(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function ladeBildHoch(
  pathname: string,
  daten: Buffer,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  if (!blobKonfiguriert()) throw new BlobNichtKonfiguriertError();
  const result = await put(pathname, daten, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return { url: result.url, pathname: result.pathname };
}

export async function loescheBild(pathnameOderUrl: string): Promise<void> {
  if (!blobKonfiguriert()) return;
  // del ist idempotent – ein bereits gelöschtes Objekt wirft keinen Fehler.
  await del(pathnameOderUrl);
}
