import { describe, expect, it } from "vitest";
import { ampelHoeher, ampelNiedriger } from "@/lib/plan";

describe("Plan-Ist-Ampel", () => {
  it("höher = besser (Umsatz/Auslastung/Ergebnis)", () => {
    expect(ampelHoeher(100, 100)).toBe("gruen"); // 100%
    expect(ampelHoeher(95, 100)).toBe("gruen");
    expect(ampelHoeher(90, 100)).toBe("gelb");
    expect(ampelHoeher(80, 100)).toBe("gelb");
    expect(ampelHoeher(79, 100)).toBe("rot");
    expect(ampelHoeher(50, 0)).toBe("neutral"); // kein Plan gesetzt
  });

  it("niedriger = besser (Kosten)", () => {
    expect(ampelNiedriger(100, 100)).toBe("gruen");
    expect(ampelNiedriger(105, 100)).toBe("gruen");
    expect(ampelNiedriger(106, 100)).toBe("gelb");
    expect(ampelNiedriger(120, 100)).toBe("gelb");
    expect(ampelNiedriger(121, 100)).toBe("rot");
    expect(ampelNiedriger(50, 0)).toBe("neutral");
  });
});
