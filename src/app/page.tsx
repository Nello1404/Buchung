import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-blue-900 dark:text-blue-300">FlySpot Valet</span>
          <nav className="flex gap-6 text-sm">
            <Link href="/buchen" className="font-medium text-blue-900 hover:underline dark:text-blue-300">
              Jetzt buchen
            </Link>
            <Link href="/stornieren" className="text-zinc-600 hover:underline dark:text-zinc-400">
              Buchung stornieren
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Parken am Flughafen Frankfurt – Valet oder Shuttle, ganz wie Sie möchten.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Fahren Sie direkt ans Terminal und übergeben Sie uns Ihr Auto (Valet), oder parken Sie selbst
          bei uns und lassen Sie sich per Shuttle zum Terminal bringen. Buchen Sie in wenigen Minuten
          online.
        </p>
        <Link
          href="/buchen"
          className="mt-8 rounded-full bg-blue-900 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
        >
          Jetzt Parkplatz buchen
        </Link>

        <div className="mt-16 grid w-full gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Valet – Hol &amp; Bring</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sie fahren ans Terminal, wir übernehmen Ihr Auto und stellen es bei Ihrer Rückkehr wieder
              bereit. Maximaler Komfort.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Shuttle – Selbstanfahrt</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Sie parken selbst auf unserem Platz und werden von unserem Shuttle-Van zum Terminal
              gebracht. Günstiger Tarif.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        FlySpot Valet · Flughafen Frankfurt · www.flyspot-valet.de
      </footer>
    </div>
  );
}
