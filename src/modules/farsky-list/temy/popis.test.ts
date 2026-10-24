import { describe, expect, it } from 'vitest'
import { jeOdkaz, popisTyzdna, popisTyzdnaKratky, skratOdkaz } from './popis'

describe('popisTyzdna', () => {
  it('krátky popis týždňa', () => {
    expect(popisTyzdnaKratky('2026-11-02')).toBe('2. 11. – 8. 11.')
  })
  it('s rokom', () => {
    expect(popisTyzdna('2026-11-02')).toBe('2. 11. – 8. 11. 2026')
  })
  it('cez prelom mesiaca a roka', () => {
    expect(popisTyzdna('2026-10-26')).toBe('26. 10. – 1. 11. 2026')
    expect(popisTyzdna('2026-12-28')).toBe('28. 12. 2026 – 3. 1. 2027')
  })
})

describe('skratOdkaz', () => {
  it('vynechá www a query', () => {
    expect(skratOdkaz('https://www.vaticannews.va/sk/pápež.html?x=1')).toBe('vaticannews.va/sk/pápež.html')
  })
  it('hlavná stránka je len hostiteľ', () => {
    expect(skratOdkaz('https://example.com/')).toBe('example.com')
  })
  it('dlhú cestu skráti', () => {
    const r = skratOdkaz(`https://example.com/${'a'.repeat(50)}`)
    expect(r).toBe(`example.com/${'a'.repeat(29)}…`)
  })
  it('neplatný odkaz vráti text', () => {
    expect(skratOdkaz('niečo')).toBe('niečo')
  })
})

describe('jeOdkaz', () => {
  it('rozpozná http a https', () => {
    expect(jeOdkaz('https://a.sk')).toBe(true)
    expect(jeOdkaz('javascript:alert(1)')).toBe(false)
  })
})
