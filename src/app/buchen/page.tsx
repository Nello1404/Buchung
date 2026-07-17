import BookingWizard from "@/components/BookingWizard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Buchen – FlySpot Valet" };

export default function BuchenPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-14">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow">Buchung</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
            Ihren Parkplatz reservieren
          </h1>
          <p className="mt-3 text-muted">
            In vier Schritten gebucht – der Preis wird jederzeit live berechnet.
          </p>
        </div>
        <BookingWizard />
      </main>
      <SiteFooter />
    </div>
  );
}
