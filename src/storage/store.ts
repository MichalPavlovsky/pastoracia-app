// Vstupný bod dátovej služby pre moduly:
//
//   const intencie = uloziste.subor(INTENCIE)   // DefiniciaSuboru z modulu
//   intencie.data / intencie.stav / intencie.uloz(...)
//
// Nový modul = nová DefiniciaSuboru, nič iné netreba meniť.

import { DatovySubor } from './sync'
import type { DefiniciaSuboru, LokalnaCache, VzdialeneUloziste } from './types'

export class Uloziste {
  private subory = new Map<string, DatovySubor<unknown>>()

  constructor(
    private vzdialene: VzdialeneUloziste,
    private cache: LokalnaCache,
  ) {}

  /** Vráti (a pri prvom volaní začne načítavať) dátový súbor. */
  subor<T>(def: DefiniciaSuboru<T>): DatovySubor<T> {
    let s = this.subory.get(def.nazov) as DatovySubor<T> | undefined
    if (!s) {
      s = new DatovySubor(def, this.vzdialene, this.cache)
      this.subory.set(def.nazov, s as DatovySubor<unknown>)
      void s.nacitaj()
    }
    return s
  }

  async synchronizujVsetko(): Promise<void> {
    await Promise.all([...this.subory.values()].map((s) => s.synchronizuj()))
  }

  /** Po pripojení k internetu a po návrate do aplikácie odošle čakajúce zmeny. */
  sledujPripojenie(win: Window = window): () => void {
    const sync = () => void this.synchronizujVsetko()
    const viditelne = () => {
      if (win.document.visibilityState === 'visible') sync()
    }
    win.addEventListener('online', sync)
    win.document.addEventListener('visibilitychange', viditelne)
    return () => {
      win.removeEventListener('online', sync)
      win.document.removeEventListener('visibilitychange', viditelne)
    }
  }

  /** Pri odhlásení: zmaže lokálne kópie (OneDrive ostane nedotknutý). */
  async vymazLokalneData(): Promise<void> {
    this.subory.clear()
    await this.cache.vymazVsetko()
  }
}
