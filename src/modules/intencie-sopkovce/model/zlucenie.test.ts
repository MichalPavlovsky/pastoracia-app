import { describe, expect, it } from 'vitest'
import { nahradDen, prazdnySubor, type Den } from './intencie'
import { zlucIntencie } from './zlucenie'

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
