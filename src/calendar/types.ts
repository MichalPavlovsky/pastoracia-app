// Poskytovateľ kalendára pre modul Ľudia. Udalosti nesú skrytú značku s id pripomienky,
// takže stav sa nikam neukladá – vždy sa porovná zoznam udalostí s pripomienkami.

export interface UdalostKalendara {
  /** id pripomienky z ludia.json */
  idPripomienky: string
  nazov: string
  text: string
  /** RRRR-MM-DD */
  datum: string
  /** HH:MM alebo "" pre celodennú udalosť */
  cas: string
}

export interface UlozenaUdalost {
  /** id udalosti u poskytovateľa */
  id: string
  idPripomienky: string
  /** podpisUdalosti() v čase zápisu – telo udalosti si Outlook upravuje, preto neporovnávame jeho */
  podpis: string
}

export function podpisUdalosti(u: UdalostKalendara): string {
  return JSON.stringify([u.nazov, u.text, u.datum, u.cas])
}

export interface PoskytovatelKalendara {
  /** naše udalosti, ktoré začínajú `odDatumu` alebo neskôr */
  nacitaj(odDatumu: string): Promise<UlozenaUdalost[]>
  vytvor(u: UdalostKalendara): Promise<void>
  uprav(id: string, u: UdalostKalendara): Promise<void>
  zmaz(id: string): Promise<void>
}
