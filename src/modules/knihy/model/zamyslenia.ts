// Zamyslenia z webu (zamyslenia-web.json): čítania dňa a krátka myšlienka. Píše len Claude, aplikácia iba číta.
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { jeDatum } from '../../../lib/datum'
import { ChybaFormatu, naText, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'
import type { VysledokZlucenia } from '../../../storage/types'

export const SUBOR_ZAMYSLENIA = 'zamyslenia-web.json'

export interface Zdroj {
  nazov: string
  url: string
}

export interface ZamyslenieDna {
  /** RRRR-MM-DD */
  datum: string
  /** napr. „Nedeľa Krista Kráľa“ */
  nazov: string
  /** odkazy na čítania, napr. „Kol 1, 12-18 · Jn 18, 33-37“ */
  citania: string
  svati: string
  myslienka: string
  otazka: string
  zdroje: Zdroj[]
}

export interface ZamysleniaSubor {
  verzia: 1
  dni: ZamyslenieDna[]
}

export function prazdneZamyslenia(): ZamysleniaSubor {
  return { verzia: 1, dni: [] }
}

export function parsujZamyslenia(s: string): ZamysleniaSubor {
  const koren = obj(parsujText(s, SUBOR_ZAMYSLENIA), SUBOR_ZAMYSLENIA)
  overVerziu(koren, SUBOR_ZAMYSLENIA)
  const videne = new Set<string>()
  const dni = pole(koren.dni, 'dni').map((d, i): ZamyslenieDna => {
    const c = `dni[${i}]`
    const o = obj(d, c)
    const datum = text(o.datum, `${c}.datum`)
    if (!jeDatum(datum)) throw new ChybaFormatu(`${c}.datum`, `"${datum}" nie je dátum RRRR-MM-DD`)
    if (videne.has(datum)) throw new ChybaFormatu('dni', `deň ${datum} je tam viackrát`)
    videne.add(datum)
    return {
      datum,
      nazov: text(o.nazov, `${c}.nazov`),
      citania: text(o.citania, `${c}.citania`),
      svati: text(o.svati, `${c}.svati`),
      myslienka: text(o.myslienka, `${c}.myslienka`),
      otazka: text(o.otazka, `${c}.otazka`),
      zdroje: pole(o.zdroje, `${c}.zdroje`).map((z, k) => {
        const oz = obj(z, `${c}.zdroje[${k}]`)
        return { nazov: text(oz.nazov, `${c}.zdroje[${k}].nazov`), url: text(oz.url, `${c}.zdroje[${k}].url`) }
      }),
    }
  })
  return { verzia: 1, dni: dni.sort((a, b) => a.datum.localeCompare(b.datum)) }
}

export function serializujZamyslenia(d: ZamysleniaSubor): string {
  return naText(d)
}

/** Aplikácia súbor nezapisuje – vždy platí verzia z OneDrive. */
export function zlucZamyslenia(_zaklad: ZamysleniaSubor, _moje: ZamysleniaSubor, ich: ZamysleniaSubor): VysledokZlucenia<ZamysleniaSubor> {
  return { data: ich, zmenyZInych: [], konflikty: [] }
}

export function zamyslenieNaDen(d: ZamysleniaSubor, datum: string): ZamyslenieDna | undefined {
  return d.dni.find((z) => z.datum === datum)
}

/** Posledný deň, na ktorý sú zamyslenia pripravené, alebo `null`. */
export function pripraveneDo(d: ZamysleniaSubor): string | null {
  return d.dni.at(-1)?.datum ?? null
}
