// Bohoslužobný poriadok Humenné: nahraté .doc/.docx podľa týždňov (poriadky-humenne.json).
// Obsah súborov aplikácia nečíta – použije ho Claude pri Farskom liste. Formát je v SCHEMA.md.

import { jeDatum, pondelokTyzdna, pridajDni } from '../../../lib/datum'
import { ChybaFormatu, naText, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'
import { zlucPodlaKluca } from '../../../lib/zlucenie'
import type { VysledokZlucenia } from '../../../storage/types'

export const SUBOR_PORIADKY = 'poriadky-humenne.json'
/** podpriečinok v data/ */
export const PRIECINOK_PORIADKY = 'poriadky'

export interface SuborPoriadku {
  /** relatívne k priečinku data/, napr. "poriadky/2026-11-02/45. 02. 11. - 08. 11. 2026.doc" */
  cesta: string
  nazov: string
  /** lokálny čas RRRR-MM-DDTHH:MM */
  nahrane: string
}

export interface TyzdenPoriadku {
  pondelok: string
  subory: SuborPoriadku[]
}

export interface PoriadkySubor {
  verzia: 1
  tyzdne: TyzdenPoriadku[]
}

export function prazdnePoriadky(): PoriadkySubor {
  return { verzia: 1, tyzdne: [] }
}

const CAS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function parsujPoriadky(s: string): PoriadkySubor {
  const koren = obj(parsujText(s, SUBOR_PORIADKY), SUBOR_PORIADKY)
  overVerziu(koren, SUBOR_PORIADKY)
  const tyzdne = pole(koren.tyzdne, 'tyzdne').map((t, i): TyzdenPoriadku => {
    const c = `tyzdne[${i}]`
    const o = obj(t, c)
    const pondelok = text(o.pondelok, `${c}.pondelok`)
    if (!jeDatum(pondelok)) throw new ChybaFormatu(`${c}.pondelok`, `"${pondelok}" nie je dátum RRRR-MM-DD`)
    const subory = pole(o.subory, `${c}.subory`).map((x, j): SuborPoriadku => {
      const cs = `${c}.subory[${j}]`
      const os = obj(x, cs)
      const nahrane = text(os.nahrane, `${cs}.nahrane`)
      if (!CAS.test(nahrane)) throw new ChybaFormatu(`${cs}.nahrane`, `"${nahrane}" nie je čas RRRR-MM-DDTHH:MM`)
      return { cesta: text(os.cesta, `${cs}.cesta`), nazov: text(os.nazov, `${cs}.nazov`), nahrane }
    })
    return { pondelok, subory }
  })
  return normalizujPoriadky({ verzia: 1, tyzdne })
}

export function serializujPoriadky(d: PoriadkySubor): string {
  return naText(normalizujPoriadky(d))
}

/** Týždne podľa pondelka (zlúčené, bez prázdnych), súbory podľa času nahratia, bez duplicitných ciest. */
export function normalizujPoriadky(d: PoriadkySubor): PoriadkySubor {
  const tyzdne = new Map<string, Map<string, SuborPoriadku>>()
  for (const t of d.tyzdne) {
    const subory = tyzdne.get(t.pondelok) ?? new Map<string, SuborPoriadku>()
    for (const s of t.subory) if (!subory.has(s.cesta)) subory.set(s.cesta, { cesta: s.cesta, nazov: s.nazov, nahrane: s.nahrane })
    tyzdne.set(t.pondelok, subory)
  }
  return {
    verzia: 1,
    tyzdne: [...tyzdne.entries()]
      .filter(([, s]) => s.size > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([pondelok, s]) => ({
        pondelok,
        subory: [...s.values()].sort((a, b) => a.nahrane.localeCompare(b.nahrane) || a.cesta.localeCompare(b.cesta)),
      })),
  }
}

/** Zlúčenie dvoch zariadení podľa cesty súboru; zmazanie sa rešpektuje. */
export function zlucPoriadky(zaklad: PoriadkySubor, moje: PoriadkySubor, ich: PoriadkySubor): VysledokZlucenia<PoriadkySubor> {
  const mapa = (d: PoriadkySubor) =>
    new Map(d.tyzdne.flatMap((t) => t.subory.map((s): [string, { pondelok: string; s: SuborPoriadku }] => [s.cesta, { pondelok: t.pondelok, s }])))
  const z = zlucPodlaKluca(mapa(zaklad), mapa(moje), mapa(ich))
  const nove = z.zInych.filter((x) => x.druh === 'pridane').length
  return {
    data: normalizujPoriadky({ verzia: 1, tyzdne: [...z.vysledok.values()].map((x) => ({ pondelok: x.pondelok, subory: [x.s] })) }),
    zmenyZInych: nove > 0 ? [`Poriadky nahraté na inom zariadení: ${nove}`] : [],
    konflikty: [],
  }
}

// ---------- týždne ----------

/**
 * Pondelok z názvu „45. 02. 11. - 08. 11. 2026.doc“ → "2026-11-02". Rok je na konci;
 * týždeň cez Nový rok („29. 12. - 04. 01. 2027“) začína v predošlom roku. Inak `null`.
 */
export function pondelokZNazvu(nazov: string): string | null {
  const m = /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.?\s*[-–—]\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})/.exec(nazov)
  if (!m) return null
  const [, d1, m1, , m2, r2] = m.map(Number) as [number, number, number, number, number, number]
  const rok = m1 > m2 ? r2 - 1 : r2
  const datum = `${rok}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`
  if (!jeDatum(datum)) return null
  return pondelokTyzdna(datum)
}

export function suboryTyzdna(d: PoriadkySubor, pondelok: string): SuborPoriadku[] {
  return d.tyzdne.find((t) => t.pondelok === pondelok)?.subory ?? []
}

/** Názov, ktorý v týždni ešte nie je: „a.doc“ → „a (2).doc“ → „a (3).doc“ … */
export function volnyNazov(nazov: string, obsadene: string[]): string {
  const pouzite = new Set(obsadene.map((x) => x.toLowerCase()))
  if (!pouzite.has(nazov.toLowerCase())) return nazov
  const bodka = nazov.lastIndexOf('.')
  const zaklad = bodka > 0 ? nazov.slice(0, bodka) : nazov
  const pripona = bodka > 0 ? nazov.slice(bodka) : ''
  for (let i = 2; ; i++) {
    const kandidat = `${zaklad} (${i})${pripona}`
    if (!pouzite.has(kandidat.toLowerCase())) return kandidat
  }
}

export function cestaSuboru(pondelok: string, nazov: string): string {
  return `${PRIECINOK_PORIADKY}/${pondelok}/${nazov}`
}

export function pridajSubor(d: PoriadkySubor, pondelok: string, s: SuborPoriadku): PoriadkySubor {
  return normalizujPoriadky({ ...d, tyzdne: [...d.tyzdne, { pondelok, subory: [s] }] })
}

export function odoberSubor(d: PoriadkySubor, cesta: string): PoriadkySubor {
  return normalizujPoriadky({ ...d, tyzdne: d.tyzdne.map((t) => ({ ...t, subory: t.subory.filter((s) => s.cesta !== cesta) })) })
}

/** Na budúci týždeň (od dnešného dňa) ešte nie je nahraný poriadok. */
export function chybaBuduci(d: PoriadkySubor, dnes: string): boolean {
  return suboryTyzdna(d, pridajDni(pondelokTyzdna(dnes), 7)).length === 0
}

/** Lokálny čas RRRR-MM-DDTHH:MM (Europe/Bratislava = čas zariadenia). */
export function casTeraz(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
