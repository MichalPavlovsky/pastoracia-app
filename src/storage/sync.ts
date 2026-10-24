// Jeden dátový súbor: lokálna kópia v IndexedDB + synchronizácia s OneDrive.
//
// Postup:
//  1. nacitaj()  – okamžite dáta z IndexedDB, potom skontroluje OneDrive.
//  2. uloz(data) – zmena sa hneď uloží v zariadení (lokalne) a pokúsi sa odoslať.
//  3. Odoslanie ide s eTagom (If-Match). Ak sa súbor medzitým zmenil inde,
//     načíta sa novšia verzia a zlúči sa s mojou zmenou (trojcestne, voči poslednej
//     spoločnej verzii). Bez konfliktu sa výsledok odošle hneď, s konfliktom čaká
//     na potvrdenie používateľa.

import {
  ChybaPrihlasenia,
  ChybaSiete,
  KonfliktZapisu,
  type DefiniciaSuboru,
  type LokalnaCache,
  type Stav,
  type StavSuboru,
  type VzdialeneUloziste,
  type ZaznamSuboru,
} from './types'

const MAX_POKUSOV = 3

export class DatovySubor<T> {
  private z: ZaznamSuboru | null = null
  private _data: T
  private _stav: StavSuboru = { stav: 'nacitava', chyba: '', posledneZlucenie: [], konflikt: null }
  private posluchaci = new Set<() => void>()
  private nacitanie: Promise<void> | null = null
  private beziSync: Promise<void> | null = null
  private znova = false

  constructor(
    private def: DefiniciaSuboru<T>,
    private vzdialene: VzdialeneUloziste,
    private cache: LokalnaCache,
  ) {
    this._data = def.prazdny()
  }

  get nazov(): string {
    return this.def.nazov
  }

  get data(): T {
    return this._data
  }

  get stav(): StavSuboru {
    return this._stav
  }

  /** Prihlásenie na zmeny dát alebo stavu. Vráti funkciu na odhlásenie. */
  odober(cb: () => void): () => void {
    this.posluchaci.add(cb)
    return () => this.posluchaci.delete(cb)
  }

  /** Načíta z IndexedDB a potom zosynchronizuje s OneDrive. Opakované volanie nič nerobí. */
  nacitaj(): Promise<void> {
    this.nacitanie ??= (async () => {
      const ulozene = await this.cache.nacitaj(this.def.nazov)
      this.z = ulozene ?? {
        nazov: this.def.nazov,
        server: { obsah: this.def.serializuj(this.def.prazdny()), etag: null },
        lokalne: null,
        konflikt: null,
      }
      this._data = this.def.parsuj(this.z.lokalne ?? this.z.server.obsah)
      this.nastav({ konflikt: this.z.konflikt })
      await this.synchronizuj()
    })()
    return this.nacitanie
  }

  /** Uloží zmenu. Dáta sa zmenia hneď, odoslanie beží na pozadí. */
  uloz(data: T): Promise<void> {
    const z = this.zaznam()
    const text = this.def.serializuj(data)
    if (text === (z.lokalne ?? z.server.obsah)) return Promise.resolve()
    z.lokalne = text
    this._data = this.def.parsuj(text)
    this.nastav({ stav: z.konflikt ? 'konflikt' : 'caka' })
    return this.ulozCache().then(() => this.synchronizuj())
  }

  /** Odošle čakajúce zmeny a stiahne novšiu verziu z OneDrive. */
  synchronizuj(): Promise<void> {
    if (!this.z) return this.nacitaj()
    if (this.beziSync) {
      this.znova = true
      return this.beziSync
    }
    this.beziSync = (async () => {
      try {
        do {
          this.znova = false
          await this.syncKrok()
        } while (this.znova)
      } finally {
        this.beziSync = null
      }
    })()
    return this.beziSync
  }

  /** Používateľ súhlasí so zlúčenou verziou – odošle sa. */
  async potvrdZlucenie(): Promise<void> {
    const z = this.zaznam()
    z.konflikt = null
    this.nastav({ konflikt: null })
    await this.ulozCache()
    await this.synchronizuj()
  }

  /** Používateľ zahodí svoje zmeny a ponechá verziu z OneDrive. */
  async pouziVerziuZInych(): Promise<void> {
    const z = this.zaznam()
    z.lokalne = null
    z.konflikt = null
    this._data = this.def.parsuj(z.server.obsah)
    this.nastav({ stav: 'synchronizovane', konflikt: null })
    await this.ulozCache()
  }

  /** Skryje oznam o zmenách z iného zariadenia. */
  zabudniZlucenie(): void {
    this.nastav({ posledneZlucenie: [] })
  }

  // ---------- vnútro ----------

  private zaznam(): ZaznamSuboru {
    if (!this.z) throw new Error(`${this.def.nazov} ešte nie je načítaný`)
    return this.z
  }

  private async syncKrok(): Promise<void> {
    const z = this.zaznam()
    try {
      if (z.lokalne !== null && !z.konflikt) await this.odosli()
      if (z.lokalne === null) await this.obnov()
      this.nastav({ stav: this.pokojovyStav(), chyba: '' })
    } catch (e) {
      if (e instanceof ChybaSiete) {
        this.nastav({ stav: z.konflikt ? 'konflikt' : z.lokalne !== null ? 'caka' : 'offline', chyba: e.message })
      } else if (e instanceof ChybaPrihlasenia) {
        this.nastav({ stav: 'chyba', chyba: e.message })
      } else {
        this.nastav({ stav: 'chyba', chyba: e instanceof Error ? e.message : String(e) })
      }
    }
  }

  private pokojovyStav(): Stav {
    const z = this.zaznam()
    if (z.konflikt) return 'konflikt'
    return z.lokalne !== null ? 'caka' : 'synchronizovane'
  }

  private async odosli(): Promise<void> {
    const z = this.zaznam()
    for (let pokus = 0; pokus < MAX_POKUSOV; pokus++) {
      const odosielane = z.lokalne
      if (odosielane === null || z.konflikt) return
      this.nastav({ stav: 'odosiela' })
      try {
        const etag = await this.vzdialene.zapis(this.def.nazov, odosielane, z.server.etag)
        z.server = { obsah: odosielane, etag }
        // počas odosielania mohla prísť ďalšia zmena – tú nechaj čakať
        if (z.lokalne === odosielane) z.lokalne = null
        else this.znova = true
        await this.ulozCache()
        return
      } catch (e) {
        if (!(e instanceof KonfliktZapisu)) throw e
        await this.zlucSoServerom()
      }
    }
    throw new Error(`${this.def.nazov}: súbor sa stále mení na inom zariadení, skús neskôr`)
  }

  private async zlucSoServerom(): Promise<void> {
    const z = this.zaznam()
    const ich = await this.vzdialene.nacitaj(this.def.nazov)
    // čítame až po await, aby sme zachytili aj zmenu urobenú medzitým
    const moje = z.lokalne
    if (moje === null) return
    if (!ich) {
      // súbor medzitým zmizol – vytvorí sa nanovo
      z.server = { ...z.server, etag: null }
      return
    }
    const ichData = this.def.parsuj(ich.obsah)
    const v = this.def.zluc(this.def.parsuj(z.server.obsah), this.def.parsuj(moje), ichData)
    const zlucene = this.def.serializuj(v.data)
    z.server = { obsah: ich.obsah, etag: ich.etag }
    z.lokalne = zlucene === this.def.serializuj(ichData) ? null : zlucene
    z.konflikt = v.konflikty.length > 0 ? { zmenyZInych: v.zmenyZInych, konflikty: v.konflikty } : null
    this._data = this.def.parsuj(z.lokalne ?? z.server.obsah)
    this.nastav({
      konflikt: z.konflikt,
      posledneZlucenie: z.konflikt ? this._stav.posledneZlucenie : v.zmenyZInych,
    })
    await this.ulozCache()
  }

  private async obnov(): Promise<void> {
    const z = this.zaznam()
    const etag = await this.vzdialene.etag(this.def.nazov)
    if (etag === null || etag === z.server.etag) return
    const ich = await this.vzdialene.nacitaj(this.def.nazov)
    // medzitým vznikla lokálna zmena – vyrieši ju ďalšie odoslanie
    if (!ich || z.lokalne !== null) return
    const data = this.def.parsuj(ich.obsah)
    z.server = { obsah: ich.obsah, etag: ich.etag }
    this._data = data
    this.nastav({})
    await this.ulozCache()
  }

  private ulozCache(): Promise<void> {
    return this.cache.uloz(structuredClone(this.zaznam()))
  }

  private nastav(zmena: Partial<StavSuboru>): void {
    this._stav = { ...this._stav, ...zmena }
    for (const cb of this.posluchaci) cb()
  }
}
