import { describe, expect, it } from 'vitest'
import { ChybaFormatu } from '../../../lib/json'
import {
  denNaFormular,
  dniTyzdna,
  formatIntencia,
  formularNaDen,
  kopirujBohosluzbu,
  molebenPred,
  nahradDen,
  novaBohosluzba,
  parsujIntencie,
  prazdnySubor,
  prvaLiturgia,
  serializujIntencie,
  spovedPred,
  ulozDen,
  validujFormular,
  znackyDna,
  type DenForm,
} from './intencie'

// Presne príklad zo SCHEMA.md
const PRIKLAD = `{
  "verzia": 1,
  "dni": [
    {
      "datum": "2026-12-23",
      "bohosluzby": [
        {
          "cas": "16:30",
          "typ": "liturgia",
          "intencie": [
            {
              "znak": "+",
              "text": "Mária, Ján",
              "objednal": "",
              "poznamka": ""
            }
          ]
        }
      ],
      "spovede": [
        {
          "od": "15:00",
          "do": "16:20",
          "poznamka": "predvianočná spoveď"
        }
      ],
      "oznam": ""
    }
  ]
}
`

const k = 'x' // kľúč pre React sa do JSON nedostane

describe('sopkovce-intencie.json – čítanie a zápis', () => {
  it('príklad zo SCHEMA.md sa načíta a zapíše bajt po bajte rovnako', () => {
    expect(serializujIntencie(parsujIntencie(PRIKLAD))).toBe(PRIKLAD)
  })

  it('chýbajúce polia doplní ako "" a []', () => {
    const s = parsujIntencie('{"verzia":1,"dni":[{"datum":"2026-11-01","bohosluzby":[{"cas":"08:00","typ":"liturgia"}]}]}')
    expect(s.dni[0]).toEqual({
      datum: '2026-11-01',
      bohosluzby: [{ cas: '08:00', typ: 'liturgia', intencie: [] }],
      spovede: [],
      oznam: '',
    })
  })

  it('zoradí dni, bohoslužby aj spovede a vynechá prázdne dni', () => {
    const s = parsujIntencie(
      JSON.stringify({
        verzia: 1,
        dni: [
          { datum: '2026-11-08', bohosluzby: [{ cas: '10:00', typ: 'ine' }, { cas: '08:00', typ: 'liturgia' }] },
          { datum: '2026-11-03', bohosluzby: [], spovede: [], oznam: '  ' },
          { datum: '2026-11-06', spovede: [{ od: '16:00' }, { od: '15:00' }] },
        ],
      }),
    )
    expect(s.dni.map((d) => d.datum)).toEqual(['2026-11-06', '2026-11-08'])
    expect(s.dni[0]!.spovede.map((x) => x.od)).toEqual(['15:00', '16:00'])
    expect(s.dni[1]!.bohosluzby.map((b) => b.cas)).toEqual(['08:00', '10:00'])
  })

  it('odmietne chybné hodnoty so zrozumiteľnou cestou', () => {
    const zly = (dni: unknown) => () => parsujIntencie(JSON.stringify({ verzia: 1, dni }))
    expect(zly([{ datum: '2026-11-01', bohosluzby: [{ cas: '8:00', typ: 'liturgia' }] }])).toThrow(/bohosluzby\[0\]\.cas/)
    expect(zly([{ datum: '2026-11-01', bohosluzby: [{ cas: '08:00', typ: 'omsa' }] }])).toThrow(ChybaFormatu)
    expect(zly([{ datum: '2026-11-01', bohosluzby: [{ cas: '08:00', typ: 'liturgia', intencie: [{ znak: '-' }] }] }])).toThrow(/znak/)
    expect(zly([{ datum: '2026-11-01', oznam: 'a' }, { datum: '2026-11-01', oznam: 'b' }])).toThrow(/viackrát/)
    expect(() => parsujIntencie('{"verzia":2,"dni":[]}')).toThrow(/verzia/)
    expect(() => parsujIntencie('nie json')).toThrow(/neplatný JSON/)
  })

  it('zvládne BOM na začiatku súboru', () => {
    expect(parsujIntencie('﻿' + PRIKLAD).dni).toHaveLength(1)
  })

  it('prázdny súbor', () => {
    expect(serializujIntencie(prazdnySubor())).toBe('{\n  "verzia": 1,\n  "dni": []\n}\n')
  })
})

describe('formulár ↔ JSON', () => {
  it('deň → formulár → deň vráti presne to isté', () => {
    const subor = parsujIntencie(PRIKLAD)
    const den = subor.dni[0]!
    expect(formularNaDen(denNaFormular(den.datum, den))).toEqual(den)
  })

  it('text intencie uloží presne tak, ako bol napísaný', () => {
    const f: DenForm = {
      datum: '2026-11-02',
      bohosluzby: [
        {
          kluc: k,
          cas: '16:30',
          typ: 'liturgia',
          intencie: [
            { kluc: k, znak: '*', text: '  zdravie a Božie požehnanie pre rod. Novákovú ', objednal: 'p. Nováková', poznamka: '' },
            { kluc: k, znak: '+', text: 'Mária, Ján', objednal: '', poznamka: '' },
          ],
        },
      ],
      spovede: [],
      oznam: '',
    }
    const den = formularNaDen(f)!
    expect(den.bohosluzby[0]!.intencie.map(formatIntencia)).toEqual([
      '*  zdravie a Božie požehnanie pre rod. Novákovú ',
      '+Mária, Ján',
    ])
    expect(den.bohosluzby[0]!.intencie[0]).toEqual({
      znak: '*',
      text: '  zdravie a Božie požehnanie pre rod. Novákovú ',
      objednal: 'p. Nováková',
      poznamka: '',
    })
  })

  it('kľúč pre React sa do JSON nedostane a kľúče sú v poradí zo SCHEMA.md', () => {
    const f = denNaFormular('2026-11-06')
    f.bohosluzby.push(novaBohosluzba('16:30'))
    f.bohosluzby[0]!.intencie[0]!.text = 'Peter'
    f.spovede.push(spovedPred('16:30'))
    const json = serializujIntencie(nahradDen(prazdnySubor(), f.datum, formularNaDen(f)))
    expect(json).not.toContain('kluc')
    const den = JSON.parse(json).dni[0]
    expect(Object.keys(den)).toEqual(['datum', 'bohosluzby', 'spovede', 'oznam'])
    expect(Object.keys(den.bohosluzby[0])).toEqual(['cas', 'typ', 'intencie'])
    expect(Object.keys(den.bohosluzby[0].intencie[0])).toEqual(['znak', 'text', 'objednal', 'poznamka'])
    expect(Object.keys(den.spovede[0])).toEqual(['od', 'do', 'poznamka'])
    expect(den.spovede[0]).toEqual({ od: '15:30', do: '', poznamka: '' })
  })

  it('prázdne riadky intencií a spovedí vynechá, prázdny deň vráti ako null', () => {
    const f = denNaFormular('2026-11-03')
    f.bohosluzby.push(novaBohosluzba('17:00')) // obsahuje 1 prázdnu intenciu
    f.spovede.push({ kluc: k, od: '', do: '', poznamka: '' })
    expect(formularNaDen(f)).toEqual({
      datum: '2026-11-03',
      bohosluzby: [{ cas: '17:00', typ: 'liturgia', intencie: [] }],
      spovede: [],
      oznam: '',
    })
    expect(formularNaDen({ datum: '2026-11-03', bohosluzby: [], spovede: [], oznam: '   ' })).toBeNull()
  })

  it('oznam uloží presne, len samé medzery ako ""', () => {
    const f = denNaFormular('2026-11-03')
    f.oznam = 'Zbierka na charitu.\nĎakujeme.'
    expect(formularNaDen(f)!.oznam).toBe('Zbierka na charitu.\nĎakujeme.')
  })

  it('validácia formulára', () => {
    const f: DenForm = {
      datum: '2026-11-03',
      bohosluzby: [
        { kluc: k, cas: '', typ: 'liturgia', intencie: [{ kluc: k, znak: '+', text: '', objednal: 'Anna', poznamka: '' }] },
      ],
      spovede: [
        { kluc: k, od: '', do: '', poznamka: 'pred liturgiou' },
        { kluc: k, od: '16:00', do: '15:00', poznamka: '' },
      ],
      oznam: '',
    }
    expect(validujFormular(f).map((c) => c.cesta)).toEqual([
      'bohosluzby.0.cas',
      'bohosluzby.0.intencie.0.text',
      'spovede.0.od',
      'spovede.1.do',
    ])
    const r = ulozDen(prazdnySubor(), f)
    expect(r.chyby).toHaveLength(4)
    expect(r.subor.dni).toEqual([])
  })

  it('uloženie prázdneho formulára deň zmaže', () => {
    const subor = parsujIntencie(PRIKLAD)
    const r = ulozDen(subor, denNaFormular('2026-12-23'))
    expect(r.chyby).toEqual([])
    expect(r.subor.dni).toEqual([])
  })
})

describe('rýchle voľby a kopírovanie', () => {
  it('moleben 20 min a spoveď hodinu pred liturgiou', () => {
    expect(molebenPred('16:30')).toMatchObject({ cas: '16:10', typ: 'moleben', intencie: [] })
    expect(spovedPred('17:00')).toMatchObject({ od: '16:00', do: '' })
  })

  it('prvá liturgia dňa ignoruje moleben a chýbajúci čas', () => {
    const f = denNaFormular('2026-11-06')
    f.bohosluzby.push(molebenPred('17:00'), novaBohosluzba('17:00'), novaBohosluzba(''))
    expect(prvaLiturgia(f)?.cas).toBe('17:00')
  })

  it('skopíruje bohoslužbu na iný deň s intenciami aj bez', () => {
    const s = parsujIntencie(PRIKLAD)
    const s1 = kopirujBohosluzbu(s, '2026-12-23', 0, '2026-12-30', false)
    expect(s1.dni.map((d) => d.datum)).toEqual(['2026-12-23', '2026-12-30'])
    expect(s1.dni[1]).toEqual({
      datum: '2026-12-30',
      bohosluzby: [{ cas: '16:30', typ: 'liturgia', intencie: [] }],
      spovede: [],
      oznam: '',
    })
    const s2 = kopirujBohosluzbu(s1, '2026-12-23', 0, '2026-12-30', true)
    expect(s2.dni[1]!.bohosluzby[1]!.intencie.map(formatIntencia)).toEqual(['+Mária, Ján'])
    // pôvodný súbor sa nezmenil
    expect(s.dni).toHaveLength(1)
  })
})

describe('zobrazenie', () => {
  it('značky dňa a týždeň Po–Ne', () => {
    const s = parsujIntencie(PRIKLAD)
    expect(znackyDna(s.dni[0])).toEqual({ bohosluzby: 1, spoved: true, oznam: false })
    expect(znackyDna(undefined)).toEqual({ bohosluzby: 0, spoved: false, oznam: false })
    const t = dniTyzdna(s, '2026-12-23')
    expect(t.map((d) => d.datum)).toEqual([
      '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-27',
    ])
    expect(t[2]!.den?.datum).toBe('2026-12-23')
    expect(t[0]!.den).toBeUndefined()
  })
})
