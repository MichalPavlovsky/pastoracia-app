// Falošný OneDrive pre testy – správa sa ako Graph: eTagy, konflikty, výpadok siete.

import { ChybaSiete, KonfliktZapisu, type VzdialenySubor, type VzdialeneUloziste } from './types'

export class FalosnyOneDrive implements VzdialeneUloziste {
  subory = new Map<string, VzdialenySubor>()
  offline = false
  zapisy = 0
  private pocitadlo = 0
  /** zavolá sa pred zápisom – na simuláciu zmeny z iného zariadenia „práve teraz“ */
  predZapisom: (() => void) | null = null

  private overSiet() {
    if (this.offline) throw new ChybaSiete()
  }

  /** Zmena z iného zariadenia (alebo od Claude na PC). */
  zmenZvonku(nazov: string, obsah: string): string {
    const etag = `"e${++this.pocitadlo}"`
    this.subory.set(nazov, { obsah, etag })
    return etag
  }

  async nacitaj(nazov: string) {
    this.overSiet()
    const s = this.subory.get(nazov)
    return s ? { ...s } : null
  }

  async etag(nazov: string) {
    this.overSiet()
    return this.subory.get(nazov)?.etag ?? null
  }

  async zapis(nazov: string, obsah: string, etag: string | null) {
    this.overSiet()
    const f = this.predZapisom
    this.predZapisom = null
    f?.()
    const s = this.subory.get(nazov)
    if (etag === null ? s !== undefined : s?.etag !== etag) throw new KonfliktZapisu(nazov)
    this.zapisy++
    return this.zmenZvonku(nazov, obsah)
  }
}
