import { describe, expect, it } from 'vitest'
import { nahradDen, prazdnySubor, type Den } from './intencie'
import { nastavPoznamkuTyzdna, parsujPlan, presunTemu, prepniStav, zmazTemu } from './temy'
import { zlucIntencie, zlucPlan } from './zlucenie'

const den = (datum: string, text: string, oznam = ''): Den => ({
  datum,
  bohosluzby: [{ cas: '16:30', typ: 'liturgia', intencie: [{ znak: '+', text, objednal: '', poznamka: '' }] }],
  spovede: [],
  oznam,
})
const subor = (...dni: Den[]) => dni.reduce((s, d) => nahradDen(s, d.datum, d), prazdnySubor())

describe('zlúčenie intencií po dňoch', () => {
  const zaklad = subor(den('2026-11-02', 'A'), den('2026-11-03', 'B'))

  it('zmeny rôznych dní sa spoja bez konfliktu', () => {
    const moje = subor(den('2026-11-02', 'A2'), den('2026-11-03', 'B'))
    const ich = subor(den('2026-11-02', 'A'), den('2026-11-03', 'B'), den('2026-11-04', 'C'))
    const v = zlucIntencie(zaklad, moje, ich)
    expect(v.data).toEqual(subor(den('2026-11-02', 'A2'), den('2026-11-03', 'B'), den('2026-11-04', 'C')))
    expect(v.konflikty).toEqual([])
    expect(v.zmenyZInych).toEqual(['st 4. 11. 2026: pridané – 16:30 Liturgia (+C)'])
  })

  it('deň zmazaný inde a u mňa nezmenený sa zmaže', () => {
    const v = zlucIntencie(zaklad, zaklad, subor(den('2026-11-02', 'A')))
    expect(v.data.dni.map((d) => d.datum)).toEqual(['2026-11-02'])
    expect(v.zmenyZInych).toEqual(['ut 3. 11. 2026: zmazané – prázdny deň'])
  })

  it('rovnaká zmena na oboch nie je konflikt', () => {
    const obe = subor(den('2026-11-02', 'X'), den('2026-11-03', 'B'))
    const v = zlucIntencie(zaklad, obe, obe)
    expect(v.konflikty).toEqual([])
    expect(v.zmenyZInych).toEqual([])
  })

  it('ja zmažem, inde zmenia → ponechá sa zmenená verzia a ohlási konflikt', () => {
    const moje = subor(den('2026-11-02', 'A'))
    const ich = subor(den('2026-11-02', 'A'), den('2026-11-03', 'B', 'zbierka'))
    const v = zlucIntencie(zaklad, moje, ich)
    expect(v.data.dni.map((d) => d.datum)).toEqual(['2026-11-02', '2026-11-03'])
    expect(v.konflikty[0]).toContain('Ponechaná druhá verzia')
    expect(v.konflikty[0]).toContain('oznam: zbierka')
  })
})

describe('zlúčenie plánu tém', () => {
  const zaklad = parsujPlan(
    JSON.stringify({
      verzia: 1,
      tyzdne: [
        {
          pondelok: '2026-11-02',
          temy: [
            { id: 't-1', nazov: 'Dušičky', poradie: 1, stav: 'napad' },
            { id: 't-2', nazov: 'Martin', poradie: 2, stav: 'napad' },
          ],
        },
      ],
    }),
  )

  it('presun na mobile + zmena stavu inej témy na PC', () => {
    const moje = presunTemu(zaklad, 't-2', '2026-11-09')
    const ich = prepniStav(zaklad, 't-1')
    const v = zlucPlan(zaklad, moje, ich)
    expect(v.konflikty).toEqual([])
    expect(v.data.tyzdne.map((t) => [t.pondelok, t.temy.map((x) => `${x.id}:${x.stav}:${x.poradie}`)])).toEqual([
      ['2026-11-02', ['t-1:plan:1']],
      ['2026-11-09', ['t-2:napad:1']],
    ])
    expect(v.zmenyZInych).toEqual(['Téma zmenené: „Dušičky“ (týždeň po 2. 11. 2026)'])
  })

  it('tá istá téma zmenená na oboch → konflikt, ponechaná moja', () => {
    const v = zlucPlan(zaklad, presunTemu(zaklad, 't-1', '2026-11-16'), prepniStav(zaklad, 't-1'))
    expect(v.konflikty).toHaveLength(1)
    expect(v.konflikty[0]).toContain('Ponechaná tvoja verzia')
    expect(v.data.tyzdne.find((t) => t.pondelok === '2026-11-16')?.temy[0]?.id).toBe('t-1')
  })

  it('zmazanie inde a poznámka týždňa', () => {
    const moje = nastavPoznamkuTyzdna(zaklad, '2026-11-09', 'bez listu')
    const ich = zmazTemu(zaklad, 't-2')
    const v = zlucPlan(zaklad, moje, ich)
    expect(v.data.tyzdne).toEqual([
      { pondelok: '2026-11-02', temy: [{ id: 't-1', nazov: 'Dušičky', zdroje: [], poznamka: '', poradie: 1, stav: 'napad' }], poznamka: '' },
      { pondelok: '2026-11-09', temy: [], poznamka: 'bez listu' },
    ])
    expect(v.zmenyZInych).toEqual(['Téma „Martin“ zmazaná'])
  })
})
