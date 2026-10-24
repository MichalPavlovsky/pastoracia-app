import { describe, expect, it } from 'vitest'
import { ChybaFormatu } from '../../../lib/json'
import {
  clovekNaFormular,
  dalsiPravidelny,
  naRade,
  odkazKontaktu,
  ozvalSom,
  parsujLudi,
  pridajCloveka,
  pridajPripomienku,
  prepniHotovo,
  serializujLudi,
  upravCloveka,
  validujCloveka,
  validujPripomienku,
  zlucLudi,
  zmazCloveka,
  zmazPripomienku,
  type LudiaSubor,
} from './ludia'

const ukazka: LudiaSubor = parsujLudi(
  JSON.stringify({
    verzia: 1,
    ludia: [
      {
        id: 'c-2',
        meno: 'Šimon',
        kontakt: '0905 123 456',
        poslednyKontakt: '2026-09-01',
        ozvatSaKazdych: 30,
        pripomienky: [
          { id: 'p-2', datum: '2026-10-30', cas: '', dovod: 'meniny' },
          { id: 'p-1', datum: '2026-10-20', cas: '18:00', dovod: 'po operácii', hotovo: false },
        ],
      },
      { id: 'c-1', meno: 'Anna', kontakt: 'anna@x.sk' },
      { id: 'c-3', meno: 'Zuzana', ozvatSaKazdych: 14, pripomienky: [{ id: 'p-3', datum: '2026-10-01', dovod: '', hotovo: true }] },
    ],
  }),
)

describe('súbor ludia.json', () => {
  it('zápis: poradie kľúčov, ľudia podľa mena (slovensky), pripomienky podľa dátumu', () => {
    const d = JSON.parse(serializujLudi(ukazka))
    expect(Object.keys(d.ludia[0])).toEqual(['id', 'meno', 'kontakt', 'poznamka', 'poslednyKontakt', 'ozvatSaKazdych', 'pripomienky'])
    expect(d.ludia.map((c: { meno: string }) => c.meno)).toEqual(['Anna', 'Šimon', 'Zuzana'])
    expect(Object.keys(d.ludia[1].pripomienky[0])).toEqual(['id', 'datum', 'cas', 'dovod', 'hotovo', 'idKalendara'])
    expect(d.ludia[1].pripomienky.map((p: { id: string }) => p.id)).toEqual(['p-1', 'p-2'])
    expect(d.ludia[0]).toMatchObject({ poznamka: '', poslednyKontakt: '', ozvatSaKazdych: 0, pripomienky: [] })
  })

  it('čítanie → zápis → čítanie nič nezmení', () => {
    expect(parsujLudi(serializujLudi(ukazka))).toEqual(ukazka)
  })

  it('odmietne zlé dátumy, časy, interval a duplicitné id', () => {
    const zle = (c: object) => () => parsujLudi(JSON.stringify({ verzia: 1, ludia: [c] }))
    expect(zle({ id: 'c-1', poslednyKontakt: '2026-13-01' })).toThrow(ChybaFormatu)
    expect(zle({ id: 'c-1', ozvatSaKazdych: -1 })).toThrow(ChybaFormatu)
    expect(zle({ id: 'c-1', ozvatSaKazdych: 1.5 })).toThrow(ChybaFormatu)
    expect(zle({ id: 'c-1', pripomienky: [{ id: 'p', datum: '2026-10-01', cas: '8:00' }] })).toThrow(ChybaFormatu)
    expect(zle({ id: 'c-1', pripomienky: [{ id: 'p', datum: '' }] })).toThrow(ChybaFormatu)
    expect(zle({ id: 'c-1', pripomienky: [{ id: 'p', datum: '2026-10-01', hotovo: 'nie' }] })).toThrow(ChybaFormatu)
    expect(() => parsujLudi(JSON.stringify({ verzia: 1, ludia: [{ id: 'c' }, { id: 'c' }] }))).toThrow(ChybaFormatu)
  })
})

describe('úpravy', () => {
  it('človek: pridanie, úprava, zmazanie, validácia', () => {
    const { data, id } = pridajCloveka(ukazka, { ...clovekNaFormular(), meno: ' Bohuš ', ozvatSaKazdych: 7 })
    expect(id).toMatch(/^c-/)
    expect(data.ludia.map((c) => c.meno)).toEqual(['Anna', 'Bohuš', 'Šimon', 'Zuzana'])
    const c = data.ludia.find((x) => x.id === id)!
    const upr = upravCloveka(data, id, { ...clovekNaFormular(c), kontakt: '0900 000 000' })
    expect(upr.ludia.find((x) => x.id === id)).toMatchObject({ kontakt: '0900 000 000', ozvatSaKazdych: 7 })
    expect(zmazCloveka(upr, id).ludia).toHaveLength(3)
    expect(validujCloveka(clovekNaFormular())).toEqual(['Zadaj meno.'])
    expect(validujCloveka({ ...clovekNaFormular(), meno: 'X', poslednyKontakt: 'včera' })).toHaveLength(1)
  })

  it('pripomienky: pridanie, hotovo, zmazanie', () => {
    const d = pridajPripomienku(ukazka, 'c-1', { datum: '2026-11-01', cas: '', dovod: ' zavolať ' })
    const p = d.ludia.find((c) => c.id === 'c-1')!.pripomienky[0]!
    expect(p).toMatchObject({ datum: '2026-11-01', dovod: 'zavolať', hotovo: false, idKalendara: '' })
    expect(prepniHotovo(d, 'c-1', p.id).ludia.find((c) => c.id === 'c-1')!.pripomienky[0]!.hotovo).toBe(true)
    expect(zmazPripomienku(d, 'c-1', p.id).ludia.find((c) => c.id === 'c-1')!.pripomienky).toEqual([])
    expect(validujPripomienku({ datum: '', cas: '', dovod: '' })).toEqual(['Zadaj dátum.'])
    expect(validujPripomienku({ datum: '2026-11-01', cas: '25:00', dovod: '' })).toEqual(['Neplatný čas.'])
  })

  it('ozval som sa: dátum kontaktu (nikdy späť) a odškrtnutie pripomienky', () => {
    const d = ozvalSom(ukazka, 'c-2', '2026-10-24', 'p-1')
    const c = d.ludia.find((x) => x.id === 'c-2')!
    expect(c.poslednyKontakt).toBe('2026-10-24')
    expect(c.pripomienky.map((p) => p.hotovo)).toEqual([true, false])
    expect(ozvalSom(d, 'c-2', '2026-10-01').ludia.find((x) => x.id === 'c-2')!.poslednyKontakt).toBe('2026-10-24')
  })
})

describe('komu sa ozvať', () => {
  it('pravidelný kontakt', () => {
    const [anna, simon, zuzana] = ukazka.ludia
    expect(dalsiPravidelny(anna!, '2026-10-24')).toBe('')
    expect(dalsiPravidelny(simon!, '2026-10-24')).toBe('2026-10-01')
    expect(dalsiPravidelny(zuzana!, '2026-10-24')).toBe('2026-10-24')
  })

  it('na rade: zmeškané aj najbližší týždeň, zoradené, bez hotových', () => {
    const r = naRade(ukazka, '2026-10-24')
    expect(r.map((x) => [x.clovek.meno, x.datum, x.dovod, x.meskanie])).toEqual([
      ['Šimon', '2026-10-01', 'pravidelný kontakt', true],
      ['Šimon', '2026-10-20', 'po operácii', true],
      ['Zuzana', '2026-10-24', 'pravidelný kontakt', false],
      ['Šimon', '2026-10-30', 'meniny', false],
    ])
    expect(naRade(ukazka, '2026-10-24', 0)).toHaveLength(3)
  })

  it('po „ozval som sa“ pravidelný kontakt zmizne', () => {
    const d = ozvalSom(ukazka, 'c-3', '2026-10-24')
    expect(naRade(d, '2026-10-24').some((x) => x.clovek.meno === 'Zuzana')).toBe(false)
  })

  it('odkaz na kontakt', () => {
    expect(odkazKontaktu('0905 123 456')).toBe('tel:0905123456')
    expect(odkazKontaktu('+421 905/123-456')).toBe('tel:+421905123456')
    expect(odkazKontaktu(' anna@x.sk ')).toBe('mailto:anna@x.sk')
    expect(odkazKontaktu('cez sestru')).toBe('')
  })
})

describe('zlúčenie', () => {
  it('rôzni ľudia na dvoch zariadeniach → bez konfliktu', () => {
    const moje = ozvalSom(ukazka, 'c-1', '2026-10-24')
    const ich = pridajPripomienku(ukazka, 'c-3', { datum: '2026-11-02', cas: '', dovod: '' })
    const v = zlucLudi(ukazka, moje, ich)
    expect(v.konflikty).toEqual([])
    expect(v.data.ludia.find((c) => c.id === 'c-1')!.poslednyKontakt).toBe('2026-10-24')
    expect(v.data.ludia.find((c) => c.id === 'c-3')!.pripomienky).toHaveLength(2)
    expect(v.zmenyZInych).toEqual(['Zmena: Zuzana'])
  })

  it('ten istý človek na oboch → konflikt', () => {
    const v = zlucLudi(ukazka, ozvalSom(ukazka, 'c-1', '2026-10-24'), zmazCloveka(ukazka, 'c-1'))
    expect(v.konflikty).toEqual(['Anna: zmena na oboch zariadeniach. Ponechaná tvoja verzia.'])
  })
})
