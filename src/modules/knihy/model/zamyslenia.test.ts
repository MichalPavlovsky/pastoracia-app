import { describe, expect, it } from 'vitest'
import { parsujZamyslenia, pripraveneDo, prazdneZamyslenia, serializujZamyslenia, zamyslenieNaDen } from './zamyslenia'

const PRIKLAD = `{
  "verzia": 1,
  "dni": [
    {
      "datum": "2026-10-25",
      "nazov": "Nedeľa Krista Kráľa",
      "citania": "Kol 1, 12-18 · Jn 18, 33-37",
      "svati": "Mučeníci Marcián a Martýrios",
      "myslienka": "Ježiš je Kráľ, ktorý nevládne silou, ale pravdou.",
      "otazka": "Komu dnes v mojom živote patrí trón?",
      "zdroje": [
        {
          "nazov": "casoslov.sk",
          "url": "https://casoslov.sk/?day=2026-10-25"
        }
      ],
      "texty": [
        {
          "nazov": "Evanjelium",
          "odkaz": "Jn 18, 33-37",
          "url": "https://casoslov.sk/?page=pray&day=2026-10-25&id=1"
        }
      ],
      "dalsie": [
        {
          "druh": "otcovia",
          "nazov": "Otcovia k evanjeliu",
          "zdroj": "Catena Aurea",
          "text": "Vlastnými slovami.",
          "url": "https://catenaaurea.sk/CommentedBibleTextsDirect.php?volba=Jn%2018,33"
        }
      ]
    }
  ]
}
`

describe('zamyslenia-web.json', () => {
  it('príklad sa načíta a zapíše rovnako', () => {
    expect(serializujZamyslenia(parsujZamyslenia(PRIKLAD))).toBe(PRIKLAD)
  })

  it('doplní chýbajúce polia a zoradí podľa dátumu', () => {
    const d = parsujZamyslenia('{"verzia":1,"dni":[{"datum":"2026-10-27"},{"datum":"2026-10-26","myslienka":"x"}]}')
    expect(d.dni.map((x) => x.datum)).toEqual(['2026-10-26', '2026-10-27'])
    expect(d.dni[1]).toEqual({ datum: '2026-10-27', nazov: '', citania: '', svati: '', myslienka: '', otazka: '', zdroje: [], texty: [], dalsie: [] })
    expect(pripraveneDo(d)).toBe('2026-10-27')
    expect(pripraveneDo(prazdneZamyslenia())).toBeNull()
  })

  it('neznámy druh ďalšieho zamyslenia je chyba', () => {
    expect(() => parsujZamyslenia('{"verzia":1,"dni":[{"datum":"2026-10-25","dalsie":[{"druh":"x"}]}]}')).toThrow(/druh/)
  })

  it('chybný alebo zdvojený dátum je chyba', () => {
    expect(() => parsujZamyslenia('{"verzia":1,"dni":[{"datum":"25.10."}]}')).toThrow()
    expect(() => parsujZamyslenia('{"verzia":1,"dni":[{"datum":"2026-10-25"},{"datum":"2026-10-25"}]}')).toThrow(/viackrát/)
  })

  it('zamyslenie na deň', () => {
    const d = parsujZamyslenia(PRIKLAD)
    expect(zamyslenieNaDen(d, '2026-10-25')?.nazov).toBe('Nedeľa Krista Kráľa')
    expect(zamyslenieNaDen(d, '2026-10-26')).toBeUndefined()
  })
})
