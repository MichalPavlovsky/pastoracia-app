// Zlúčenie intencií z dvoch zariadení – po dňoch.

import { formatDatum } from '../../../lib/datum'
import { zlucPodlaKluca, type Druh } from '../../../lib/zlucenie'
import type { VysledokZlucenia } from '../../../storage/types'
import { formatIntencia, NAZVY_TYPOV, normalizuj, type Den, type IntencieSubor } from './intencie'

const SLOVESA: Record<Druh, string> = { pridane: 'pridané', zmenene: 'zmenené', zmazane: 'zmazané' }

/** Krátky popis dňa: "16:30 Liturgia (+Mária, Ján); spoveď 15:00–16:20; oznam" */
export function popisDna(d?: Den): string {
  if (!d) return 'prázdny deň'
  const casti = [
    ...d.bohosluzby.map((b) => {
      const i = b.intencie.map(formatIntencia).join('; ')
      return `${b.cas} ${NAZVY_TYPOV[b.typ]}${i ? ` (${i})` : ''}`
    }),
    ...d.spovede.map((s) => `spoveď ${s.od}${s.do ? `–${s.do}` : ''}`),
    ...(d.oznam.trim() ? [`oznam: ${d.oznam.trim()}`] : []),
  ]
  return casti.join('; ')
}

export function zlucIntencie(zaklad: IntencieSubor, moje: IntencieSubor, ich: IntencieSubor): VysledokZlucenia<IntencieSubor> {
  const mapa = (s: IntencieSubor) => new Map(normalizuj(s).dni.map((d) => [d.datum, d]))
  const z = zlucPodlaKluca(mapa(zaklad), mapa(moje), mapa(ich))
  return {
    data: normalizuj({ verzia: 1, dni: [...z.vysledok.values()] }),
    zmenyZInych: z.zInych.map((x) => `${formatDatum(x.kluc)}: ${SLOVESA[x.druh]} – ${popisDna(x.ich)}`),
    konflikty: z.konflikty.map(
      (x) =>
        `${formatDatum(x.kluc)}: zmenené na oboch zariadeniach. ` +
        `Tvoja verzia: ${popisDna(x.moje)}. Druhá verzia: ${popisDna(x.ich)}. ` +
        `Ponechaná ${x.ponechane === 'moje' ? 'tvoja' : 'druhá'} verzia.`,
    ),
  }
}
