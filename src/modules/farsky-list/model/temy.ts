// Témy na Farský list: typy, čítanie/zápis farsky-list-plan.json a úpravy plánu.
// Formát je popísaný v SCHEMA.md a musí sa dodržať presne.

import { jePondelok, pondelokTyzdna, pridajDni } from '../../../lib/datum'
import { ChybaFormatu, cislo, jedenZ, naText, novyKluc, obj, overVerziu, parsujText, pole, text } from '../../../lib/json'

export const SUBOR_PLAN = 'farsky-list-plan.json'

export const STAVY_TEMY = ['napad', 'plan', 'pouzite'] as const
export type StavTemy = (typeof STAVY_TEMY)[number]

export const NAZVY_STAVOV: Record<StavTemy, string> = {
  napad: 'Nápad',
  plan: 'Plán',
  pouzite: 'Použité',
}

/** PDF v OneDrive; text z neho použije skill fl pri písaní listu. */
export interface Priloha {
  /** pôvodný názov súboru */
  nazov: string
  /** cesta od koreňa OneDrive, napr. "Pastoracia-app/prilohy/2026-11-02/dekan.pdf" */
  cesta: string
  webUrl: string
}

export interface Tema {
  id: string
  nazov: string
  zdroje: string[]
  poznamka: string
  poradie: number
  stav: StavTemy
  prilohy: Priloha[]
}

export interface Tyzden {
  pondelok: string
  temy: Tema[]
  poznamka: string
  prilohy: Priloha[]
}

export interface PlanSubor {
  verzia: 1
  tyzdne: Tyzden[]
}

export function prazdnyPlan(): PlanSubor {
  return { verzia: 1, tyzdne: [] }
}

// ---------- čítanie a zápis súboru ----------

function parsujPrilohy(v: unknown, c: string): Priloha[] {
  return pole(v, c).map((x, i) => {
    const o = obj(x, `${c}[${i}]`)
    const cesta = text(o.cesta, `${c}[${i}].cesta`)
    if (cesta === '') throw new ChybaFormatu(`${c}[${i}].cesta`, 'chýba cesta')
    return { nazov: text(o.nazov, `${c}[${i}].nazov`), cesta, webUrl: text(o.webUrl, `${c}[${i}].webUrl`) }
  })
}

const kopiaPriloh = (p: Priloha[]): Priloha[] => p.map((x) => ({ nazov: x.nazov, cesta: x.cesta, webUrl: x.webUrl }))

export function parsujPlan(s: string): PlanSubor {
  const koren = obj(parsujText(s, SUBOR_PLAN), SUBOR_PLAN)
  overVerziu(koren, SUBOR_PLAN)
  const videne = new Set<string>()
  const tyzdne = pole(koren.tyzdne, 'tyzdne').map((t, i): Tyzden => {
    const c = `tyzdne[${i}]`
    const o = obj(t, c)
    const pondelok = text(o.pondelok, `${c}.pondelok`)
    if (!jePondelok(pondelok)) throw new ChybaFormatu(`${c}.pondelok`, `"${pondelok}" nie je pondelok`)
    if (videne.has(pondelok)) throw new ChybaFormatu('tyzdne', `týždeň ${pondelok} je tam viackrát`)
    videne.add(pondelok)
    return {
      pondelok,
      temy: pole(o.temy, `${c}.temy`).map((tm, j) => {
        const ct = `${c}.temy[${j}]`
        const to = obj(tm, ct)
        const id = text(to.id, `${ct}.id`)
        if (id === '') throw new ChybaFormatu(`${ct}.id`, 'chýba id')
        return {
          id,
          nazov: text(to.nazov, `${ct}.nazov`),
          zdroje: pole(to.zdroje, `${ct}.zdroje`).map((z, k) => text(z, `${ct}.zdroje[${k}]`)),
          poznamka: text(to.poznamka, `${ct}.poznamka`),
          poradie: to.poradie === undefined ? j + 1 : cislo(to.poradie, `${ct}.poradie`),
          stav: jedenZ(to.stav, STAVY_TEMY, `${ct}.stav`),
          prilohy: parsujPrilohy(to.prilohy, `${ct}.prilohy`),
        }
      }),
      poznamka: text(o.poznamka, `${c}.poznamka`),
      prilohy: parsujPrilohy(o.prilohy, `${c}.prilohy`),
    }
  })
  return normalizujPlan({ verzia: 1, tyzdne })
}

export function serializujPlan(plan: PlanSubor): string {
  return naText(normalizujPlan(plan))
}

/** Pevné poradie kľúčov, zoradenie, poradie 1..n a vynechanie prázdnych týždňov. */
export function normalizujPlan(plan: PlanSubor): PlanSubor {
  return {
    verzia: 1,
    tyzdne: plan.tyzdne
      .map((t) => ({
        pondelok: t.pondelok,
        temy: [...t.temy]
          .sort((a, b) => a.poradie - b.poradie)
          .map((tm, i) => ({
            id: tm.id,
            nazov: tm.nazov,
            zdroje: [...tm.zdroje],
            poznamka: tm.poznamka,
            poradie: i + 1,
            stav: tm.stav,
            prilohy: kopiaPriloh(tm.prilohy),
          })),
        poznamka: t.poznamka,
        prilohy: kopiaPriloh(t.prilohy),
      }))
      .filter((t) => t.temy.length > 0 || t.poznamka.trim() !== '' || t.prilohy.length > 0)
      .sort((a, b) => a.pondelok.localeCompare(b.pondelok)),
  }
}

// ---------- úpravy plánu ----------

export function najdiTyzden(plan: PlanSubor, pondelok: string): Tyzden {
  return plan.tyzdne.find((t) => t.pondelok === pondelok) ?? { pondelok, temy: [], poznamka: '', prilohy: [] }
}

function nahradTyzden(plan: PlanSubor, t: Tyzden): PlanSubor {
  return normalizujPlan({ verzia: 1, tyzdne: [...plan.tyzdne.filter((x) => x.pondelok !== t.pondelok), t] })
}

export function najdiTemu(plan: PlanSubor, id: string): { tyzden: Tyzden; tema: Tema } | undefined {
  for (const tyzden of plan.tyzdne) {
    const tema = tyzden.temy.find((t) => t.id === id)
    if (tema) return { tyzden, tema }
  }
  return undefined
}

export function novyIdTemy(): string {
  return `t-${novyKluc()}`
}

export interface TemaForm {
  nazov: string
  /** jeden odkaz na riadok */
  zdroje: string
  poznamka: string
  stav: StavTemy
  prilohy: Priloha[]
}

export function temaNaFormular(t?: Tema): TemaForm {
  return {
    nazov: t?.nazov ?? '',
    zdroje: (t?.zdroje ?? []).join('\n'),
    poznamka: t?.poznamka ?? '',
    stav: t?.stav ?? 'napad',
    prilohy: t?.prilohy ?? [],
  }
}

export function validujTemu(f: TemaForm): string[] {
  return f.nazov.trim() === '' ? ['Zadaj názov témy.'] : []
}

function zdrojeZTextu(s: string): string[] {
  return s.split(/\r?\n/).map((z) => z.trim()).filter((z) => z !== '')
}

/** Pridá tému na koniec týždňa. Vráti nový plán aj id témy. */
export function pridajTemu(plan: PlanSubor, pondelok: string, f: TemaForm): { plan: PlanSubor; id: string } {
  if (!jePondelok(pondelok)) throw new Error(`${pondelok} nie je pondelok`)
  const t = najdiTyzden(plan, pondelok)
  const id = novyIdTemy()
  const tema: Tema = {
    id,
    nazov: f.nazov.trim(),
    zdroje: zdrojeZTextu(f.zdroje),
    poznamka: f.poznamka,
    poradie: t.temy.length + 1,
    stav: f.stav,
    prilohy: f.prilohy,
  }
  return { plan: nahradTyzden(plan, { ...t, temy: [...t.temy, tema] }), id }
}

export function upravTemu(plan: PlanSubor, id: string, f: TemaForm): PlanSubor {
  const n = najdiTemu(plan, id)
  if (!n) return plan
  const tema = { ...n.tema, nazov: f.nazov.trim(), zdroje: zdrojeZTextu(f.zdroje), poznamka: f.poznamka, stav: f.stav, prilohy: f.prilohy }
  return nahradTyzden(plan, { ...n.tyzden, temy: n.tyzden.temy.map((t) => (t.id === id ? tema : t)) })
}

export function zmazTemu(plan: PlanSubor, id: string): PlanSubor {
  const n = najdiTemu(plan, id)
  if (!n) return plan
  return nahradTyzden(plan, { ...n.tyzden, temy: n.tyzden.temy.filter((t) => t.id !== id) })
}

/** Presunie tému na koniec iného týždňa. */
export function presunTemu(plan: PlanSubor, id: string, naPondelok: string): PlanSubor {
  if (!jePondelok(naPondelok)) throw new Error(`${naPondelok} nie je pondelok`)
  const n = najdiTemu(plan, id)
  if (!n || n.tyzden.pondelok === naPondelok) return plan
  const bez = nahradTyzden(plan, { ...n.tyzden, temy: n.tyzden.temy.filter((t) => t.id !== id) })
  const ciel = najdiTyzden(bez, naPondelok)
  return nahradTyzden(bez, { ...ciel, temy: [...ciel.temy, { ...n.tema, poradie: ciel.temy.length + 1 }] })
}

/** Presunie tému (aj v rámci týždňa) tak, aby v cieľovom týždni bola na mieste `index` (0 = prvá). */
export function presunTemuNa(plan: PlanSubor, id: string, naPondelok: string, index: number): PlanSubor {
  if (!jePondelok(naPondelok)) throw new Error(`${naPondelok} nie je pondelok`)
  const n = najdiTemu(plan, id)
  if (!n) return plan
  const bez = nahradTyzden(plan, { ...n.tyzden, temy: n.tyzden.temy.filter((t) => t.id !== id) })
  const ciel = najdiTyzden(bez, naPondelok)
  const temy = [...ciel.temy]
  temy.splice(Math.max(0, Math.min(index, temy.length)), 0, n.tema)
  return nahradTyzden(bez, { ...ciel, temy: temy.map((t, i) => ({ ...t, poradie: i + 1 })) })
}

/** Nové poradie tém v týždni (po ťahaní). `ids` = všetky id tém v novom poradí. */
export function zoradTemy(plan: PlanSubor, pondelok: string, ids: string[]): PlanSubor {
  const t = najdiTyzden(plan, pondelok)
  const poradie = new Map(ids.map((id, i) => [id, i + 1]))
  if (t.temy.length !== ids.length || t.temy.some((tm) => !poradie.has(tm.id))) {
    throw new Error('Zoznam id nesedí s témami týždňa')
  }
  return nahradTyzden(plan, { ...t, temy: t.temy.map((tm) => ({ ...tm, poradie: poradie.get(tm.id)! })) })
}

export function dalsiStav(s: StavTemy): StavTemy {
  return STAVY_TEMY[(STAVY_TEMY.indexOf(s) + 1) % STAVY_TEMY.length]!
}

export function prepniStav(plan: PlanSubor, id: string): PlanSubor {
  const n = najdiTemu(plan, id)
  if (!n) return plan
  return nahradTyzden(plan, {
    ...n.tyzden,
    temy: n.tyzden.temy.map((t) => (t.id === id ? { ...t, stav: dalsiStav(t.stav) } : t)),
  })
}

export function pridajPrilohuTyzdna(plan: PlanSubor, pondelok: string, p: Priloha): PlanSubor {
  const t = najdiTyzden(plan, pondelok)
  return nahradTyzden(plan, { ...t, prilohy: [...t.prilohy.filter((x) => x.cesta !== p.cesta), p] })
}

export function odoberPrilohuTyzdna(plan: PlanSubor, pondelok: string, cesta: string): PlanSubor {
  const t = najdiTyzden(plan, pondelok)
  return nahradTyzden(plan, { ...t, prilohy: t.prilohy.filter((x) => x.cesta !== cesta) })
}

export function nastavPoznamkuTyzdna(plan: PlanSubor, pondelok: string, poznamka: string): PlanSubor {
  return nahradTyzden(plan, { ...najdiTyzden(plan, pondelok), poznamka })
}

/** Týždne na zobrazenie: od týždňa s `od` dopredu, `pocet` týždňov (aj prázdne). */
export function tyzdneDopredu(plan: PlanSubor, od: string, pocet = 8): Tyzden[] {
  const prvy = pondelokTyzdna(od)
  return Array.from({ length: pocet }, (_, i) => najdiTyzden(plan, pridajDni(prvy, i * 7)))
}

// ---------- zdieľanie odkazu (Android Share Target, iPhone Skratka, vloženie) ----------

const URL_RE = /https?:\/\/[^\s<>"]+/i

/** Z parametrov zdieľania vyrobí predvyplnený formulár. Telefóny dávajú odkaz raz do `url`, inokedy do `text`. */
export function temaZoZdielania(p: { title?: string; text?: string; url?: string }): TemaForm {
  const odkaz = (p.url ?? '').trim() || (URL_RE.exec(p.text ?? '')?.[0] ?? '')
  const zvysok = (p.text ?? '').replace(odkaz, '').trim()
  const nazov = (p.title ?? '').trim() || zvysok
  return {
    nazov,
    zdroje: odkaz,
    poznamka: nazov === zvysok ? '' : zvysok,
    stav: 'napad',
    prilohy: [],
  }
}
