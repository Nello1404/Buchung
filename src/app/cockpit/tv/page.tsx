import { hatTvZugang } from "@/lib/auth";
import { getTvData } from "@/lib/cockpit";
import { TvBoard } from "@/components/cockpit/TvBoard";
import { TvGate } from "@/components/cockpit/TvGate";

export const metadata = { title: "TV-Modus – FlySpot Valet" };

export default async function TvPage() {
  if (!(await hatTvZugang())) {
    return <TvGate />;
  }
  const initial = await getTvData();
  return <TvBoard initial={initial} />;
}
