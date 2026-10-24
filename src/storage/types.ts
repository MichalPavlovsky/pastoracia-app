// Spoločné typy dátovej služby. Každý modul opíše svoj súbor cez DefiniciaSuboru
// a storage sa postará o OneDrive, IndexedDB, offline a konflikty.

export interface VysledokZlucenia<T> {
  data: T
  /** čo sa prevzalo z iného zariadenia (bez konfliktu) */
  zmenyZInych: string[]
  /** rovnaká vec zmenená na oboch zariadeniach – treba potvrdiť */
  konflikty: string[]
}

export interface DefiniciaSuboru<T> {
  /** názov súboru v /Pastoracia-app/data/, napr. "sopkovce-intencie.json" */
  nazov: string
  prazdny(): T
  parsuj(obsah: string): T
  serializuj(data: T): string
  /** trojcestné zlúčenie: spoločný základ, moja verzia, verzia z OneDrive */
  zluc(zaklad: T, moje: T, ich: T): VysledokZlucenia<T>
}

export interface VzdialenySubor {
  obsah: string
  etag: string
}

/** OneDrive (alebo falošný OneDrive v testoch). */
export interface VzdialeneUloziste {
  /** `null`, ak súbor neexistuje */
  nacitaj(nazov: string): Promise<VzdialenySubor | null>
  /** len eTag bez sťahovania obsahu; `null`, ak súbor neexistuje */
  etag(nazov: string): Promise<string | null>
  /**
   * Zapíše súbor, len ak sa na serveri nezmenil (`etag`), alebo ešte neexistuje (`etag === null`).
   * Vráti nový eTag. Ak sa medzitým zmenil, vyhodí KonfliktZapisu.
   */
  zapis(nazov: string, obsah: string, etag: string | null): Promise<string>
}

export interface ZaznamSuboru {
  nazov: string
  /** posledná známa verzia z OneDrive – základ pre zlúčenie */
  server: { obsah: string; etag: string | null }
  /** neodoslaná zmena, alebo `null` */
  lokalne: string | null
  /** zlúčenie čakajúce na potvrdenie */
  konflikt: { zmenyZInych: string[]; konflikty: string[] } | null
}

export interface LokalnaCache {
  nacitaj(nazov: string): Promise<ZaznamSuboru | undefined>
  uloz(z: ZaznamSuboru): Promise<void>
  vymazVsetko(): Promise<void>
}

export type Stav =
  | 'nacitava'
  | 'synchronizovane'
  /** zmena je uložená v zariadení, čaká na pripojenie */
  | 'caka'
  /** bez pripojenia, nič nečaká na odoslanie */
  | 'offline'
  | 'odosiela'
  /** zlúčenie čaká na potvrdenie */
  | 'konflikt'
  | 'chyba'

export interface StavSuboru {
  stav: Stav
  chyba: string
  /** zmeny z iného zariadenia, ktoré sa zlúčili samé – na zobrazenie používateľovi */
  posledneZlucenie: string[]
  konflikt: ZaznamSuboru['konflikt']
}

export class KonfliktZapisu extends Error {
  constructor(nazov: string) {
    super(`${nazov} sa medzitým zmenil na inom zariadení`)
    this.name = 'KonfliktZapisu'
  }
}

/** Nie je pripojenie alebo server dočasne neodpovedá – skúsi sa znova neskôr. */
export class ChybaSiete extends Error {
  constructor(sprava = 'Nie je pripojenie k internetu') {
    super(sprava)
    this.name = 'ChybaSiete'
  }
}

export class ChybaPrihlasenia extends Error {
  constructor(sprava = 'Treba sa znova prihlásiť') {
    super(sprava)
    this.name = 'ChybaPrihlasenia'
  }
}
