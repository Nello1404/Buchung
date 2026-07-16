export interface ErstattungParams {
  stundenBisAnreise: number;
  stornoFristStunden: number;
  erstattungFruehProzent: number;
  erstattungSpaetProzent: number;
  betragCent: number;
}

export interface ErstattungErgebnis {
  erstattungProzent: number;
  erstattungCent: number;
}

/**
 * Storno-Regel: Bei Stornierung mindestens `stornoFristStunden` (Standard 48h) vor
 * Anreise gibt es die volle (frühe) Erstattungsquote, danach die reduzierte (späte)
 * Quote. Die Erstattung wird auf ganze Cent gerundet.
 */
export function berechneErstattung(params: ErstattungParams): ErstattungErgebnis {
  const { stundenBisAnreise, stornoFristStunden, erstattungFruehProzent, erstattungSpaetProzent, betragCent } =
    params;

  const erstattungProzent =
    stundenBisAnreise >= stornoFristStunden ? erstattungFruehProzent : erstattungSpaetProzent;
  const erstattungCent = Math.round((betragCent * erstattungProzent) / 100);

  return { erstattungProzent, erstattungCent };
}
