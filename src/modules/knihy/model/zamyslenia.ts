// Zamyslenia z webu (zamyslenia-web.json): čítania dňa a krátka myšlienka. Píše len Claude, aplikácia iba číta.
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { jeDatum } from '../../../lib/datum'
import { ChybaFormatu, jedenZ, naText, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'
import type { VysledokZlucenia } from '../../../storage/types'

export const SUBOR_ZAMYSLENIA = 'zamyslenia-web.json'

export interface Zdroj {
  nazov: string
  url: string
}

/** Čítanie, ktoré sa dá v aplikácii rozkliknúť (stránka casoslov.sk s textom). */
export interface TextCitania {
  /** napr. „Evanjelium“ */
  nazov: string
  /** napr. „Lk 7, 1b-10“ */
  odkaz: string
  url: string
}

export const DRUHY_DALSIEHO = ['otcovia', 'komentar', 'nedela'] as const
export type DruhDalsieho = (typeof DRUHY_DALSIEHO)[number]

/** Ďalšie čítanie na deň – text vlastnými slovami, celý originál je na `url`. */
export interface DalsieZamyslenie {
  druh: DruhDalsieho
  /** napr. „Otcovia k evanjeliu“ */
  nazov: string
  /** napr. „Catena Aurea“ */
  zdroj: string
  text: string
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
  texty: TextCitania[]
  dalsie: DalsieZamyslenie[]
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
      texty: pole(o.texty, `${c}.texty`).map((t, k) => {
        const p = `${c}.texty[${k}]`
        const ot = obj(t, p)
        return { nazov: text(ot.nazov, `${p}.nazov`), odkaz: text(ot.odkaz, `${p}.odkaz`), url: text(ot.url, `${p}.url`) }
      }),
      dalsie: pole(o.dalsie, `${c}.dalsie`).map((x, k) => {
        const p = `${c}.dalsie[${k}]`
        const ox = obj(x, p)
        return {
          druh: jedenZ(ox.druh, DRUHY_DALSIEHO, `${p}.druh`),
          nazov: text(ox.nazov, `${p}.nazov`),
          zdroj: text(ox.zdroj, `${p}.zdroj`),
          text: text(ox.text, `${p}.text`),
          url: text(ox.url, `${p}.url`),
        }
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
