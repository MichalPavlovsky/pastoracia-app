// Vstupný bod dátovej služby pre moduly:
//
//   const intencie = uloziste.subor(INTENCIE)   // DefiniciaSuboru z modulu
//   intencie.data / intencie.stav / intencie.uloz(...)
//
// Nový modul = nová DefiniciaSuboru, nič iné netreba meniť.

import { DatovySubor } from './sync'
import type { DefiniciaSuboru, LokalnaCache, Stav, VzdialeneUloziste } from './types'

// Od najdôležitejšieho po najmenej dôležitý
const PRIORITA_STAVU: Stav[] = ['chyba', 'konflikt', 'caka', 'offline', 'odosiela', 'nacitava', 'synchronizovane']

export class Uloziste {
  private subory = new Map<string, DatovySubor<unknown>>()
  private odhlasenia: Array<() => void> = []
  private posluchaciStavu = new Set<() => void>()

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
      this.odhlasenia.push(s.odober(() => this.oznamStav()))
      void s.nacitaj()
      // subor() sa volá aj počas renderu – oznámenie až po ňom
      queueMicrotask(() => this.oznamStav())
    }
    return s
  }

  /** Najdôležitejší stav zo všetkých súborov (na jednu bodku v hornej lište). */
  celkovyStav(): Stav {
    const stavy = new Set([...this.subory.values()].map((s) => s.stav.stav))
    return PRIORITA_STAVU.find((st) => stavy.has(st)) ?? 'synchronizovane'
  }

  /** Prihlásenie na zmeny stavu ktoréhokoľvek súboru, aj tých zaregistrovaných neskôr. */
  odoberStav(cb: () => void): () => void {
    this.posluchaciStavu.add(cb)
    return () => this.posluchaciStavu.delete(cb)
  }

  private oznamStav(): void {
    for (const cb of this.posluchaciStavu) cb()
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
    for (const odhlas of this.odhlasenia) odhlas()
    this.odhlasenia = []
    this.subory.clear()
    this.oznamStav()
    await this.cache.vymazVsetko()
  }
}
