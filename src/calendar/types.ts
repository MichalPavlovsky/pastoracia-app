// Miesto pre „poskytovateľa kalendára“ (modul Ľudia). Zatiaľ bez implementácie.
// Neskôr: Outlook cez Microsoft Graph alebo Google Calendar.

export interface UdalostKalendara {
  id: string
  nazov: string
  /** RRRR-MM-DD */
  datum: string
  /** HH:MM alebo "" pre celodennú udalosť */
  cas: string
  poznamka: string
}

export interface PoskytovatelKalendara {
  readonly nazov: 'outlook' | 'google'
  pripojeny(): Promise<boolean>
  vytvorPripomienku(u: Omit<UdalostKalendara, 'id'>): Promise<UdalostKalendara>
  upravPripomienku(u: UdalostKalendara): Promise<void>
  zmazPripomienku(id: string): Promise<void>
}
