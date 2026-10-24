// Zlúčenie verzií z dvoch zariadení.
// Intencie: po dňoch. Témy: po jednotlivých témach (podľa id) a poznámkach týždňov.

import { formatDatum } from '../../../lib/datum'
import { zlucPodlaKluca, type Druh } from '../../../lib/zlucenie'
import type { VysledokZlucenia } from '../../../storage/types'
import { formatIntencia, NAZVY_TYPOV, normalizuj, type Den, type IntencieSubor } from './intencie'
import { normalizujPlan, type PlanSubor, type Tema, type Tyzden } from './temy'

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

interface TemaVTyzdni {
  pondelok: string
  tema: Tema
}

function popisTemy(t?: TemaVTyzdni): string {
  return t ? `„${t.tema.nazov}“ (týždeň ${formatDatum(t.pondelok)})` : 'zmazaná'
}

export function zlucPlan(zaklad: PlanSubor, moje: PlanSubor, ich: PlanSubor): VysledokZlucenia<PlanSubor> {
  const temy = (p: PlanSubor) =>
    new Map(normalizujPlan(p).tyzdne.flatMap((t) => t.temy.map((tema) => [tema.id, { pondelok: t.pondelok, tema }] as const)))
  const poznamky = (p: PlanSubor) =>
    new Map(normalizujPlan(p).tyzdne.filter((t) => t.poznamka.trim() !== '').map((t) => [t.pondelok, t.poznamka]))

  const zt = zlucPodlaKluca(temy(zaklad), temy(moje), temy(ich))
  const zp = zlucPodlaKluca(poznamky(zaklad), poznamky(moje), poznamky(ich))

  const tyzdne = new Map<string, Tyzden>()
  const tyzden = (po: string) => {
    let t = tyzdne.get(po)
    if (!t) tyzdne.set(po, (t = { pondelok: po, temy: [], poznamka: '' }))
    return t
  }
  for (const { pondelok, tema } of zt.vysledok.values()) tyzden(pondelok).temy.push(tema)
  for (const [po, poznamka] of zp.vysledok) tyzden(po).poznamka = poznamka

  const nazovZakladu = (id: string) => temy(zaklad).get(id)?.tema.nazov
  return {
    data: normalizujPlan({ verzia: 1, tyzdne: [...tyzdne.values()] }),
    zmenyZInych: [
      ...zt.zInych.map((x) =>
        x.druh === 'zmazane' ? `Téma „${nazovZakladu(x.kluc) ?? x.kluc}“ zmazaná` : `Téma ${SLOVESA[x.druh]}: ${popisTemy(x.ich)}`,
      ),
      ...zp.zInych.map((x) => `Poznámka týždňa ${formatDatum(x.kluc)} ${SLOVESA[x.druh]}`),
    ],
    konflikty: [
      ...zt.konflikty.map(
        (x) =>
          `Téma „${x.moje?.tema.nazov ?? x.ich?.tema.nazov}“ zmenená na oboch zariadeniach. ` +
          `Tvoja: ${popisTemy(x.moje)}, druhá: ${popisTemy(x.ich)}. Ponechaná ${x.ponechane === 'moje' ? 'tvoja' : 'druhá'} verzia.`,
      ),
      ...zp.konflikty.map(
        (x) =>
          `Poznámka týždňa ${formatDatum(x.kluc)} zmenená na oboch zariadeniach. ` +
          `Tvoja: „${x.moje ?? ''}“, druhá: „${x.ich ?? ''}“. Ponechaná ${x.ponechane === 'moje' ? 'tvoja' : 'druhá'} verzia.`,
      ),
    ],
  }
}
