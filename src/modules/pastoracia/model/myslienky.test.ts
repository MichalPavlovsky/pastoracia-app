import { describe, expect, it } from 'vitest'
import { ChybaFormatu } from '../../../lib/json'
import {
  filtruj,
  myslienkaNaFormular,
  myslienkaZoZdielania,
  parsujMyslienky,
  prazdneMyslienky,
  pridajMyslienku,
  prepniStav,
  serializujMyslienky,
  stitkyZTextu,
  upravMyslienku,
  validujMyslienku,
  vsetkyStitky,
  zlucMyslienky,
  zmazMyslienku,
  type MyslienkySubor,
} from './myslienky'

const ukazka: MyslienkySubor = parsujMyslienky(
  JSON.stringify({
    verzia: 1,
    myslienky: [
      { id: 'm-1', nazov: 'Dušičky', text: 'Modlitba za zosnulých', stitky: ['november'], vytvorene: '2026-10-01', stav: 'napad' },
      { id: 'm-2', nazov: 'Advent s rodinou', text: '', stitky: ['advent', 'rodiny'], zdroje: ['https://a.sk'], vytvorene: '2026-10-20', stav: 'rozpracovane' },
    ],
  }),
)

describe('súbor pastoracia-myslienky.json', () => {
  it('zápis má pevné poradie kľúčov, najnovšie prvé a nový riadok na konci', () => {
    const s = serializujMyslienky(ukazka)
    expect(s.endsWith('}\n')).toBe(true)
    const d = JSON.parse(s)
    expect(Object.keys(d)).toEqual(['verzia', 'myslienky'])
    expect(Object.keys(d.myslienky[0])).toEqual(['id', 'nazov', 'text', 'stitky', 'zdroje', 'vytvorene', 'stav'])
    expect(d.myslienky.map((m: { id: string }) => m.id)).toEqual(['m-2', 'm-1'])
    expect(d.myslienky[1].zdroje).toEqual([])
  })

  it('čítanie → zápis → čítanie nič nezmení', () => {
    expect(parsujMyslienky(serializujMyslienky(ukazka))).toEqual(ukazka)
  })

  it('odmietne zlý stav, dátum a duplicitné id', () => {
    const zle = (m: object) => () => parsujMyslienky(JSON.stringify({ verzia: 1, myslienky: [m] }))
    expect(zle({ id: 'm-1', vytvorene: '2026-10-01', stav: 'hotovo' })).toThrow(ChybaFormatu)
    expect(zle({ id: 'm-1', vytvorene: '1. 10. 2026', stav: 'napad' })).toThrow(ChybaFormatu)
    expect(zle({ id: '', vytvorene: '2026-10-01', stav: 'napad' })).toThrow(ChybaFormatu)
    const dvakrat = { id: 'm-1', vytvorene: '2026-10-01', stav: 'napad' }
    expect(() => parsujMyslienky(JSON.stringify({ verzia: 1, myslienky: [dvakrat, dvakrat] }))).toThrow(ChybaFormatu)
    expect(() => parsujMyslienky('{"verzia":2}')).toThrow(ChybaFormatu)
  })

  it('prázdny súbor', () => {
    expect(parsujMyslienky(serializujMyslienky(prazdneMyslienky()))).toEqual(prazdneMyslienky())
  })
})

describe('úpravy myšlienok', () => {
  it('pridanie, úprava, stav, zmazanie', () => {
    const f = { ...myslienkaNaFormular(), nazov: ' Spoveď detí ', stitky: 'deti, Advent, advent', zdroje: 'https://x.sk\n\n' }
    const { data, id } = pridajMyslienku(ukazka, f, '2026-10-24')
    const m = data.myslienky.find((x) => x.id === id)!
    expect(id).toMatch(/^m-/)
    expect(m).toMatchObject({ nazov: 'Spoveď detí', stitky: ['deti', 'Advent'], zdroje: ['https://x.sk'], vytvorene: '2026-10-24', stav: 'napad' })
    expect(data.myslienky[0]!.id).toBe(id)

    const upravene = upravMyslienku(data, id, { ...myslienkaNaFormular(m), text: 'nový text' })
    expect(upravene.myslienky.find((x) => x.id === id)).toMatchObject({ text: 'nový text', vytvorene: '2026-10-24' })

    const st = prepniStav(prepniStav(prepniStav(upravene, id), id), id)
    expect(st.myslienky.find((x) => x.id === id)?.stav).toBe('napad')
    expect(prepniStav(upravene, id).myslienky.find((x) => x.id === id)?.stav).toBe('rozpracovane')

    expect(zmazMyslienku(upravene, id).myslienky.map((x) => x.id)).toEqual(['m-2', 'm-1'])
  })

  it('validácia: stačí názov alebo text', () => {
    expect(validujMyslienku(myslienkaNaFormular())).toHaveLength(1)
    expect(validujMyslienku({ ...myslienkaNaFormular(), text: 'x' })).toEqual([])
  })

  it('štítky', () => {
    expect(stitkyZTextu(' a, , B ,b,a ')).toEqual(['a', 'B'])
    expect(vsetkyStitky(ukazka)).toEqual(['advent', 'november', 'rodiny'])
  })
})

describe('hľadanie', () => {
  const ids = (f: Parameters<typeof filtruj>[1]) => filtruj(ukazka, f).map((m) => m.id)
  it('bez diakritiky, viac slov, štítok a stav', () => {
    expect(ids({ hladat: 'dusicky', stitok: '', stav: '' })).toEqual(['m-1'])
    expect(ids({ hladat: 'ZOSNUL modlit', stitok: '', stav: '' })).toEqual(['m-1'])
    expect(ids({ hladat: 'a.sk', stitok: '', stav: '' })).toEqual(['m-2'])
    expect(ids({ hladat: '', stitok: 'Advent', stav: '' })).toEqual(['m-2'])
    expect(ids({ hladat: '', stitok: '', stav: 'napad' })).toEqual(['m-1'])
    expect(ids({ hladat: '', stitok: '', stav: '' })).toEqual(['m-2', 'm-1'])
  })
})

describe('zdieľanie a zlúčenie', () => {
  it('odkaz zo zdieľania', () => {
    expect(myslienkaZoZdielania({ text: 'Pekný článok https://b.sk/c' })).toMatchObject({ nazov: 'Pekný článok', zdroje: 'https://b.sk/c' })
    expect(myslienkaZoZdielania({ title: 'T', text: 'popis', url: 'https://b.sk' })).toMatchObject({ nazov: 'T', text: 'popis' })
  })

  it('pridanie na mobile + zmena inej na PC sa zlúči bez konfliktu', () => {
    const moje = pridajMyslienku(ukazka, { ...myslienkaNaFormular(), nazov: 'Nová' }, '2026-10-24').data
    const ich = prepniStav(ukazka, 'm-1')
    const v = zlucMyslienky(ukazka, moje, ich)
    expect(v.konflikty).toEqual([])
    expect(v.data.myslienky).toHaveLength(3)
    expect(v.data.myslienky.find((m) => m.id === 'm-1')?.stav).toBe('rozpracovane')
    expect(v.zmenyZInych).toEqual(['Myšlienka zmenená: „Dušičky“ (št 1. 10. 2026)'])
  })

  it('tá istá myšlienka na oboch → konflikt, ponechaná moja', () => {
    const v = zlucMyslienky(ukazka, zmazMyslienku(ukazka, 'm-2'), prepniStav(ukazka, 'm-2'))
    expect(v.konflikty).toHaveLength(1)
    expect(v.data.myslienky.map((m) => m.id)).toEqual(['m-2', 'm-1'])
    expect(v.konflikty[0]).toContain('druhá')
  })
})
