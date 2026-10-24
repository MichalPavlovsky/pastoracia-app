// Intencie Sopkovce: typy, čítanie/zápis sopkovce-intencie.json a prevod formulár ↔ JSON.
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { casNaMinuty, jeCas, jeDatum, pondelokTyzdna, pridajDni, posunCas } from '../../../lib/datum'
import { ChybaFormatu, jedenZ, naText, novyKluc, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'

export const SUBOR_INTENCIE = 'sopkovce-intencie.json'

export const TYPY_BOHOSLUZBY = ['liturgia', 'moleben', 'panychida', 'ine'] as const
export type TypBohosluzby = (typeof TYPY_BOHOSLUZBY)[number]

export const ZNAKY = ['*', '+'] as const
export type Znak = (typeof ZNAKY)[number]

export interface Intencia {
  znak: Znak
  text: string
  objednal: string
  poznamka: string
}

export interface Bohosluzba {
  cas: string
  typ: TypBohosluzby
  intencie: Intencia[]
}

export interface Spoved {
  od: string
  do: string
  poznamka: string
}

export interface Den {
  datum: string
  bohosluzby: Bohosluzba[]
  spovede: Spoved[]
  oznam: string
}

export interface IntencieSubor {
  verzia: 1
  dni: Den[]
}

export const NAZVY_TYPOV: Record<TypBohosluzby, string> = {
  liturgia: 'Liturgia',
  moleben: 'Moleben',
  panychida: 'Panychída',
  ine: 'Iné',
}

export function prazdnySubor(): IntencieSubor {
  return { verzia: 1, dni: [] }
}

// ---------- čítanie a zápis súboru ----------

export function parsujIntencie(s: string): IntencieSubor {
  const koren = obj(parsujText(s, SUBOR_INTENCIE), SUBOR_INTENCIE)
  overVerziu(koren, SUBOR_INTENCIE)
  const dni = pole(koren.dni, 'dni').map((d, i) => parsujDen(d, `dni[${i}]`))
  const videne = new Set<string>()
  for (const d of dni) {
    if (videne.has(d.datum)) throw new ChybaFormatu('dni', `dátum ${d.datum} je tam viackrát`)
    videne.add(d.datum)
  }
  return normalizuj({ verzia: 1, dni })
}

function parsujDen(v: unknown, cesta: string): Den {
  const o = obj(v, cesta)
  const datum = text(o.datum, `${cesta}.datum`)
  if (!jeDatum(datum)) throw new ChybaFormatu(`${cesta}.datum`, `neplatný dátum "${datum}"`)
  return {
    datum,
    bohosluzby: pole(o.bohosluzby, `${cesta}.bohosluzby`).map((b, i) => {
      const c = `${cesta}.bohosluzby[${i}]`
      const bo = obj(b, c)
      const cas = text(bo.cas, `${c}.cas`)
      if (!jeCas(cas)) throw new ChybaFormatu(`${c}.cas`, `neplatný čas "${cas}"`)
      return {
        cas,
        typ: jedenZ(bo.typ, TYPY_BOHOSLUZBY, `${c}.typ`),
        intencie: pole(bo.intencie, `${c}.intencie`).map((it, j) => {
          const ci = `${c}.intencie[${j}]`
          const io = obj(it, ci)
          return {
            znak: jedenZ(io.znak, ZNAKY, `${ci}.znak`),
            text: text(io.text, `${ci}.text`),
            objednal: text(io.objednal, `${ci}.objednal`),
            poznamka: text(io.poznamka, `${ci}.poznamka`),
          }
        }),
      }
    }),
    spovede: pole(o.spovede, `${cesta}.spovede`).map((sp, i) => {
      const c = `${cesta}.spovede[${i}]`
      const so = obj(sp, c)
      const od = text(so.od, `${c}.od`)
      const doCas = text(so.do, `${c}.do`)
      if (!jeCas(od)) throw new ChybaFormatu(`${c}.od`, `neplatný čas "${od}"`)
      if (doCas !== '' && !jeCas(doCas)) throw new ChybaFormatu(`${c}.do`, `neplatný čas "${doCas}"`)
      return { od, do: doCas, poznamka: text(so.poznamka, `${c}.poznamka`) }
    }),
    oznam: text(o.oznam, `${cesta}.oznam`),
  }
}

export function serializujIntencie(subor: IntencieSubor): string {
  return naText(normalizuj(subor))
}

/** Pevné poradie kľúčov, zoradenie a vynechanie prázdnych dní – presne podľa SCHEMA.md. */
export function normalizuj(subor: IntencieSubor): IntencieSubor {
  return {
    verzia: 1,
    dni: subor.dni
      .map((d) => ({
        datum: d.datum,
        bohosluzby: [...d.bohosluzby]
          .sort((a, b) => a.cas.localeCompare(b.cas))
          .map((b) => ({
            cas: b.cas,
            typ: b.typ,
            intencie: b.intencie.map((i) => ({ znak: i.znak, text: i.text, objednal: i.objednal, poznamka: i.poznamka })),
          })),
        spovede: [...d.spovede]
          .sort((a, b) => a.od.localeCompare(b.od))
          .map((s) => ({ od: s.od, do: s.do, poznamka: s.poznamka })),
        oznam: d.oznam,
      }))
      .filter((d) => !jePrazdnyDen(d))
      .sort((a, b) => a.datum.localeCompare(b.datum)),
  }
}

export function jePrazdnyDen(d: Den): boolean {
  return d.bohosluzby.length === 0 && d.spovede.length === 0 && d.oznam.trim() === ''
}

// ---------- formulár ----------

// Formulár má navyše `kluc` pre React zoznamy; do JSON sa neukladá.
export interface IntenciaForm extends Intencia {
  kluc: string
}
export interface BohosluzbaForm {
  kluc: string
  cas: string
  typ: TypBohosluzby
  intencie: IntenciaForm[]
}
export interface SpovedForm extends Spoved {
  kluc: string
}
export interface DenForm {
  datum: string
  bohosluzby: BohosluzbaForm[]
  spovede: SpovedForm[]
  oznam: string
}

export interface ChybaFormulara {
  cesta: string
  sprava: string
}

export function najdiDen(subor: IntencieSubor, datum: string): Den | undefined {
  return subor.dni.find((d) => d.datum === datum)
}

export function denNaFormular(datum: string, den?: Den): DenForm {
  return {
    datum,
    bohosluzby: (den?.bohosluzby ?? []).map(bohosluzbaNaFormular),
    spovede: (den?.spovede ?? []).map((s) => ({ ...s, kluc: novyKluc() })),
    oznam: den?.oznam ?? '',
  }
}

export function bohosluzbaNaFormular(b: Bohosluzba): BohosluzbaForm {
  return { kluc: novyKluc(), cas: b.cas, typ: b.typ, intencie: b.intencie.map((i) => ({ ...i, kluc: novyKluc() })) }
}

export function novaIntencia(znak: Znak = '+'): IntenciaForm {
  return { kluc: novyKluc(), znak, text: '', objednal: '', poznamka: '' }
}

const prazdnaIntencia = (i: Intencia) => i.text.trim() === '' && i.objednal.trim() === '' && i.poznamka.trim() === ''
const prazdnaSpoved = (s: Spoved) => s.od === '' && s.do === '' && s.poznamka.trim() === ''

export function validujFormular(f: DenForm): ChybaFormulara[] {
  const chyby: ChybaFormulara[] = []
  if (!jeDatum(f.datum)) chyby.push({ cesta: 'datum', sprava: 'Neplatný dátum.' })
  f.bohosluzby.forEach((b, i) => {
    if (!jeCas(b.cas)) chyby.push({ cesta: `bohosluzby.${i}.cas`, sprava: 'Zadaj čas bohoslužby (HH:MM).' })
    b.intencie.forEach((it, j) => {
      if (!prazdnaIntencia(it) && it.text.trim() === '') {
        chyby.push({ cesta: `bohosluzby.${i}.intencie.${j}.text`, sprava: 'Chýba text intencie.' })
      }
    })
  })
  f.spovede.forEach((s, i) => {
    if (prazdnaSpoved(s)) return
    if (!jeCas(s.od)) chyby.push({ cesta: `spovede.${i}.od`, sprava: 'Zadaj začiatok spovede (HH:MM).' })
    if (s.do !== '' && !jeCas(s.do)) chyby.push({ cesta: `spovede.${i}.do`, sprava: 'Neplatný koniec spovede.' })
    if (jeCas(s.od) && jeCas(s.do) && casNaMinuty(s.do) <= casNaMinuty(s.od)) {
      chyby.push({ cesta: `spovede.${i}.do`, sprava: 'Koniec spovede musí byť po začiatku.' })
    }
  })
  return chyby
}

/**
 * Formulár → deň v JSON. Vráti `null`, ak je deň prázdny (vtedy sa neukladá).
 * Prázdne riadky intencií a spovedí sa vynechajú, text intencie sa nemení.
 * Volaj až po `validujFormular` bez chýb.
 */
export function formularNaDen(f: DenForm): Den | null {
  const den: Den = {
    datum: f.datum,
    bohosluzby: f.bohosluzby.map((b) => ({
      cas: b.cas,
      typ: b.typ,
      intencie: b.intencie
        .filter((i) => !prazdnaIntencia(i))
        .map((i) => ({ znak: i.znak, text: i.text, objednal: i.objednal, poznamka: i.poznamka })),
    })),
    spovede: f.spovede.filter((s) => !prazdnaSpoved(s)).map((s) => ({ od: s.od, do: s.do, poznamka: s.poznamka })),
    oznam: f.oznam.trim() === '' ? '' : f.oznam,
  }
  return jePrazdnyDen(den) ? null : normalizuj({ verzia: 1, dni: [den] }).dni[0]!
}

/** Uloží (alebo zmaže, ak je prázdny) deň zo formulára. */
export function ulozDen(subor: IntencieSubor, f: DenForm): { subor: IntencieSubor; chyby: ChybaFormulara[] } {
  const chyby = validujFormular(f)
  if (chyby.length > 0) return { subor, chyby }
  return { subor: nahradDen(subor, f.datum, formularNaDen(f)), chyby }
}

export function nahradDen(subor: IntencieSubor, datum: string, den: Den | null): IntencieSubor {
  const dni = subor.dni.filter((d) => d.datum !== datum)
  if (den) dni.push(den)
  return normalizuj({ verzia: 1, dni })
}

/** Skopíruje bohoslužbu na iný deň (pridá ju k tamojším bohoslužbám). */
export function kopirujBohosluzbu(
  subor: IntencieSubor,
  zDatumu: string,
  index: number,
  naDatum: string,
  sIntenciami: boolean,
): IntencieSubor {
  const b = najdiDen(subor, zDatumu)?.bohosluzby[index]
  if (!b) throw new Error(`Bohoslužba ${zDatumu} #${index} neexistuje`)
  const kopia: Bohosluzba = { cas: b.cas, typ: b.typ, intencie: sIntenciami ? b.intencie.map((i) => ({ ...i })) : [] }
  const ciel = najdiDen(subor, naDatum) ?? { datum: naDatum, bohosluzby: [], spovede: [], oznam: '' }
  return nahradDen(subor, naDatum, { ...ciel, bohosluzby: [...ciel.bohosluzby, kopia] })
}

// ---------- rýchle voľby ----------

export function novaBohosluzba(cas: string, typ: TypBohosluzby = 'liturgia'): BohosluzbaForm {
  return { kluc: novyKluc(), cas, typ, intencie: [novaIntencia()] }
}

export function molebenPred(cas: string, minut = 20): BohosluzbaForm {
  return { kluc: novyKluc(), cas: posunCas(cas, -minut), typ: 'moleben', intencie: [] }
}

export function spovedPred(cas: string, minut = 60): SpovedForm {
  return { kluc: novyKluc(), od: posunCas(cas, -minut), do: '', poznamka: '' }
}

export interface RychlaVolba {
  nazov: string
  bohosluzba: () => BohosluzbaForm
}

export const RYCHLE_BOHOSLUZBY: RychlaVolba[] = [
  { nazov: 'Liturgia 16:30', bohosluzba: () => novaBohosluzba('16:30') },
  { nazov: 'Liturgia 17:00', bohosluzba: () => novaBohosluzba('17:00') },
  { nazov: 'Nedeľa 8:00', bohosluzba: () => novaBohosluzba('08:00') },
]

/** Prvá liturgia dňa – podľa nej sa počíta moleben a spoveď „pred liturgiou“. */
export function prvaLiturgia(f: DenForm): BohosluzbaForm | undefined {
  return f.bohosluzby
    .filter((b) => b.typ === 'liturgia' && jeCas(b.cas))
    .sort((a, b) => a.cas.localeCompare(b.cas))[0]
}

// ---------- zobrazenie ----------

/** „+Mária, Ján“ */
export function formatIntencia(i: Intencia): string {
  return `${i.znak}${i.text}`
}

export interface ZnackyDna {
  bohosluzby: number
  spoved: boolean
  oznam: boolean
}

export function znackyDna(den?: Den): ZnackyDna {
  return {
    bohosluzby: den?.bohosluzby.length ?? 0,
    spoved: (den?.spovede.length ?? 0) > 0,
    oznam: (den?.oznam.trim() ?? '') !== '',
  }
}

/** 7 dní od pondelka týždňa, v ktorom je `datum`. */
export function dniTyzdna(subor: IntencieSubor, datum: string): { datum: string; den?: Den }[] {
  const po = pondelokTyzdna(datum)
  return Array.from({ length: 7 }, (_, i) => {
    const d = pridajDni(po, i)
    return { datum: d, den: najdiDen(subor, d) }
  })
}
