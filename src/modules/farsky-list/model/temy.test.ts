import { describe, expect, it } from 'vitest'
import {
  dalsiStav,
  najdiTemu,
  nastavPoznamkuTyzdna,
  parsujPlan,
  prazdnyPlan,
  prepniStav,
  presunTemu,
  pridajTemu,
  serializujPlan,
  temaNaFormular,
  temaZoZdielania,
  tyzdneDopredu,
  upravTemu,
  validujTemu,
  zmazTemu,
  zoradTemy,
  type TemaForm,
} from './temy'

const PRIKLAD = `{
  "verzia": 1,
  "tyzdne": [
    {
      "pondelok": "2026-11-02",
      "temy": [
        {
          "id": "t-1",
          "nazov": "Dušičky – odpustky",
          "zdroje": [
            "https://example.org/odpustky"
          ],
          "poznamka": "krátko, 1 strana",
          "poradie": 1,
          "stav": "plan"
        }
      ],
      "poznamka": ""
    }
  ]
}
`

const form = (nazov: string, zdroje = ''): TemaForm => ({ nazov, zdroje, poznamka: '', stav: 'napad' })

describe('farsky-list-plan.json – čítanie a zápis', () => {
  it('príklad sa načíta a zapíše bajt po bajte rovnako', () => {
    expect(serializujPlan(parsujPlan(PRIKLAD))).toBe(PRIKLAD)
  })

  it('prázdny plán', () => {
    expect(serializujPlan(prazdnyPlan())).toBe('{\n  "verzia": 1,\n  "tyzdne": []\n}\n')
  })

  it('doplní chýbajúce polia a prečísluje poradie 1..n', () => {
    const p = parsujPlan(
      JSON.stringify({
        verzia: 1,
        tyzdne: [
          {
            pondelok: '2026-11-09',
            temy: [
              { id: 't-b', nazov: 'B', poradie: 5, stav: 'napad' },
              { id: 't-a', nazov: 'A', poradie: 2, stav: 'pouzite' },
            ],
          },
        ],
      }),
    )
    expect(p.tyzdne[0]).toEqual({
      pondelok: '2026-11-09',
      temy: [
        { id: 't-a', nazov: 'A', zdroje: [], poznamka: '', poradie: 1, stav: 'pouzite' },
        { id: 't-b', nazov: 'B', zdroje: [], poznamka: '', poradie: 2, stav: 'napad' },
      ],
      poznamka: '',
    })
  })

  it('odmietne chybné hodnoty', () => {
    const zly = (tyzdne: unknown) => () => parsujPlan(JSON.stringify({ verzia: 1, tyzdne }))
    expect(zly([{ pondelok: '2026-11-03', temy: [] }])).toThrow(/nie je pondelok/)
    expect(zly([{ pondelok: '2026-11-02', temy: [{ id: 't-1', stav: 'hotovo' }] }])).toThrow(/stav/)
    expect(zly([{ pondelok: '2026-11-02', temy: [{ stav: 'plan' }] }])).toThrow(/id/)
  })

  it('poradie kľúčov podľa SCHEMA.md', () => {
    const { plan } = pridajTemu(prazdnyPlan(), '2026-11-02', form('Advent', 'https://a.sk'))
    const t = JSON.parse(serializujPlan(plan)).tyzdne[0]
    expect(Object.keys(t)).toEqual(['pondelok', 'temy', 'poznamka'])
    expect(Object.keys(t.temy[0])).toEqual(['id', 'nazov', 'zdroje', 'poznamka', 'poradie', 'stav'])
  })
})

describe('úpravy plánu', () => {
  it('pridanie témy: id t-uuid, poradie na koniec, zdroje po riadkoch', () => {
    let p = parsujPlan(PRIKLAD)
    const r = pridajTemu(p, '2026-11-02', form('  Svätý Martin ', 'https://a.sk\n\n  https://b.sk  '))
    p = r.plan
    expect(r.id).toMatch(/^t-[0-9a-f-]{36}$/)
    expect(najdiTemu(p, r.id)?.tema).toEqual({
      id: r.id,
      nazov: 'Svätý Martin',
      zdroje: ['https://a.sk', 'https://b.sk'],
      poznamka: '',
      poradie: 2,
      stav: 'napad',
    })
    expect(() => pridajTemu(p, '2026-11-04', form('x'))).toThrow()
  })

  it('formulár témy tam a späť', () => {
    const p = parsujPlan(PRIKLAD)
    const f = temaNaFormular(najdiTemu(p, 't-1')!.tema)
    expect(f).toEqual({ nazov: 'Dušičky – odpustky', zdroje: 'https://example.org/odpustky', poznamka: 'krátko, 1 strana', stav: 'plan' })
    expect(serializujPlan(upravTemu(p, 't-1', f))).toBe(PRIKLAD)
    expect(validujTemu(form('  '))).toHaveLength(1)
  })

  it('presun na iný týždeň zachová id a prázdny týždeň zmizne', () => {
    const p = presunTemu(parsujPlan(PRIKLAD), 't-1', '2026-11-16')
    expect(p.tyzdne.map((t) => t.pondelok)).toEqual(['2026-11-16'])
    expect(p.tyzdne[0]!.temy[0]).toMatchObject({ id: 't-1', poradie: 1, stav: 'plan' })
  })

  it('presun na koniec týždňa, kde už témy sú', () => {
    let p = pridajTemu(parsujPlan(PRIKLAD), '2026-11-09', form('A')).plan
    p = presunTemu(p, 't-1', '2026-11-09')
    expect(p.tyzdne[0]!.temy.map((t) => [t.nazov, t.poradie])).toEqual([
      ['A', 1],
      ['Dušičky – odpustky', 2],
    ])
  })

  it('zmena poradia ťahaním', () => {
    let p = parsujPlan(PRIKLAD)
    const a = pridajTemu(p, '2026-11-02', form('A'))
    const b = pridajTemu(a.plan, '2026-11-02', form('B'))
    p = zoradTemy(b.plan, '2026-11-02', [b.id, 't-1', a.id])
    expect(p.tyzdne[0]!.temy.map((t) => [t.nazov, t.poradie])).toEqual([
      ['B', 1],
      ['Dušičky – odpustky', 2],
      ['A', 3],
    ])
    expect(() => zoradTemy(p, '2026-11-02', ['t-1'])).toThrow()
  })

  it('stav jedným klikom dokola', () => {
    expect(dalsiStav('napad')).toBe('plan')
    expect(dalsiStav('plan')).toBe('pouzite')
    expect(dalsiStav('pouzite')).toBe('napad')
    expect(najdiTemu(prepniStav(parsujPlan(PRIKLAD), 't-1'), 't-1')?.tema.stav).toBe('pouzite')
  })

  it('zmazanie a poznámka týždňa', () => {
    let p = zmazTemu(parsujPlan(PRIKLAD), 't-1')
    expect(p.tyzdne).toEqual([])
    p = nastavPoznamkuTyzdna(p, '2026-11-23', 'Krista Kráľa – bez listu?')
    expect(p.tyzdne).toEqual([{ pondelok: '2026-11-23', temy: [], poznamka: 'Krista Kráľa – bez listu?' }])
  })

  it('8 týždňov dopredu vrátane prázdnych', () => {
    const t = tyzdneDopredu(parsujPlan(PRIKLAD), '2026-10-31')
    expect(t).toHaveLength(8)
    expect(t[0]!.pondelok).toBe('2026-10-26')
    expect(t[1]!.temy).toHaveLength(1)
    expect(t[7]!.pondelok).toBe('2026-12-14')
  })
})

describe('zdieľanie odkazu', () => {
  it('Android: title + url', () => {
    expect(temaZoZdielania({ title: 'Odpustky za zosnulých', url: 'https://tkkbs.sk/x' })).toEqual({
      nazov: 'Odpustky za zosnulých',
      zdroje: 'https://tkkbs.sk/x',
      poznamka: '',
      stav: 'napad',
    })
  })

  it('odkaz schovaný v texte', () => {
    expect(temaZoZdielania({ text: 'Pozri toto https://grkat.sk/clanok?id=5' })).toMatchObject({
      nazov: 'Pozri toto',
      zdroje: 'https://grkat.sk/clanok?id=5',
    })
  })

  it('text navyše k názvu ide do poznámky', () => {
    expect(temaZoZdielania({ title: 'Článok', text: 'dobré na advent https://a.sk', url: '' })).toMatchObject({
      nazov: 'Článok',
      zdroje: 'https://a.sk',
      poznamka: 'dobré na advent',
    })
  })
})
