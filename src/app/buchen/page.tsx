import Link from "next/link";
import BookingWizard from "@/components/BookingWizard";

export const metadata = { title: "Buchen – FlySpot Valet" };

export default function BuchenPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto mb-6 w-full max-w-2xl">
        <Link href="/" className="text-sm font-medium text-blue-900 hover:underline dark:text-blue-300">
          ← Zurück zur Startseite
        </Link>
      </div>
      <BookingWizard />
    </div>
  );
}
