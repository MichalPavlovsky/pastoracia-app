// Ľudia → kalendár: aké udalosti majú byť v kalendári.
// Do kalendára idú len nehotové pripomienky od dnes ďalej. Minulé udalosti sa nemenia.

import type { UdalostKalendara } from '../../../calendar/types'
import type { LudiaSubor } from './ludia'

export function pozadovaneUdalosti(d: LudiaSubor, dnesny: string): UdalostKalendara[] {
  const vysledok: UdalostKalendara[] = []
  for (const c of d.ludia) {
    for (const p of c.pripomienky) {
      if (p.hotovo || p.datum < dnesny) continue
      vysledok.push({
        idPripomienky: p.id,
        nazov: `${c.meno}: ${p.dovod || 'ozvať sa'}`,
        text: [c.kontakt, c.poznamka].filter((x) => x.trim() !== '').join('\n\n'),
        datum: p.datum,
        cas: p.cas,
      })
    }
  }
  return vysledok
}
