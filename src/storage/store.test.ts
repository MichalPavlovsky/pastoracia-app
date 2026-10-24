import { describe, expect, it, vi } from 'vitest'
import { INTENCIE } from '../modules/intencie-sopkovce/data'
import { PLAN } from '../modules/farsky-list/data'
import { prazdnySubor } from '../modules/intencie-sopkovce/model/intencie'
import { PamatovaCache } from './cache'
import { Uloziste } from './store'
import { FalosnyOneDrive } from './test-pomocky'

describe('Uloziste – celkový stav', () => {
  it('bez súborov je synchronizované', () => {
    const u = new Uloziste(new FalosnyOneDrive(), new PamatovaCache())
    expect(u.celkovyStav()).toBe('synchronizovane')
  })

  it('počas načítavania je nacitava, potom synchronizované', async () => {
    const u = new Uloziste(new FalosnyOneDrive(), new PamatovaCache())
    const intencie = u.subor(INTENCIE)
    expect(u.celkovyStav()).toBe('nacitava')
    await intencie.nacitaj()
    expect(u.celkovyStav()).toBe('synchronizovane')
  })

  it('čakajúca zmena prevládne nad ostatnými súbormi', async () => {
    const od = new FalosnyOneDrive()
    const u = new Uloziste(od, new PamatovaCache())
    const intencie = u.subor(INTENCIE)
    const plan = u.subor(PLAN)
    await Promise.all([intencie.nacitaj(), plan.nacitaj()])
    od.offline = true
    const dni = [{ datum: '2026-11-02', bohosluzby: [], spovede: [], oznam: 'x' }]
    await intencie.uloz({ ...prazdnySubor(), dni })
    expect(plan.stav.stav).toBe('synchronizovane')
    expect(u.celkovyStav()).toBe('caka')
  })

  it('offline bez čakajúcich zmien', async () => {
    const od = new FalosnyOneDrive()
    od.offline = true
    const u = new Uloziste(od, new PamatovaCache())
    await u.subor(INTENCIE).nacitaj()
    expect(u.celkovyStav()).toBe('offline')
  })
})

describe('Uloziste – odoberStav', () => {
  it('oznámi zmenu súboru zaregistrovaného až po prihlásení', async () => {
    const u = new Uloziste(new FalosnyOneDrive(), new PamatovaCache())
    const cb = vi.fn()
    u.odoberStav(cb)
    const plan = u.subor(PLAN)
    expect(cb).toHaveBeenCalled()
    cb.mockClear()
    await plan.nacitaj()
    expect(cb).toHaveBeenCalled()
  })

  it('po odhlásení už nevolá', async () => {
    const u = new Uloziste(new FalosnyOneDrive(), new PamatovaCache())
    const cb = vi.fn()
    const odhlas = u.odoberStav(cb)
    odhlas()
    await u.subor(INTENCIE).nacitaj()
    expect(cb).not.toHaveBeenCalled()
  })
})
