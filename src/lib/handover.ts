export const HANDOVER_PHASEN = [
  { code: "EINFAHRT", label: "Übernahme (Einfahrt)" },
  { code: "AUSFAHRT", label: "Rückgabe (Ausfahrt)" },
] as const;

export type HandoverPhaseCode = (typeof HANDOVER_PHASEN)[number]["code"];

export function phaseLabel(code: string): string {
  return HANDOVER_PHASEN.find((p) => p.code === code)?.label ?? code;
}

export function istPhase(wert: string): wert is HandoverPhaseCode {
  return HANDOVER_PHASEN.some((p) => p.code === wert);
}

/// Auswahlmöglichkeiten für den Tank-/Ladestand.
export const TANKSTUFEN = [
  "Voll (1/1)",
  "3/4",
  "1/2",
  "1/4",
  "Reserve",
  "Elektro – voll",
  "Elektro – teilgeladen",
  "Elektro – niedrig",
];
