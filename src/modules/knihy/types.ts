// Modul Knihy – zamyslenie dňa z PDF a stránok. Zatiaľ len návrh typov, súbor sa nevytvára.

export interface Kniha {
  id: string
  nazov: string
  autor: string
  /** cesta k PDF v OneDrive alebo webová adresa */
  zdroj: string
  typ: 'pdf' | 'web'
}

export interface Zamyslenie {
  /** RRRR-MM-DD */
  datum: string
  idKnihy: string
  /** napr. "s. 42" */
  miesto: string
  text: string
  poznamka: string
}

export interface KnihySubor {
  verzia: 1
  knihy: Kniha[]
  zamyslenia: Zamyslenie[]
}
