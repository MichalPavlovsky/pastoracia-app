// Ľudia – komu sa ozvať: typy, čítanie/zápis ludia.json, úpravy, „na rade“ a zlúčenie.
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { formatDatum, jeCas, jeDatum, pridajDni } from '../../../lib/datum'
import { ChybaFormatu, cislo, naText, novyKluc, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'
import { zlucPodlaKluca, type Druh } from '../../../lib/zlucenie'
import type { VysledokZlucenia } from '../../../storage/types'

export const SUBOR_LUDIA = 'ludia.json'

export interface Pripomienka {
  id: string
  /** RRRR-MM-DD */
  datum: string
  /** HH:MM alebo "" */
  cas: string
  dovod: string
  hotovo: boolean
  /** id udalosti u poskytovateľa kalendára, alebo "" (zatiaľ vždy "") */
  idKalendara: string
}

export interface Clovek {
  id: string
  meno: string
  /** telefón, e-mail alebo čokoľvek iné */
  kontakt: string
  poznamka: string
  /** RRRR-MM-DD alebo "" */
  poslednyKontakt: string
  /** ozvať sa každých N dní od posledného kontaktu; 0 = nepravidelne */
  ozvatSaKazdych: number
  pripomienky: Pripomienka[]
}

export interface LudiaSubor {
  verzia: 1
  ludia: Clovek[]
}

export const INTERVALY: { dni: number; nazov: string }[] = [
  { dni: 0, nazov: 'nepravidelne' },
  { dni: 7, nazov: 'každý týždeň' },
  { dni: 14, nazov: 'každé 2 týždne' },
  { dni: 30, nazov: 'každý mesiac' },
  { dni: 60, nazov: 'každé 2 mesiace' },
  { dni: 91, nazov: 'každý štvrťrok' },
  { dni: 182, nazov: 'každý polrok' },
  { dni: 365, nazov: 'raz za rok' },
]

export function prazdniLudia(): LudiaSubor {
  return { verzia: 1, ludia: [] }
}

// ---------- čítanie a zápis súboru ----------

function datumAleboPrazdny(v: unknown, cesta: string): string {
  const d = text(v, cesta)
  if (d !== '' && !jeDatum(d)) throw new ChybaFormatu(cesta, `"${d}" nie je dátum RRRR-MM-DD`)
  return d
}

export function parsujLudi(s: string): LudiaSubor {
  const koren = obj(parsujText(s, SUBOR_LUDIA), SUBOR_LUDIA)
  overVerziu(koren, SUBOR_LUDIA)
  const videne = new Set<string>()
  const ludia = pole(koren.ludia, 'ludia').map((l, i): Clovek => {
    const c = `ludia[${i}]`
    const o = obj(l, c)
    const id = text(o.id, `${c}.id`)
    if (id === '') throw new ChybaFormatu(`${c}.id`, 'chýba id')
    if (videne.has(id)) throw new ChybaFormatu('ludia', `id ${id} je tam viackrát`)
    videne.add(id)
    const interval = o.ozvatSaKazdych === undefined ? 0 : cislo(o.ozvatSaKazdych, `${c}.ozvatSaKazdych`)
    if (!Number.isInteger(interval) || interval < 0) throw new ChybaFormatu(`${c}.ozvatSaKazdych`, 'očakávané celé číslo ≥ 0')
    return {
      id,
      meno: text(o.meno, `${c}.meno`),
      kontakt: text(o.kontakt, `${c}.kontakt`),
      poznamka: text(o.poznamka, `${c}.poznamka`),
      poslednyKontakt: datumAleboPrazdny(o.poslednyKontakt, `${c}.poslednyKontakt`),
      ozvatSaKazdych: interval,
      pripomienky: pole(o.pripomienky, `${c}.pripomienky`).map((p, j): Pripomienka => {
        const cp = `${c}.pripomienky[${j}]`
        const po = obj(p, cp)
        const pid = text(po.id, `${cp}.id`)
        if (pid === '') throw new ChybaFormatu(`${cp}.id`, 'chýba id')
        const datum = text(po.datum, `${cp}.datum`)
        if (!jeDatum(datum)) throw new ChybaFormatu(`${cp}.datum`, `"${datum}" nie je dátum RRRR-MM-DD`)
        const cas = text(po.cas, `${cp}.cas`)
        if (cas !== '' && !jeCas(cas)) throw new ChybaFormatu(`${cp}.cas`, `"${cas}" nie je čas HH:MM`)
        if (po.hotovo !== undefined && typeof po.hotovo !== 'boolean') throw new ChybaFormatu(`${cp}.hotovo`, 'očakávané true/false')
        return {
          id: pid,
          datum,
          cas,
          dovod: text(po.dovod, `${cp}.dovod`),
          hotovo: po.hotovo === true,
          idKalendara: text(po.idKalendara, `${cp}.idKalendara`),
        }
      }),
    }
  })
  return normalizujLudi({ verzia: 1, ludia })
}

export function serializujLudi(d: LudiaSubor): string {
  return naText(normalizujLudi(d))
}

const podlaMena = (a: Clovek, b: Clovek) => a.meno.localeCompare(b.meno, 'sk') || a.id.localeCompare(b.id)

/** Pevné poradie kľúčov; ľudia podľa mena, pripomienky podľa dátumu a času. */
export function normalizujLudi(d: LudiaSubor): LudiaSubor {
  return {
    verzia: 1,
    ludia: d.ludia
      .map((c) => ({
        id: c.id,
        meno: c.meno,
        kontakt: c.kontakt,
        poznamka: c.poznamka,
        poslednyKontakt: c.poslednyKontakt,
        ozvatSaKazdych: c.ozvatSaKazdych,
        pripomienky: c.pripomienky
          .map((p) => ({ id: p.id, datum: p.datum, cas: p.cas, dovod: p.dovod, hotovo: p.hotovo, idKalendara: p.idKalendara }))
          .sort((a, b) => a.datum.localeCompare(b.datum) || a.cas.localeCompare(b.cas) || a.id.localeCompare(b.id)),
      }))
      .sort(podlaMena),
  }
}

// ---------- úpravy ----------

export interface ClovekForm {
  meno: string
  kontakt: string
  poznamka: string
  poslednyKontakt: string
  ozvatSaKazdych: number
}

export function clovekNaFormular(c?: Clovek): ClovekForm {
  return {
    meno: c?.meno ?? '',
    kontakt: c?.kontakt ?? '',
    poznamka: c?.poznamka ?? '',
    poslednyKontakt: c?.poslednyKontakt ?? '',
    ozvatSaKazdych: c?.ozvatSaKazdych ?? 0,
  }
}

/**
 * Nový človek zo Skratky (#/ludia/pridat): buď `meno` a `kontakt`, alebo `text`,
 * kde prvý riadok je meno a ďalšie riadky kontakty (berie sa prvý neprázdny).
 */
export function clovekZoZdielania(p: { meno?: string; kontakt?: string; text?: string }): ClovekForm {
  const riadky = (p.text ?? '')
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r !== '')
  return {
    ...clovekNaFormular(),
    meno: (p.meno ?? riadky[0] ?? '').trim(),
    kontakt: (p.kontakt ?? riadky[1] ?? '').trim(),
  }
}

export function validujCloveka(f: ClovekForm): string[] {
  const chyby: string[] = []
  if (f.meno.trim() === '') chyby.push('Zadaj meno.')
  if (f.poslednyKontakt !== '' && !jeDatum(f.poslednyKontakt)) chyby.push('Neplatný dátum posledného kontaktu.')
  return chyby
}

function nahrad(d: LudiaSubor, id: string, zmena: (c: Clovek) => Clovek): LudiaSubor {
  return normalizujLudi({ verzia: 1, ludia: d.ludia.map((c) => (c.id === id ? zmena(c) : c)) })
}

export function najdiCloveka(d: LudiaSubor, id: string): Clovek | undefined {
  return d.ludia.find((c) => c.id === id)
}

export function pridajCloveka(d: LudiaSubor, f: ClovekForm): { data: LudiaSubor; id: string } {
  const id = `c-${novyKluc()}`
  const c: Clovek = {
    id,
    meno: f.meno.trim(),
    kontakt: f.kontakt.trim(),
    poznamka: f.poznamka,
    poslednyKontakt: f.poslednyKontakt,
    ozvatSaKazdych: f.ozvatSaKazdych,
    pripomienky: [],
  }
  return { data: normalizujLudi({ verzia: 1, ludia: [...d.ludia, c] }), id }
}

export function upravCloveka(d: LudiaSubor, id: string, f: ClovekForm): LudiaSubor {
  return nahrad(d, id, (c) => ({
    ...c,
    meno: f.meno.trim(),
    kontakt: f.kontakt.trim(),
    poznamka: f.poznamka,
    poslednyKontakt: f.poslednyKontakt,
    ozvatSaKazdych: f.ozvatSaKazdych,
  }))
}

export function zmazCloveka(d: LudiaSubor, id: string): LudiaSubor {
  return { verzia: 1, ludia: d.ludia.filter((c) => c.id !== id) }
}

export interface PripomienkaForm {
  datum: string
  cas: string
  dovod: string
}

export function validujPripomienku(f: PripomienkaForm): string[] {
  const chyby: string[] = []
  if (!jeDatum(f.datum)) chyby.push('Zadaj dátum.')
  if (f.cas !== '' && !jeCas(f.cas)) chyby.push('Neplatný čas.')
  return chyby
}

export function pridajPripomienku(d: LudiaSubor, idCloveka: string, f: PripomienkaForm): LudiaSubor {
  const p: Pripomienka = { id: `p-${novyKluc()}`, datum: f.datum, cas: f.cas, dovod: f.dovod.trim(), hotovo: false, idKalendara: '' }
  return nahrad(d, idCloveka, (c) => ({ ...c, pripomienky: [...c.pripomienky, p] }))
}

export function prepniHotovo(d: LudiaSubor, idCloveka: string, idPripomienky: string): LudiaSubor {
  return nahrad(d, idCloveka, (c) => ({
    ...c,
    pripomienky: c.pripomienky.map((p) => (p.id === idPripomienky ? { ...p, hotovo: !p.hotovo } : p)),
  }))
}

export function zmazPripomienku(d: LudiaSubor, idCloveka: string, idPripomienky: string): LudiaSubor {
  return nahrad(d, idCloveka, (c) => ({ ...c, pripomienky: c.pripomienky.filter((p) => p.id !== idPripomienky) }))
}

/** „Ozval som sa“: zapíše dátum kontaktu a prípadne odškrtne pripomienku, z ktorej to vzišlo. */
export function ozvalSom(d: LudiaSubor, idCloveka: string, datum: string, idPripomienky?: string): LudiaSubor {
  return nahrad(d, idCloveka, (c) => ({
    ...c,
    poslednyKontakt: c.poslednyKontakt > datum ? c.poslednyKontakt : datum,
    pripomienky: c.pripomienky.map((p) => (p.id === idPripomienky ? { ...p, hotovo: true } : p)),
  }))
}

// ---------- komu sa ozvať ----------

export interface NaRade {
  clovek: Clovek
  /** kedy sa ozvať */
  datum: string
  cas: string
  dovod: string
  /** pripomienka, z ktorej to je; inak ide o pravidelný kontakt */
  idPripomienky: string
  meskanie: boolean
}

/** Kedy sa ozvať podľa intervalu; "" ak nepravidelne. Bez posledného kontaktu → hneď (dnes). */
export function dalsiPravidelny(c: Clovek, dnesny: string): string {
  if (c.ozvatSaKazdych <= 0) return ''
  return c.poslednyKontakt === '' ? dnesny : pridajDni(c.poslednyKontakt, c.ozvatSaKazdych)
}

/** Čo je na rade do `dopredu` dní (vrátane zmeškaného), zoradené od najstaršieho. */
export function naRade(d: LudiaSubor, dnesny: string, dopredu = 7): NaRade[] {
  const hranica = pridajDni(dnesny, dopredu)
  const vysledok: NaRade[] = []
  for (const c of d.ludia) {
    for (const p of c.pripomienky) {
      if (p.hotovo || p.datum > hranica) continue
      vysledok.push({ clovek: c, datum: p.datum, cas: p.cas, dovod: p.dovod, idPripomienky: p.id, meskanie: p.datum < dnesny })
    }
    const pravidelne = dalsiPravidelny(c, dnesny)
    if (pravidelne !== '' && pravidelne <= hranica) {
      vysledok.push({ clovek: c, datum: pravidelne, cas: '', dovod: 'pravidelný kontakt', idPripomienky: '', meskanie: pravidelne < dnesny })
    }
  }
  return vysledok.sort(
    (a, b) => a.datum.localeCompare(b.datum) || a.cas.localeCompare(b.cas) || a.clovek.meno.localeCompare(b.clovek.meno, 'sk'),
  )
}

export function nazovIntervalu(dni: number): string {
  return INTERVALY.find((i) => i.dni === dni)?.nazov ?? `každých ${dni} dní`
}

/** Odkaz na zavolanie alebo e-mail; "" ak kontakt nie je ani jedno. */
export function odkazKontaktu(kontakt: string): string {
  const k = kontakt.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)) return `mailto:${k}`
  const cisla = k.replace(/[\s/()-]/g, '')
  if (/^\+?\d{6,15}$/.test(cisla)) return `tel:${cisla}`
  return ''
}

// ---------- zlúčenie z dvoch zariadení ----------

const SLOVESA: Record<Druh, string> = { pridane: 'Nový v zozname', zmenene: 'Zmena', zmazane: 'Zmazané' }

export function zlucLudi(zaklad: LudiaSubor, moje: LudiaSubor, ich: LudiaSubor): VysledokZlucenia<LudiaSubor> {
  const mapa = (d: LudiaSubor) => new Map(normalizujLudi(d).ludia.map((c) => [c.id, c]))
  const z = zlucPodlaKluca(mapa(zaklad), mapa(moje), mapa(ich))
  const zakladni = mapa(zaklad)
  return {
    data: normalizujLudi({ verzia: 1, ludia: [...z.vysledok.values()] }),
    zmenyZInych: z.zInych.map((x) =>
      x.druh === 'zmazane'
        ? `${SLOVESA.zmazane}: ${zakladni.get(x.kluc)?.meno ?? x.kluc}`
        : `${SLOVESA[x.druh]}: ${x.ich!.meno}` + (x.ich!.poslednyKontakt ? ` (posledný kontakt ${formatDatum(x.ich!.poslednyKontakt)})` : ''),
    ),
    konflikty: z.konflikty.map(
      (x) =>
        `${(x.moje ?? x.ich)?.meno ?? x.kluc}: zmena na oboch zariadeniach. ` +
        `Ponechaná ${x.ponechane === 'moje' ? 'tvoja' : 'druhá'} verzia.`,
    ),
  }
}
