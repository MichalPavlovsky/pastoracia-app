// Knihy – zamyslenie dňa: čítanie knihy.json (píše len Claude) a knihy-stav.json (píše aplikácia).
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { jeDatum } from '../../../lib/datum'
import { ChybaFormatu, naText, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'
import { zlucPodlaKluca } from '../../../lib/zlucenie'
import type { VysledokZlucenia } from '../../../storage/types'

export const SUBOR_KNIHY = 'knihy.json'
export const SUBOR_KNIHY_STAV = 'knihy-stav.json'

export interface Uryvok {
  id: string
  nadpis: string
  miesto: string
  text: string
}

export interface Kniha {
  id: string
  nazov: string
  autor: string
  zdroj: string
  uryvky: Uryvok[]
}

export interface KnihySubor {
  verzia: 1
  knihy: Kniha[]
}

export interface Precitane {
  uryvok: string
  /** RRRR-MM-DD */
  datum: string
}

export interface KnihyStav {
  verzia: 1
  precitane: Precitane[]
  oblubene: string[]
}

export function prazdneKnihy(): KnihySubor {
  return { verzia: 1, knihy: [] }
}

export function prazdnyStav(): KnihyStav {
  return { verzia: 1, precitane: [], oblubene: [] }
}

// ---------- knihy.json ----------

export function parsujKnihy(s: string): KnihySubor {
  const koren = obj(parsujText(s, SUBOR_KNIHY), SUBOR_KNIHY)
  overVerziu(koren, SUBOR_KNIHY)
  const videne = new Set<string>()
  const knihy = pole(koren.knihy, 'knihy').map((k, i): Kniha => {
    const c = `knihy[${i}]`
    const o = obj(k, c)
    const id = text(o.id, `${c}.id`)
    if (id === '') throw new ChybaFormatu(`${c}.id`, 'chýba id')
    return {
      id,
      nazov: text(o.nazov, `${c}.nazov`),
      autor: text(o.autor, `${c}.autor`),
      zdroj: text(o.zdroj, `${c}.zdroj`),
      uryvky: pole(o.uryvky, `${c}.uryvky`).map((u, j): Uryvok => {
        const cu = `${c}.uryvky[${j}]`
        const ou = obj(u, cu)
        const idu = text(ou.id, `${cu}.id`)
        if (idu === '') throw new ChybaFormatu(`${cu}.id`, 'chýba id')
        if (videne.has(idu)) throw new ChybaFormatu('knihy', `úryvok ${idu} je tam viackrát`)
        videne.add(idu)
        return { id: idu, nadpis: text(ou.nadpis, `${cu}.nadpis`), miesto: text(ou.miesto, `${cu}.miesto`), text: text(ou.text, `${cu}.text`) }
      }),
    }
  })
  return { verzia: 1, knihy }
}

export function serializujKnihy(d: KnihySubor): string {
  return naText(d)
}

/** Aplikácia knihy.json nezapisuje – vždy platí verzia z OneDrive. */
export function zlucKnihy(_zaklad: KnihySubor, _moje: KnihySubor, ich: KnihySubor): VysledokZlucenia<KnihySubor> {
  return { data: ich, zmenyZInych: [], konflikty: [] }
}

// ---------- knihy-stav.json ----------

export function parsujStav(s: string): KnihyStav {
  const koren = obj(parsujText(s, SUBOR_KNIHY_STAV), SUBOR_KNIHY_STAV)
  overVerziu(koren, SUBOR_KNIHY_STAV)
  const precitane = pole(koren.precitane, 'precitane').map((p, i): Precitane => {
    const c = `precitane[${i}]`
    const o = obj(p, c)
    const datum = text(o.datum, `${c}.datum`)
    if (!jeDatum(datum)) throw new ChybaFormatu(`${c}.datum`, `"${datum}" nie je dátum RRRR-MM-DD`)
    return { uryvok: text(o.uryvok, `${c}.uryvok`), datum }
  })
  const oblubene = pole(koren.oblubene, 'oblubene').map((x, i) => text(x, `oblubene[${i}]`))
  return normalizujStav({ verzia: 1, precitane, oblubene })
}

export function serializujStav(d: KnihyStav): string {
  return naText(normalizujStav(d))
}

/** Bez duplicít; prečítané podľa dátumu, obľúbené podľa id. */
export function normalizujStav(d: KnihyStav): KnihyStav {
  const precitane = new Map<string, Precitane>()
  for (const p of d.precitane) if (!precitane.has(p.uryvok)) precitane.set(p.uryvok, { uryvok: p.uryvok, datum: p.datum })
  return {
    verzia: 1,
    precitane: [...precitane.values()].sort((a, b) => a.datum.localeCompare(b.datum) || a.uryvok.localeCompare(b.uryvok)),
    oblubene: [...new Set(d.oblubene)].sort(),
  }
}

/** Zjednotenie z oboch zariadení; odobratie (obľúbené, prečítané) sa rešpektuje. */
export function zlucStav(zaklad: KnihyStav, moje: KnihyStav, ich: KnihyStav): VysledokZlucenia<KnihyStav> {
  const precitane = (d: KnihyStav) => new Map(normalizujStav(d).precitane.map((p) => [p.uryvok, p]))
  const oblubene = (d: KnihyStav) => new Map(normalizujStav(d).oblubene.map((id) => [id, true]))
  const p = zlucPodlaKluca(precitane(zaklad), precitane(moje), precitane(ich))
  const o = zlucPodlaKluca(oblubene(zaklad), oblubene(moje), oblubene(ich))
  const nove = p.zInych.filter((x) => x.druh === 'pridane').length
  return {
    data: normalizujStav({ verzia: 1, precitane: [...p.vysledok.values()], oblubene: [...o.vysledok.keys()] }),
    zmenyZInych: nove > 0 ? [`Prečítané na inom zariadení: ${nove}`] : [],
    konflikty: [],
  }
}

// ---------- čítanie ----------

export interface UryvokVPoradi {
  kniha: Kniha
  uryvok: Uryvok
  /** poradie úryvku v knihe od 1 */
  poradie: number
  /** poradie v celom zozname (všetky knihy za sebou) od 0 */
  index: number
}

export interface DnesnyUryvok extends UryvokVPoradi {
  precitanyDnes: boolean
}

/** Všetky úryvky v poradí čítania (knihy za sebou). */
export function vsetkyUryvky(knihy: KnihySubor): UryvokVPoradi[] {
  const vysledok: UryvokVPoradi[] = []
  for (const kniha of knihy.knihy) {
    for (const [i, uryvok] of kniha.uryvky.entries()) vysledok.push({ kniha, uryvok, poradie: i + 1, index: vysledok.length })
  }
  return vysledok
}

/** Kedy bol úryvok prečítaný, alebo `null`. */
export function datumPrecitania(stav: KnihyStav, id: string): string | null {
  return stav.precitane.find((p) => p.uryvok === id)?.datum ?? null
}

/** Posledný dnes prečítaný úryvok, inak prvý neprečítaný v poradí knihy.json; `null`, ak je všetko prečítané. */
export function dnesnyUryvok(knihy: KnihySubor, stav: KnihyStav, dnes: string): DnesnyUryvok | null {
  const precitane = new Map(stav.precitane.map((p) => [p.uryvok, p.datum]))
  let prvyNeprecitany: DnesnyUryvok | null = null
  let dnesny: DnesnyUryvok | null = null
  for (const u of vsetkyUryvky(knihy)) {
    const datum = precitane.get(u.uryvok.id)
    if (datum === dnes) dnesny = { ...u, precitanyDnes: true }
    if (datum === undefined) prvyNeprecitany ??= { ...u, precitanyDnes: false }
  }
  return dnesny ?? prvyNeprecitany
}

/** Koľko úryvkov knihy je prečítaných. */
export function postupKnihy(kniha: Kniha, stav: KnihyStav): { precitane: number; spolu: number } {
  const ids = new Set(stav.precitane.map((p) => p.uryvok))
  return { precitane: kniha.uryvky.filter((u) => ids.has(u.id)).length, spolu: kniha.uryvky.length }
}

/** Neprečítané úryvky má už len jedna kniha (alebo žiadna) → treba spracovať ďalšie z rebríčka. */
export function trebaNacitat(knihy: KnihySubor, stav: KnihyStav): boolean {
  const ids = new Set(stav.precitane.map((p) => p.uryvok))
  return knihy.knihy.filter((k) => k.uryvky.some((u) => !ids.has(u.id))).length <= 1
}

export function jeOblubeny(stav: KnihyStav, id: string): boolean {
  return stav.oblubene.includes(id)
}

// ---------- úpravy stavu ----------

export function oznacPrecitany(d: KnihyStav, id: string, dnes: string): KnihyStav {
  if (d.precitane.some((p) => p.uryvok === id)) return d
  return normalizujStav({ ...d, precitane: [...d.precitane, { uryvok: id, datum: dnes }] })
}

export function zrusPrecitany(d: KnihyStav, id: string): KnihyStav {
  return { ...d, precitane: d.precitane.filter((p) => p.uryvok !== id) }
}

export function prepniOblubeny(d: KnihyStav, id: string): KnihyStav {
  const oblubene = d.oblubene.includes(id) ? d.oblubene.filter((x) => x !== id) : [...d.oblubene, id]
  return normalizujStav({ ...d, oblubene })
}

/** Obľúbené úryvky, ktoré sú ešte v knihy.json (v poradí čítania). */
export function oblubeneUryvky(knihy: KnihySubor, stav: KnihyStav): { kniha: Kniha; uryvok: Uryvok }[] {
  const ids = new Set(stav.oblubene)
  return knihy.knihy.flatMap((kniha) => kniha.uryvky.filter((u) => ids.has(u.id)).map((uryvok) => ({ kniha, uryvok })))
}
