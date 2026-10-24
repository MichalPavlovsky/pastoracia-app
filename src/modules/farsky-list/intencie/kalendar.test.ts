import { describe, expect, it } from 'vitest'
import { datumKratko, mesiacDatumu, mriezkaMesiaca, nazovMesiaca, NAZVY_DNI_KRATKE, posunMesiac } from './kalendar'

describe('kalendar', () => {
  it('mriezka novembra 2026 začína nedeľou 1. 11. a siaha od pondelka 26. 10. do nedele 6. 12.', () => {
    const m = mriezkaMesiaca('2026-11')
    expect(m).toHaveLength(42)
    expect(m[0]).toBe('2026-10-26')
    expect(m[41]).toBe('2026-12-06')
    expect(m[6]).toBe('2026-11-01')
  })

  it('mriezka februára 2027 má presne 4 týždne', () => {
    const m = mriezkaMesiaca('2027-02')
    expect(m).toHaveLength(28)
    expect(m[0]).toBe('2027-02-01')
    expect(m[27]).toBe('2027-02-28')
  })

  it('mriezka má vždy násobok 7 dní, začína pondelkom a končí nedeľou', () => {
    for (let o = 0; o < 24; o++) {
      const m = mriezkaMesiaca(posunMesiac('2026-01', o))
      expect(m.length % 7).toBe(0)
      expect(m.length).toBeGreaterThanOrEqual(28)
      expect(m.length).toBeLessThanOrEqual(42)
    }
    const m = mriezkaMesiaca('2026-12')
    expect(m[0]).toBe('2026-11-30')
    expect(m[m.length - 1]).toBe('2027-01-03')
  })

  it('posun mesiaca cez hranicu roka', () => {
    expect(posunMesiac('2026-12', 1)).toBe('2027-01')
    expect(posunMesiac('2027-01', -1)).toBe('2026-12')
    expect(posunMesiac('2026-11', 14)).toBe('2028-01')
    expect(posunMesiac('2026-11', -11)).toBe('2025-12')
    expect(posunMesiac('2026-11', 0)).toBe('2026-11')
  })

  it('mesiac z dátumu a názov mesiaca', () => {
    expect(mesiacDatumu('2026-11-06')).toBe('2026-11')
    expect(nazovMesiaca('2026-11')).toBe('november 2026')
    expect(nazovMesiaca('2027-01')).toBe('január 2027')
    expect(nazovMesiaca('2027-05')).toBe('máj 2027')
  })

  it('krátky dátum', () => {
    expect(NAZVY_DNI_KRATKE).toEqual(['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'])
    expect(datumKratko('2026-11-02')).toBe('Po 2. 11.')
    expect(datumKratko('2026-11-05')).toBe('Št 5. 11.')
    expect(datumKratko('2026-11-29')).toBe('Ne 29. 11.')
  })
})
