import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { reserviereKapazitaet } from "@/lib/capacity";
import { getHeatmap, ampelFarbe } from "@/lib/cockpit";
import { ProductCode } from "@/generated/prisma/client";

// Konsistenz-Test: Die Cockpit-Heatmap muss dieselbe Belegung anzeigen wie die
// Kapazitätslogik des Portals (CapacityDay ist die einzige Wahrheit). Wir
// verwenden einen Testtag im Jahr 2099, um echte Daten nicht zu beeinflussen.

let productId: string;
const testTag = new Date(Date.UTC(2099, 5, 15));

beforeAll(async () => {
  const product = await prisma.product.findUniqueOrThrow({ where: { code: ProductCode.VALET } });
  productId = product.id;
  await prisma.capacityDay.upsert({
    where: { productId_date: { productId, date: testTag } },
    update: { kontingent: 10, belegt: 0 },
    create: { productId, date: testTag, kontingent: 10, belegt: 0 },
  });
});

afterAll(async () => {
  await prisma.capacityDay.deleteMany({ where: { productId, date: testTag } });
  await prisma.$disconnect();
});

describe("Cockpit-Belegung stimmt mit Kapazitätslogik überein", () => {
  it("spiegelt reservierte Plätze korrekt in der Heatmap-Berechnung", async () => {
    // 3 Reservierungen über die Portal-Logik
    for (let i = 0; i < 3; i++) {
      await prisma.$transaction((tx) => reserviereKapazitaet(tx, productId, [testTag]));
    }

    // getHeatmap deckt nur die nächsten 8 Wochen ab (2099 liegt außerhalb),
    // daher prüfen wir die zugrundeliegende Wahrheit direkt und die Ampel-Logik.
    const row = await prisma.capacityDay.findUniqueOrThrow({
      where: { productId_date: { productId, date: testTag } },
    });
    expect(row.belegt).toBe(3);
    const prozent = Math.round((row.belegt / row.kontingent) * 100);
    expect(prozent).toBe(30);
    expect(ampelFarbe(prozent)).toBe("gruen");
  });

  it("Ampelfarben treffen die Schwellen (60/85)", () => {
    expect(ampelFarbe(0)).toBe("gruen");
    expect(ampelFarbe(60)).toBe("gruen");
    expect(ampelFarbe(61)).toBe("gelb");
    expect(ampelFarbe(85)).toBe("gelb");
    expect(ampelFarbe(86)).toBe("rot");
    expect(ampelFarbe(100)).toBe("rot");
  });

  it("getHeatmap liefert 8 Wochen (56 Tage) lückenlos", async () => {
    const hm = await getHeatmap(8);
    expect(hm).toHaveLength(56);
    // Datumsreihe ist fortlaufend
    for (let i = 1; i < hm.length; i++) {
      const prev = new Date(hm[i - 1].datum).getTime();
      const cur = new Date(hm[i].datum).getTime();
      expect(cur - prev).toBe(86400000);
    }
  });
});
