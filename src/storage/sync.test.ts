import { describe, expect, it } from 'vitest'
import { INTENCIE, PLAN } from '../modules/farsky-list/data'
import { nahradDen, prazdnySubor, serializujIntencie, type Den, type IntencieSubor } from '../modules/farsky-list/model/intencie'
import { pridajTemu, prazdnyPlan } from '../modules/farsky-list/model/temy'
import { PamatovaCache } from './cache'
import { Uloziste } from './store'
import { DatovySubor } from './sync'
import { FalosnyOneDrive } from './test-pomocky'

const N = INTENCIE.nazov

const den = (datum: string, cas = '16:30', text = 'Mária'): Den => ({
  datum,
  bohosluzby: [{ cas, typ: 'liturgia', intencie: [{ znak: '+', text, objednal: '', poznamka: '' }] }],
  spovede: [],
  oznam: '',
})

const s = (...dni: Den[]): IntencieSubor => dni.reduce((acc, d) => nahradDen(acc, d.datum, d), prazdnySubor())

function zariadenie(od = new FalosnyOneDrive(), cache = new PamatovaCache()) {
  return { od, cache, subor: new DatovySubor(INTENCIE, od, cache) }
}

describe('DatovySubor – načítanie', () => {
  it('nový účet bez súboru: prázdne dáta, nič sa nezapíše', async () => {
    const { od, subor } = zariadenie()
    await subor.nacitaj()
    expect(subor.data).toEqual(prazdnySubor())
    expect(subor.stav.stav).toBe('synchronizovane')
    expect(od.zapisy).toBe(0)
  })

  it('stiahne súbor z OneDrive a uloží ho do cache', async () => {
    const { od, cache, subor } = zariadenie()
    od.zmenZvonku(N, serializujIntencie(s(den('2026-11-02'))))
    await subor.nacitaj()
    expect(subor.data.dni.map((d) => d.datum)).toEqual(['2026-11-02'])
    expect((await cache.nacitaj(N))?.server.etag).toBe(od.subory.get(N)!.etag)
  })

  it('offline: ukáže posledné dáta z cache', async () => {
    const z1 = zariadenie()
    z1.od.zmenZvonku(N, serializujIntencie(s(den('2026-11-02'))))
    await z1.subor.nacitaj()

    z1.od.offline = true
    const z2 = zariadenie(z1.od, z1.cache) // znovu otvorená aplikácia
    await z2.subor.nacitaj()
    expect(z2.subor.data.dni).toHaveLength(1)
    expect(z2.subor.stav.stav).toBe('offline')
  })

  it('súbor upravený zvonku (napr. Claude na PC) sa pri synchronizácii načíta', async () => {
    const { od, subor } = zariadenie()
    await subor.nacitaj()
    od.zmenZvonku(N, JSON.stringify({ verzia: 1, dni: [den('2026-11-09')] }))
    await subor.synchronizuj()
    expect(subor.data.dni.map((d) => d.datum)).toEqual(['2026-11-09'])
  })

  it('poškodený súbor na OneDrive neprepíše dáta a ohlási chybu', async () => {
    const { od, subor } = zariadenie()
    od.zmenZvonku(N, serializujIntencie(s(den('2026-11-02'))))
    await subor.nacitaj()
    od.zmenZvonku(N, '{"verzia":1,"dni":[{"datum":"2026-13-01"}]}')
    await subor.synchronizuj()
    expect(subor.stav.stav).toBe('chyba')
    expect(subor.stav.chyba).toContain('2026-13-01')
    expect(subor.data.dni.map((d) => d.datum)).toEqual(['2026-11-02'])
  })
})

describe('DatovySubor – ukladanie', () => {
  it('zmena sa odošle s eTagom a uloží presne podľa SCHEMA.md', async () => {
    const { od, subor } = zariadenie()
    await subor.nacitaj()
    await subor.uloz(s(den('2026-11-02')))
    expect(od.subory.get(N)!.obsah).toBe(serializujIntencie(s(den('2026-11-02'))))
    expect(subor.stav.stav).toBe('synchronizovane')
  })

  it('rovnaké dáta sa neposielajú znova', async () => {
    const { od, subor } = zariadenie()
    await subor.nacitaj()
    await subor.uloz(s(den('2026-11-02')))
    await subor.uloz(s(den('2026-11-02')))
    expect(od.zapisy).toBe(1)
  })

  it('offline: zmena čaká v zariadení a odošle sa po pripojení (aj po reštarte)', async () => {
    const z1 = zariadenie()
    await z1.subor.nacitaj()
    z1.od.offline = true
    await z1.subor.uloz(s(den('2026-11-02')))
    expect(z1.subor.stav.stav).toBe('caka')
    expect(z1.subor.data.dni).toHaveLength(1)
    expect(z1.od.subory.has(N)).toBe(false)

    z1.od.offline = false
    const z2 = zariadenie(z1.od, z1.cache)
    await z2.subor.nacitaj()
    expect(z2.od.subory.get(N)!.obsah).toBe(serializujIntencie(s(den('2026-11-02'))))
    expect(z2.subor.stav.stav).toBe('synchronizovane')
    expect((await z2.cache.nacitaj(N))?.lokalne).toBeNull()
  })

  it('Uloziste odošle čakajúce zmeny po udalosti „online“', async () => {
    const od = new FalosnyOneDrive()
    const u = new Uloziste(od, new PamatovaCache())
    const subor = u.subor(INTENCIE)
    await subor.nacitaj()
    od.offline = true
    await subor.uloz(s(den('2026-11-02')))
    od.offline = false
    const okno = new EventTarget() as unknown as Window
    Object.defineProperty(okno, 'document', { value: new EventTarget() })
    u.sledujPripojenie(okno)
    okno.dispatchEvent(new Event('online'))
    await subor.synchronizuj()
    expect(od.subory.has(N)).toBe(true)
    expect(u.subor(INTENCIE)).toBe(subor)
  })
})

describe('DatovySubor – konflikty', () => {
  it('zmena iného dňa na inom zariadení sa zlúči sama a odošle', async () => {
    const od = new FalosnyOneDrive()
    const mobil = zariadenie(od)
    const pc = zariadenie(od)
    await mobil.subor.nacitaj()
    await pc.subor.nacitaj()

    await pc.subor.uloz(s(den('2026-11-02')))
    await mobil.subor.uloz(s(den('2026-11-06')))

    expect(mobil.subor.stav.stav).toBe('synchronizovane')
    expect(mobil.subor.stav.konflikt).toBeNull()
    expect(mobil.subor.stav.posledneZlucenie).toEqual(['po 2. 11. 2026: pridané – 16:30 Liturgia (+Mária)'])
    expect(mobil.subor.data.dni.map((d) => d.datum)).toEqual(['2026-11-02', '2026-11-06'])
    expect(od.subory.get(N)!.obsah).toBe(serializujIntencie(s(den('2026-11-02'), den('2026-11-06'))))

    mobil.subor.zabudniZlucenie()
    expect(mobil.subor.stav.posledneZlucenie).toEqual([])
  })

  it('ten istý deň zmenený na oboch: čaká na potvrdenie, nič sa neodošle', async () => {
    const od = new FalosnyOneDrive()
    const mobil = zariadenie(od)
    await mobil.subor.nacitaj()
    await mobil.subor.uloz(s(den('2026-11-02')))
    const zapisy = od.zapisy

    od.zmenZvonku(N, serializujIntencie(s(den('2026-11-02', '17:00', 'Ján'))))
    await mobil.subor.uloz(s(den('2026-11-02', '16:30', 'Anna')))

    expect(mobil.subor.stav.stav).toBe('konflikt')
    expect(mobil.subor.stav.konflikt?.konflikty).toEqual([
      'po 2. 11. 2026: zmenené na oboch zariadeniach. Tvoja verzia: 16:30 Liturgia (+Anna). ' +
        'Druhá verzia: 17:00 Liturgia (+Ján). Ponechaná tvoja verzia.',
    ])
    expect(od.zapisy).toBe(zapisy)
    expect(mobil.subor.data.dni[0]!.bohosluzby[0]!.intencie[0]!.text).toBe('Anna')

    // aj po reštarte konflikt stále čaká
    const znova = zariadenie(od, mobil.cache)
    await znova.subor.nacitaj()
    expect(znova.subor.stav.stav).toBe('konflikt')

    await znova.subor.potvrdZlucenie()
    expect(znova.subor.stav.stav).toBe('synchronizovane')
    expect(od.subory.get(N)!.obsah).toContain('"Anna"')
  })

  it('pri konflikte môžem ponechať verziu z iného zariadenia', async () => {
    const od = new FalosnyOneDrive()
    const mobil = zariadenie(od)
    await mobil.subor.nacitaj()
    await mobil.subor.uloz(s(den('2026-11-02')))
    od.zmenZvonku(N, serializujIntencie(s(den('2026-11-02', '17:00', 'Ján'))))
    await mobil.subor.uloz(s(den('2026-11-02', '16:30', 'Anna')))

    await mobil.subor.pouziVerziuZInych()
    expect(mobil.subor.data.dni[0]!.bohosluzby[0]!.intencie[0]!.text).toBe('Ján')
    expect(mobil.subor.stav.stav).toBe('synchronizovane')
    await mobil.subor.synchronizuj()
    expect(od.subory.get(N)!.obsah).toContain('"Ján"')
  })

  it('súbor vznikol na inom zariadení skôr, ako sa odoslal môj nový', async () => {
    const od = new FalosnyOneDrive()
    const mobil = zariadenie(od)
    od.offline = true
    await mobil.subor.nacitaj()
    await mobil.subor.uloz(s(den('2026-11-06')))
    od.offline = false
    od.zmenZvonku(N, serializujIntencie(s(den('2026-11-02'))))
    await mobil.subor.synchronizuj()
    expect(mobil.subor.stav.stav).toBe('synchronizovane')
    expect(mobil.subor.data.dni.map((d) => d.datum)).toEqual(['2026-11-02', '2026-11-06'])
  })

  it('zmena počas odosielania sa nestratí', async () => {
    const od = new FalosnyOneDrive()
    const mobil = zariadenie(od)
    await mobil.subor.nacitaj()
    od.predZapisom = () => void mobil.subor.uloz(s(den('2026-11-02'), den('2026-11-03')))
    await mobil.subor.uloz(s(den('2026-11-02')))
    await mobil.subor.synchronizuj()
    expect(od.subory.get(N)!.obsah).toBe(serializujIntencie(s(den('2026-11-02'), den('2026-11-03'))))
    expect(mobil.subor.stav.stav).toBe('synchronizovane')
  })

  it('funguje rovnako aj pre plán tém', async () => {
    const od = new FalosnyOneDrive()
    const mobil = new DatovySubor(PLAN, od, new PamatovaCache())
    const pc = new DatovySubor(PLAN, od, new PamatovaCache())
    await mobil.nacitaj()
    await pc.nacitaj()
    const form = (nazov: string) => ({ nazov, zdroje: '', poznamka: '', stav: 'napad' as const })
    await pc.uloz(pridajTemu(prazdnyPlan(), '2026-11-02', form('Dušičky')).plan)
    await mobil.uloz(pridajTemu(prazdnyPlan(), '2026-11-02', form('Advent')).plan)
    expect(mobil.stav.stav).toBe('synchronizovane')
    expect(mobil.data.tyzdne[0]!.temy.map((t) => t.nazov).sort()).toEqual(['Advent', 'Dušičky'])
    expect(mobil.data.tyzdne[0]!.temy.map((t) => t.poradie)).toEqual([1, 2])
  })
})
