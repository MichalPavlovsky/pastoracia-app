import { describe, expect, it } from 'vitest'
import {
  denVTyzdni,
  jeCas,
  jeDatum,
  jeNedela,
  jePrvyPiatok,
  pondelokTyzdna,
  posunCas,
  pridajDni,
  prvyPiatokMesiaca,
  tyzdenSPrvymPiatkom,
} from './datum'

describe('datum', () => {
  it('overí formát dátumu a času', () => {
    expect(jeDatum('2026-12-23')).toBe(true)
    expect(jeDatum('2026-02-30')).toBe(false)
    expect(jeDatum('2026-1-5')).toBe(false)
    expect(jeCas('08:00')).toBe(true)
    expect(jeCas('8:00')).toBe(false)
    expect(jeCas('24:00')).toBe(false)
  })

  it('týždeň začína pondelkom', () => {
    expect(denVTyzdni('2026-11-02')).toBe(0)
    expect(jeNedela('2026-11-01')).toBe(true)
    expect(pondelokTyzdna('2026-11-01')).toBe('2026-10-26')
    expect(pondelokTyzdna('2026-11-02')).toBe('2026-11-02')
  })

  it('prechod cez letný čas a koniec roka neposunie deň', () => {
    expect(pridajDni('2026-10-24', 7)).toBe('2026-10-31')
    expect(pridajDni('2026-03-28', 1)).toBe('2026-03-29')
    expect(pridajDni('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('prvý piatok mesiaca', () => {
    expect(prvyPiatokMesiaca('2026-11-20')).toBe('2026-11-06')
    expect(prvyPiatokMesiaca('2026-05-15')).toBe('2026-05-01')
    expect(jePrvyPiatok('2026-12-04')).toBe(true)
    expect(jePrvyPiatok('2026-12-11')).toBe(false)
    expect(tyzdenSPrvymPiatkom('2026-11-02')).toBe(true)
    expect(tyzdenSPrvymPiatkom('2026-11-08')).toBe(true)
    expect(tyzdenSPrvymPiatkom('2026-11-09')).toBe(false)
    // piatok 1. 1. 2027 patrí do týždňa, ktorý začína v decembri
    expect(tyzdenSPrvymPiatkom('2026-12-28')).toBe(true)
  })

  it('posun času', () => {
    expect(posunCas('16:30', -20)).toBe('16:10')
    expect(posunCas('08:00', -60)).toBe('07:00')
  })
})
