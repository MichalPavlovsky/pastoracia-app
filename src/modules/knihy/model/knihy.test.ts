import { describe, expect, it } from 'vitest'
import {
  dnesnyUryvok,
  oblubeneUryvky,
  oznacPrecitany,
  parsujKnihy,
  parsujStav,
  postupKnihy,
  prazdnyStav,
  prepniOblubeny,
  serializujStav,
  trebaNacitat,
  zlucStav,
  zrusPrecitany,
  type KnihyStav,
  type KnihySubor,
} from './knihy'

const kniha = (id: string, pocet: number) => ({
  id,
  nazov: id,
  autor: 'A',
  zdroj: `Knihy/${id}.pdf`,
  uryvky: Array.from({ length: pocet }, (_, i) => ({
    id: `${id}-${String(i + 1).padStart(3, '0')}`,
    nadpis: `N${i + 1}`,
    miesto: '',
    text: 'x',
  })),
})

const KNIHY: KnihySubor = { verzia: 1, knihy: [kniha('a', 2), kniha('b', 2), kniha('c', 1)] }

const stav = (precitane: [string, string][], oblubene: string[] = []): KnihyStav => ({
  verzia: 1,
  precitane: precitane.map(([uryvok, datum]) => ({ uryvok, datum })),
  oblubene,
})

describe('parsovanie', () => {
  it('načíta knihy podľa SCHEMA.md', () => {
    const d = parsujKnihy(JSON.stringify(KNIHY))
    expect(d).toEqual(KNIHY)
  })

  it('odmietne duplicitné id úryvku', () => {
    const zla = { verzia: 1, knihy: [kniha('a', 1), kniha('a', 1)] }
    expect(() => parsujKnihy(JSON.stringify(zla))).toThrow(/viackrát/)
  })

  it('stav: zoradí, odstráni duplicity a zachová formát', () => {
    const s = parsujStav(
      JSON.stringify({ verzia: 1, precitane: [{ uryvok: 'a-002', datum: '2026-10-26' }, { uryvok: 'a-001', datum: '2026-10-25' }, { uryvok: 'a-001', datum: '2026-10-25' }], oblubene: ['b', 'a', 'a'] }),
    )
    expect(serializujStav(s)).toBe(
      JSON.stringify({ verzia: 1, precitane: [{ uryvok: 'a-001', datum: '2026-10-25' }, { uryvok: 'a-002', datum: '2026-10-26' }], oblubene: ['a', 'b'] }, null, 2) + '\n',
    )
  })

  it('stav: zlý dátum je chyba', () => {
    expect(() => parsujStav('{"verzia":1,"precitane":[{"uryvok":"a","datum":"25.10."}]}')).toThrow()
  })
})

describe('dnešný úryvok', () => {
  it('prvý neprečítaný v poradí', () => {
    expect(dnesnyUryvok(KNIHY, prazdnyStav(), '2026-10-25')?.uryvok.id).toBe('a-001')
    const u = dnesnyUryvok(KNIHY, stav([['a-001', '2026-10-24'], ['a-002', '2026-10-24']]), '2026-10-25')
    expect(u?.uryvok.id).toBe('b-001')
    expect(u?.poradie).toBe(1)
    expect(u?.precitanyDnes).toBe(false)
  })

  it('dnes prečítaný ostáva dnešným', () => {
    const u = dnesnyUryvok(KNIHY, stav([['a-001', '2026-10-25']]), '2026-10-25')
    expect(u?.uryvok.id).toBe('a-001')
    expect(u?.precitanyDnes).toBe(true)
  })

  it('pri viacerých dnes prečítaných platí posledný', () => {
    const u = dnesnyUryvok(KNIHY, stav([['a-001', '2026-10-25'], ['a-002', '2026-10-25']]), '2026-10-25')
    expect(u?.uryvok.id).toBe('a-002')
    expect(u?.index).toBe(1)
  })

  it('všetko prečítané → null', () => {
    const vsetko = KNIHY.knihy.flatMap((k) => k.uryvky.map((u): [string, string] => [u.id, '2026-10-01']))
    expect(dnesnyUryvok(KNIHY, stav(vsetko), '2026-10-25')).toBeNull()
  })
})

describe('treba načítať', () => {
  it('kým majú neprečítané aspoň 2 knihy, netreba', () => {
    expect(trebaNacitat(KNIHY, prazdnyStav())).toBe(false)
    expect(trebaNacitat(KNIHY, stav([['a-001', 'x'], ['a-002', 'x']]))).toBe(false)
  })

  it('ostala posledná kniha', () => {
    expect(trebaNacitat(KNIHY, stav([['a-001', 'x'], ['a-002', 'x'], ['c-001', 'x']]))).toBe(true)
    expect(trebaNacitat({ verzia: 1, knihy: [] }, prazdnyStav())).toBe(true)
  })
})

describe('úpravy', () => {
  it('prečítané a späť', () => {
    const s = oznacPrecitany(prazdnyStav(), 'a-001', '2026-10-25')
    expect(s.precitane).toEqual([{ uryvok: 'a-001', datum: '2026-10-25' }])
    expect(oznacPrecitany(s, 'a-001', '2026-10-26')).toBe(s)
    expect(postupKnihy(KNIHY.knihy[0]!, s)).toEqual({ precitane: 1, spolu: 2 })
    expect(zrusPrecitany(s, 'a-001').precitane).toEqual([])
  })

  it('obľúbené', () => {
    const s = prepniOblubeny(prazdnyStav(), 'b-002')
    expect(s.oblubene).toEqual(['b-002'])
    expect(oblubeneUryvky(KNIHY, s).map((x) => x.uryvok.id)).toEqual(['b-002'])
    expect(prepniOblubeny(s, 'b-002').oblubene).toEqual([])
  })
})

describe('zlúčenie stavu', () => {
  it('zjednotí prečítané z oboch zariadení', () => {
    const zaklad = stav([['a-001', '2026-10-24']])
    const moje = stav([['a-001', '2026-10-24'], ['a-002', '2026-10-25']])
    const ich = stav([['a-001', '2026-10-24'], ['b-001', '2026-10-25']])
    const v = zlucStav(zaklad, moje, ich)
    expect(v.data.precitane.map((p) => p.uryvok)).toEqual(['a-001', 'a-002', 'b-001'])
    expect(v.zmenyZInych).toEqual(['Prečítané na inom zariadení: 1'])
    expect(v.konflikty).toEqual([])
  })

  it('rešpektuje odobratie obľúbeného', () => {
    const zaklad = stav([], ['a-001', 'a-002'])
    const moje = stav([], ['a-002'])
    const ich = stav([], ['a-001', 'a-002', 'b-001'])
    expect(zlucStav(zaklad, moje, ich).data.oblubene).toEqual(['a-002', 'b-001'])
  })
})
