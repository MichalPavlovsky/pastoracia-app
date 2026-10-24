// Modul Pastorácia – myšlienky a nápady. Zatiaľ len návrh typov, súbor sa nevytvára.

export type StavMyslienky = 'napad' | 'rozpracovane' | 'hotove'

export interface Myslienka {
  id: string
  nazov: string
  text: string
  stitky: string[]
  zdroje: string[]
  /** RRRR-MM-DD */
  vytvorene: string
  stav: StavMyslienky
}

export interface PastoraciaSubor {
  verzia: 1
  myslienky: Myslienka[]
}
