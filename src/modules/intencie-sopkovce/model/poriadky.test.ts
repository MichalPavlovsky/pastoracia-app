import { describe, expect, it } from 'vitest'
import {
  chybaBuduci,
  odoberSubor,
  parsujPoriadky,
  pondelokZNazvu,
  prazdnePoriadky,
  pridajSubor,
  serializujPoriadky,
  volnyNazov,
  zlucPoriadky,
  type PoriadkySubor,
} from './poriadky'

const s = (pondelok: string, nazov: string, nahrane: string) => ({ cesta: `poriadky/${pondelok}/${nazov}`, nazov, nahrane })

describe('pondelok z názvu súboru', () => {
  it('bežný názov', () => {
    expect(pondelokZNazvu('45. 02. 11. - 08. 11. 2026.doc')).toBe('2026-11-02')
    expect(pondelokZNazvu('44. 26. 10. - 01. 11. 2026.docx')).toBe('2026-10-26')
  })

  it('týždeň cez Nový rok', () => {
    expect(pondelokZNazvu('1. 29. 12. - 04. 01. 2027.doc')).toBe('2026-12-28')
  })

  it('iný zápis medzier a pomlčky', () => {
    expect(pondelokZNazvu('45.02.11.–08.11.2026.doc')).toBe('2026-11-02')
  })

  it('dátum, ktorý nie je pondelok → pondelok jeho týždňa', () => {
    expect(pondelokZNazvu('45. 03. 11. - 08. 11. 2026.doc')).toBe('2026-11-02')
  })

  it('nerozpoznaný názov', () => {
    expect(pondelokZNazvu('poriadok.doc')).toBeNull()
    expect(pondelokZNazvu('45. 31. 02. - 08. 03. 2026.doc')).toBeNull()
  })
})

describe('súbor poriadky-humenne.json', () => {
  it('prevod do JSON – presný formát, zoradenie', () => {
    let d = prazdnePoriadky()
    d = pridajSubor(d, '2026-11-09', s('2026-11-09', 'b.doc', '2026-11-01T10:00'))
    d = pridajSubor(d, '2026-11-02', s('2026-11-02', 'z.doc', '2026-10-30T18:20'))
    d = pridajSubor(d, '2026-11-02', s('2026-11-02', 'a.doc', '2026-10-30T18:25'))
    expect(serializujPoriadky(d)).toBe(`{
  "verzia": 1,
  "tyzdne": [
    {
      "pondelok": "2026-11-02",
      "subory": [
        {
          "cesta": "poriadky/2026-11-02/z.doc",
          "nazov": "z.doc",
          "nahrane": "2026-10-30T18:20"
        },
        {
          "cesta": "poriadky/2026-11-02/a.doc",
          "nazov": "a.doc",
          "nahrane": "2026-10-30T18:25"
        }
      ]
    },
    {
      "pondelok": "2026-11-09",
      "subory": [
        {
          "cesta": "poriadky/2026-11-09/b.doc",
          "nazov": "b.doc",
          "nahrane": "2026-11-01T10:00"
        }
      ]
    }
  ]
}
`)
    expect(parsujPoriadky(serializujPoriadky(d))).toEqual(d)
  })

  it('zmazanie posledného súboru odstráni aj týždeň', () => {
    const d = pridajSubor(prazdnePoriadky(), '2026-11-02', s('2026-11-02', 'a.doc', '2026-10-30T18:20'))
    expect(odoberSubor(d, 'poriadky/2026-11-02/a.doc')).toEqual(prazdnePoriadky())
  })

  it('zlý formát', () => {
    expect(() => parsujPoriadky('{"verzia":1,"tyzdne":[{"pondelok":"2.11.","subory":[]}]}')).toThrow()
    expect(() => parsujPoriadky('{"verzia":1,"tyzdne":[{"pondelok":"2026-11-02","subory":[{"cesta":"x","nazov":"x","nahrane":"30.10."}]}]}')).toThrow()
  })

  it('zlúčenie: pridané na oboch, zmazanie sa rešpektuje', () => {
    const zaklad = pridajSubor(prazdnePoriadky(), '2026-11-02', s('2026-11-02', 'a.doc', '2026-10-30T18:20'))
    const moje: PoriadkySubor = pridajSubor(odoberSubor(zaklad, 'poriadky/2026-11-02/a.doc'), '2026-11-09', s('2026-11-09', 'b.doc', '2026-11-01T10:00'))
    const ich = pridajSubor(zaklad, '2026-11-02', s('2026-11-02', 'c.doc', '2026-10-31T08:00'))
    const r = zlucPoriadky(zaklad, moje, ich)
    expect(r.data.tyzdne.map((t) => [t.pondelok, t.subory.map((x) => x.nazov)])).toEqual([
      ['2026-11-02', ['c.doc']],
      ['2026-11-09', ['b.doc']],
    ])
    expect(r.zmenyZInych).toHaveLength(1)
  })
})

describe('pomocné', () => {
  it('voľný názov', () => {
    expect(volnyNazov('a.doc', [])).toBe('a.doc')
    expect(volnyNazov('a.doc', ['A.doc'])).toBe('a (2).doc')
    expect(volnyNazov('a.doc', ['a.doc', 'a (2).doc'])).toBe('a (3).doc')
  })

  it('chýba poriadok na budúci týždeň', () => {
    const d = pridajSubor(prazdnePoriadky(), '2026-11-02', s('2026-11-02', 'a.doc', '2026-10-30T18:20'))
    expect(chybaBuduci(d, '2026-10-27')).toBe(false)
    expect(chybaBuduci(d, '2026-11-02')).toBe(true)
  })
})
