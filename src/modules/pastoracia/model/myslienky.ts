// Myšlienky a nápady: typy, čítanie/zápis pastoracia-myslienky.json, úpravy a zlúčenie.
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { formatDatum, jeDatum } from '../../../lib/datum'
import { ChybaFormatu, jedenZ, naText, novyKluc, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'
import { zlucPodlaKluca, type Druh } from '../../../lib/zlucenie'
import type { VysledokZlucenia } from '../../../storage/types'

export const SUBOR_MYSLIENKY = 'pastoracia-myslienky.json'

export const STAVY_MYSLIENKY = ['napad', 'rozpracovane', 'hotove'] as const
export type StavMyslienky = (typeof STAVY_MYSLIENKY)[number]

export const NAZVY_STAVOV: Record<StavMyslienky, string> = {
  napad: 'Nápad',
  rozpracovane: 'Rozpracované',
  hotove: 'Hotové',
}

export interface Myslienka {
  id: string
  nazov: string
  text: string
  stitky: string[]
  zdroje: string[]
  /** RRRR-MM-DD */
  vytvorene: string
  stav: StavMyslienky
}

export interface MyslienkySubor {
  verzia: 1
  myslienky: Myslienka[]
}

export function prazdneMyslienky(): MyslienkySubor {
  return { verzia: 1, myslienky: [] }
}

// ---------- čítanie a zápis súboru ----------

export function parsujMyslienky(s: string): MyslienkySubor {
  const koren = obj(parsujText(s, SUBOR_MYSLIENKY), SUBOR_MYSLIENKY)
  overVerziu(koren, SUBOR_MYSLIENKY)
  const videne = new Set<string>()
  const myslienky = pole(koren.myslienky, 'myslienky').map((m, i): Myslienka => {
    const c = `myslienky[${i}]`
    const o = obj(m, c)
    const id = text(o.id, `${c}.id`)
    if (id === '') throw new ChybaFormatu(`${c}.id`, 'chýba id')
    if (videne.has(id)) throw new ChybaFormatu('myslienky', `id ${id} je tam viackrát`)
    videne.add(id)
    const vytvorene = text(o.vytvorene, `${c}.vytvorene`)
    if (!jeDatum(vytvorene)) throw new ChybaFormatu(`${c}.vytvorene`, `"${vytvorene}" nie je dátum RRRR-MM-DD`)
    return {
      id,
      nazov: text(o.nazov, `${c}.nazov`),
      text: text(o.text, `${c}.text`),
      stitky: pole(o.stitky, `${c}.stitky`).map((x, k) => text(x, `${c}.stitky[${k}]`)),
      zdroje: pole(o.zdroje, `${c}.zdroje`).map((x, k) => text(x, `${c}.zdroje[${k}]`)),
      vytvorene,
      stav: jedenZ(o.stav, STAVY_MYSLIENKY, `${c}.stav`),
    }
  })
  return normalizujMyslienky({ verzia: 1, myslienky })
}

export function serializujMyslienky(d: MyslienkySubor): string {
  return naText(normalizujMyslienky(d))
}

/** Pevné poradie kľúčov; zoradené od najnovšej (vytvorene zostupne, potom id). */
export function normalizujMyslienky(d: MyslienkySubor): MyslienkySubor {
  return {
    verzia: 1,
    myslienky: d.myslienky
      .map((m) => ({
        id: m.id,
        nazov: m.nazov,
        text: m.text,
        stitky: [...m.stitky],
        zdroje: [...m.zdroje],
        vytvorene: m.vytvorene,
        stav: m.stav,
      }))
      .sort((a, b) => b.vytvorene.localeCompare(a.vytvorene) || a.id.localeCompare(b.id)),
  }
}

// ---------- úpravy ----------

export interface MyslienkaForm {
  nazov: string
  text: string
  /** oddelené čiarkou */
  stitky: string
  /** jeden odkaz na riadok */
  zdroje: string
  stav: StavMyslienky
}

export function myslienkaNaFormular(m?: Myslienka): MyslienkaForm {
  return {
    nazov: m?.nazov ?? '',
    text: m?.text ?? '',
    stitky: (m?.stitky ?? []).join(', '),
    zdroje: (m?.zdroje ?? []).join('\n'),
    stav: m?.stav ?? 'napad',
  }
}

export function validujMyslienku(f: MyslienkaForm): string[] {
  return f.nazov.trim() === '' && f.text.trim() === '' ? ['Napíš aspoň názov alebo text.'] : []
}

/** „advent, Rodiny ,advent“ → ["advent", "Rodiny"] (bez prázdnych a duplicít, bez ohľadu na veľkosť písmen) */
export function stitkyZTextu(s: string): string[] {
  const vysledok: string[] = []
  for (const st of s.split(',').map((x) => x.trim()).filter((x) => x !== '')) {
    if (!vysledok.some((v) => v.toLocaleLowerCase('sk') === st.toLocaleLowerCase('sk'))) vysledok.push(st)
  }
  return vysledok
}

function zdrojeZTextu(s: string): string[] {
  return s.split(/\r?\n/).map((z) => z.trim()).filter((z) => z !== '')
}

function zFormulara(f: MyslienkaForm): Pick<Myslienka, 'nazov' | 'text' | 'stitky' | 'zdroje' | 'stav'> {
  return { nazov: f.nazov.trim(), text: f.text, stitky: stitkyZTextu(f.stitky), zdroje: zdrojeZTextu(f.zdroje), stav: f.stav }
}

export function pridajMyslienku(d: MyslienkySubor, f: MyslienkaForm, vytvorene: string): { data: MyslienkySubor; id: string } {
  const id = `m-${novyKluc()}`
  return { data: normalizujMyslienky({ verzia: 1, myslienky: [...d.myslienky, { id, vytvorene, ...zFormulara(f) }] }), id }
}

export function upravMyslienku(d: MyslienkySubor, id: string, f: MyslienkaForm): MyslienkySubor {
  return normalizujMyslienky({
    verzia: 1,
    myslienky: d.myslienky.map((m) => (m.id === id ? { ...m, ...zFormulara(f) } : m)),
  })
}

export function zmazMyslienku(d: MyslienkySubor, id: string): MyslienkySubor {
  return { verzia: 1, myslienky: d.myslienky.filter((m) => m.id !== id) }
}

export function dalsiStav(s: StavMyslienky): StavMyslienky {
  return STAVY_MYSLIENKY[(STAVY_MYSLIENKY.indexOf(s) + 1) % STAVY_MYSLIENKY.length]!
}

export function prepniStav(d: MyslienkySubor, id: string): MyslienkySubor {
  return { verzia: 1, myslienky: d.myslienky.map((m) => (m.id === id ? { ...m, stav: dalsiStav(m.stav) } : m)) }
}

// ---------- hľadanie a filtre ----------

/** Všetky štítky (zoradené, bez duplicít podľa veľkosti písmen). */
export function vsetkyStitky(d: MyslienkySubor): string[] {
  return stitkyZTextu(d.myslienky.flatMap((m) => m.stitky).join(',')).sort((a, b) => a.localeCompare(b, 'sk'))
}

/** Bez diakritiky a malými písmenami – „Dušičky“ nájde aj „dusicky“. */
export function bezDiakritiky(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('sk')
}

export interface Filter {
  hladat: string
  stitok: string
  /** '' = všetky */
  stav: StavMyslienky | ''
}

export function filtruj(d: MyslienkySubor, f: Filter): Myslienka[] {
  const slova = bezDiakritiky(f.hladat).split(/\s+/).filter((x) => x !== '')
  const stitok = f.stitok.toLocaleLowerCase('sk')
  return d.myslienky.filter((m) => {
    if (f.stav !== '' && m.stav !== f.stav) return false
    if (stitok !== '' && !m.stitky.some((s) => s.toLocaleLowerCase('sk') === stitok)) return false
    const kde = bezDiakritiky([m.nazov, m.text, ...m.stitky, ...m.zdroje].join(' '))
    return slova.every((s) => kde.includes(s))
  })
}

// ---------- zdieľanie odkazu ----------

const URL_RE = /https?:\/\/[^\s<>"]+/i

export function myslienkaZoZdielania(p: { title?: string; text?: string; url?: string }): MyslienkaForm {
  const odkaz = (p.url ?? '').trim() || (URL_RE.exec(p.text ?? '')?.[0] ?? '')
  const zvysok = (p.text ?? '').replace(odkaz, '').trim()
  const nazov = (p.title ?? '').trim() || zvysok
  return { nazov, text: nazov === zvysok ? '' : zvysok, stitky: '', zdroje: odkaz, stav: 'napad' }
}

// ---------- zlúčenie z dvoch zariadení ----------

const SLOVESA: Record<Druh, string> = { pridane: 'pridaná', zmenene: 'zmenená', zmazane: 'zmazaná' }

const meno = (m?: Myslienka) => (m ? `„${m.nazov || m.text.slice(0, 40)}“` : 'zmazaná')

export function zlucMyslienky(zaklad: MyslienkySubor, moje: MyslienkySubor, ich: MyslienkySubor): VysledokZlucenia<MyslienkySubor> {
  const mapa = (d: MyslienkySubor) => new Map(normalizujMyslienky(d).myslienky.map((m) => [m.id, m]))
  const z = zlucPodlaKluca(mapa(zaklad), mapa(moje), mapa(ich))
  const zakladne = mapa(zaklad)
  return {
    data: normalizujMyslienky({ verzia: 1, myslienky: [...z.vysledok.values()] }),
    zmenyZInych: z.zInych.map((x) =>
      x.druh === 'zmazane' ? `Myšlienka ${meno(zakladne.get(x.kluc))} zmazaná` : `Myšlienka ${SLOVESA[x.druh]}: ${meno(x.ich)} (${formatDatum(x.ich!.vytvorene)})`,
    ),
    konflikty: z.konflikty.map(
      (x) =>
        `Myšlienka ${meno(x.moje ?? x.ich)} zmenená na oboch zariadeniach. ` +
        `Ponechaná ${x.ponechane === 'moje' ? 'tvoja' : 'druhá'} verzia.`,
    ),
  }
}
