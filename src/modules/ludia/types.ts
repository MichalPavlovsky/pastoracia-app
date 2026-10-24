// Modul Ľudia – komu sa ozvať. Zatiaľ len návrh typov, súbor sa nevytvára.
// Pripomienky v kalendári pôjdu cez PoskytovatelKalendara (src/calendar/types.ts).

export interface Clovek {
  id: string
  meno: string
  kontakt: string
  poznamka: string
  /** RRRR-MM-DD alebo "" */
  poslednyKontakt: string
  pripomienky: Pripomienka[]
}

export interface Pripomienka {
  id: string
  /** RRRR-MM-DD */
  datum: string
  /** HH:MM alebo "" */
  cas: string
  dovod: string
  hotovo: boolean
  /** id udalosti u poskytovateľa kalendára, alebo "" */
  idKalendara: string
}

export interface LudiaSubor {
  verzia: 1
  ludia: Clovek[]
}
