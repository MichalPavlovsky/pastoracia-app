// Ľudia → kalendár: aké udalosti majú byť v kalendári.
// Do kalendára idú len nehotové pripomienky od dnes ďalej. Minulé udalosti sa nemenia.

import type { UdalostKalendara } from '../../../calendar/types'
import type { Clovek, LudiaSubor, Pripomienka } from './ludia'

export function udalostPripomienky(c: Clovek, p: Pripomienka): UdalostKalendara {
  return {
    idPripomienky: p.id,
    nazov: `${c.meno}: ${p.dovod || 'ozvať sa'}`,
    text: [c.kontakt, c.poznamka].filter((x) => x.trim() !== '').join('\n\n'),
    datum: p.datum,
    cas: p.cas,
  }
}

export function pozadovaneUdalosti(d: LudiaSubor, dnesny: string): UdalostKalendara[] {
  return d.ludia.flatMap((c) => c.pripomienky.filter((p) => !p.hotovo && p.datum >= dnesny).map((p) => udalostPripomienky(c, p)))
}
