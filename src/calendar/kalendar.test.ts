import { describe, expect, it } from 'vitest'
import { pozadovaneUdalosti } from '../modules/ludia/model/kalendar'
import type { LudiaSubor, Pripomienka } from '../modules/ludia/model/ludia'
import { ChybaPrihlasenia, ChybaSiete } from '../storage/types'
import { udalostIcs } from './ics'
import { KalendarOutlook, teloUdalosti } from './outlook'
import { PamatovyKalendar } from './pamatovy'
import { SynchronizaciaKalendara } from './synchronizacia'
import { podpisUdalosti, type UdalostKalendara } from './types'
import { zosulad } from './zosulad'

const DNES = '2026-10-24'

function pripomienka(id: string, datum: string, ine: Partial<Pripomienka> = {}): Pripomienka {
  return { id, datum, cas: '', dovod: '', hotovo: false, idKalendara: '', ...ine }
}

function data(pripomienky: Pripomienka[]): LudiaSubor {
  return {
    verzia: 1,
    ludia: [{ id: 'c-1', meno: 'Anna', kontakt: '0905 123 456', poznamka: '', poslednyKontakt: '', ozvatSaKazdych: 0, pripomienky }],
  }
}

function udalost(id: string, datum = '2026-11-01'): UdalostKalendara {
  return { idPripomienky: id, nazov: 'Anna: ozvať sa', text: '', datum, cas: '' }
}

class PametoveUloziste {
  m = new Map<string, string>()
  getItem = (k: string) => this.m.get(k) ?? null
  setItem = (k: string, v: string) => void this.m.set(k, v)
  removeItem = (k: string) => void this.m.delete(k)
}

describe('pozadovaneUdalosti', () => {
  it('len nehotové od dnes, s menom, dôvodom a kontaktom', () => {
    const u = pozadovaneUdalosti(
      data([
        pripomienka('p-stara', '2026-10-23'),
        pripomienka('p-hotova', '2026-10-30', { hotovo: true }),
        pripomienka('p-dnes', DNES, { dovod: 'po operácii', cas: '09:30' }),
        pripomienka('p-bez', '2026-11-02'),
      ]),
      DNES,
    )
    expect(u).toEqual([
      { idPripomienky: 'p-dnes', nazov: 'Anna: po operácii', text: '0905 123 456', datum: DNES, cas: '09:30' },
      { idPripomienky: 'p-bez', nazov: 'Anna: ozvať sa', text: '0905 123 456', datum: '2026-11-02', cas: '' },
    ])
  })
})

describe('zosulad', () => {
  it('vytvorí chýbajúce, upraví zmenené, zmaže nepotrebné a dvojice', () => {
    const a = udalost('p-a')
    const b = udalost('p-b')
    const bZmenena = { ...b, cas: '10:00' }
    const z = zosulad(
      [a, bZmenena, udalost('p-c')],
      [
        { id: 'u-a', idPripomienky: 'p-a', podpis: podpisUdalosti(a) },
        { id: 'u-a2', idPripomienky: 'p-a', podpis: podpisUdalosti(a) },
        { id: 'u-b', idPripomienky: 'p-b', podpis: podpisUdalosti(b) },
        { id: 'u-x', idPripomienky: 'p-zmazana', podpis: '' },
      ],
    )
    expect(z.vytvorit.map((u) => u.idPripomienky)).toEqual(['p-c'])
    expect(z.upravit).toEqual([{ id: 'u-b', udalost: bZmenena }])
    expect(z.zmazat.sort()).toEqual(['u-a2', 'u-x'])
  })

  it('nič, keď všetko sedí', () => {
    const a = udalost('p-a')
    expect(zosulad([a], [{ id: 'u', idPripomienky: 'p-a', podpis: podpisUdalosti(a) }])).toEqual({ vytvorit: [], upravit: [], zmazat: [] })
  })
})

describe('SynchronizaciaKalendara', () => {
  it('vypnutá nič nerobí, zapnutá prenesie a druhý beh už nič nemení', async () => {
    const k = new PamatovyKalendar()
    const s = new SynchronizaciaKalendara(k, new PametoveUloziste())
    await s.prenes([udalost('p-a')], DNES)
    expect(k.udalosti.size).toBe(0)
    expect(s.stav).toEqual({ stav: 'vypnuty' })

    s.zapni()
    await s.prenes([udalost('p-a'), udalost('p-b')], DNES)
    expect(k.udalosti.size).toBe(2)
    expect(s.stav).toEqual({ stav: 'ok', zmien: 2 })

    await s.prenes([udalost('p-b')], DNES)
    expect([...k.udalosti.values()].map((u) => u.idPripomienky)).toEqual(['p-b'])
    await s.prenes([udalost('p-b')], DNES)
    expect(s.stav).toEqual({ stav: 'ok', zmien: 0 })
  })

  it('požiadavka počas behu sa spracuje po ňom s poslednými dátami', async () => {
    const k = new PamatovyKalendar()
    const s = new SynchronizaciaKalendara(k, new PametoveUloziste())
    s.zapni()
    const prvy = s.prenes([udalost('p-a')], DNES)
    void s.prenes([udalost('p-b')], DNES)
    await prvy
    expect([...k.udalosti.values()].map((u) => u.idPripomienky)).toEqual(['p-b'])
  })

  it('stav pri chybe siete a chýbajúcom súhlase', async () => {
    const k = new PamatovyKalendar()
    const s = new SynchronizaciaKalendara(k, new PametoveUloziste())
    s.zapni()
    k.nacitaj = () => Promise.reject(new ChybaSiete())
    await s.prenes([], DNES)
    expect(s.stav.stav).toBe('offline')
    k.nacitaj = () => Promise.reject(new ChybaPrihlasenia('Kalendár treba znova pripojiť'))
    await s.prenes([], DNES)
    expect(s.stav).toEqual({ stav: 'pripojit', sprava: 'Kalendár treba znova pripojiť' })
  })
})

describe('Outlook', () => {
  it('celodenná udalosť a udalosť s časom', () => {
    const cele = teloUdalosti(udalost('p-a'))
    expect(cele).toMatchObject({
      isAllDay: true,
      start: { dateTime: '2026-11-01T00:00:00', timeZone: 'Europe/Bratislava' },
      end: { dateTime: '2026-11-02T00:00:00' },
    })
    expect(teloUdalosti({ ...udalost('p-a'), cas: '09:30' })).toMatchObject({
      isAllDay: false,
      start: { dateTime: '2026-11-01T09:30:00' },
      end: { dateTime: '2026-11-01T09:45:00' },
    })
    expect(teloUdalosti({ ...udalost('p-a'), cas: '23:50' })).toMatchObject({ end: { dateTime: '2026-11-02T00:00:00' } })
  })

  it('načíta naše udalosti cez stránkovanie, minulé vynechá', async () => {
    const vlastnosti = (id: string) => [
      { id: 'String {5d0c9f4e-2b7a-4c3e-8f61-a94b2e7d1c38} Name PastoraciaPripomienka', value: id },
      { id: 'String {5D0C9F4E-2B7A-4C3E-8F61-A94B2E7D1C38} Name PastoraciaPodpis', value: `podpis-${id}` },
    ]
    const strany: Record<string, unknown> = {
      prva: {
        value: [
          { id: 'u1', start: { dateTime: '2026-10-20T00:00:00.0000000' }, singleValueExtendedProperties: vlastnosti('p-stara') },
          { id: 'u2', start: { dateTime: '2026-10-24T09:00:00.0000000' }, singleValueExtendedProperties: vlastnosti('p-a') },
        ],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/dalsia',
      },
      dalsia: { value: [{ id: 'u3', start: { dateTime: '2026-12-01T00:00:00.0000000' }, singleValueExtendedProperties: vlastnosti('p-b') }] },
    }
    const volania: string[] = []
    const fetchFn = (async (url: string) => {
      volania.push(url)
      return new Response(JSON.stringify(url.endsWith('/dalsia') ? strany.dalsia : strany.prva), { status: 200 })
    }) as typeof fetch
    const k = new KalendarOutlook(async () => 'token', fetchFn)
    expect(await k.nacitaj(DNES)).toEqual([
      { id: 'u2', idPripomienky: 'p-a', podpis: 'podpis-p-a' },
      { id: 'u3', idPripomienky: 'p-b', podpis: 'podpis-p-b' },
    ])
    expect(volania).toHaveLength(2)
    expect(decodeURIComponent(volania[0]!)).toContain("ep/value eq 'ludia'")
  })

  it('zmazanie už zmazanej udalosti nevadí, 403 znamená pripojiť znova', async () => {
    let status = 404
    const fetchFn = (async () => new Response(null, { status })) as typeof fetch
    const k = new KalendarOutlook(async () => 'token', fetchFn)
    await expect(k.zmaz('u1')).resolves.toBeUndefined()
    status = 403
    await expect(k.zmaz('u1')).rejects.toBeInstanceOf(ChybaPrihlasenia)
  })
})

describe('ics', () => {
  const teraz = new Date('2026-10-24T17:00:00Z')

  it('celodenná udalosť s upozornením deň predtým', () => {
    const s = udalostIcs({ ...udalost('p-a'), nazov: 'Anna: po operácii, doma', text: '0905 123 456\nkľúč; u suseda' }, teraz)
    expect(s.split('\r\n')).toEqual(
      expect.arrayContaining([
        'UID:p-a@pastoracia-app',
        'DTSTAMP:20261024T170000Z',
        'DTSTART;VALUE=DATE:20261101',
        'DTEND;VALUE=DATE:20261102',
        'SUMMARY:Anna: po operácii\\, doma',
        'DESCRIPTION:0905 123 456\\nkľúč\\; u suseda',
        'TRIGGER:-PT6H',
      ]),
    )
    expect(s.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('udalosť s časom', () => {
    const s = udalostIcs({ ...udalost('p-a'), cas: '09:30' }, teraz)
    expect(s).toContain('DTSTART:20261101T093000\r\nDURATION:PT15M')
    expect(s).toContain('TRIGGER:-PT15M')
    expect(s).not.toContain('DESCRIPTION:\r\n')
  })
})
