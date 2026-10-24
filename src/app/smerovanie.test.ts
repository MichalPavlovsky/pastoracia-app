import { describe, expect, it } from 'vitest'
import { parsujHash } from './smerovanie'

describe('parsujHash', () => {
  it.each(['', '#', '#/', '/'])('%j je koreň', (hash) => {
    expect(parsujHash(hash).cesta).toBe('/')
  })

  it('oddelí cestu a parametre', () => {
    const { cesta, parametre } = parsujHash('#/farsky-list/temy/pridat?url=https%3A%2F%2Fa.sk&title=X')
    expect(cesta).toBe('/farsky-list/temy/pridat')
    expect(parametre.get('url')).toBe('https://a.sk')
    expect(parametre.get('title')).toBe('X')
  })

  it('odstráni koncové lomítko, ale nie z koreňa', () => {
    expect(parsujHash('#/farsky-list/').cesta).toBe('/farsky-list')
    expect(parsujHash('#/nastavenia/?a=1').cesta).toBe('/nastavenia')
  })

  it('cesta bez úvodného lomítka', () => {
    expect(parsujHash('#nastavenia').cesta).toBe('/nastavenia')
  })

  it('bez parametrov je prázdny zoznam', () => {
    expect([...parsujHash('#/nastavenia').parametre]).toEqual([])
  })
})
