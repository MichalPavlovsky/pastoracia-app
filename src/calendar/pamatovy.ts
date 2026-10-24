// Kalendár v pamäti – pre testy a ukážkový režim.

import { podpisUdalosti, type PoskytovatelKalendara, type UdalostKalendara, type UlozenaUdalost } from './types'

export class PamatovyKalendar implements PoskytovatelKalendara {
  udalosti = new Map<string, UdalostKalendara>()
  private dalsie = 1

  async nacitaj(odDatumu: string): Promise<UlozenaUdalost[]> {
    return [...this.udalosti]
      .filter(([, u]) => u.datum >= odDatumu)
      .map(([id, u]) => ({ id, idPripomienky: u.idPripomienky, podpis: podpisUdalosti(u) }))
  }

  async vytvor(u: UdalostKalendara): Promise<void> {
    this.udalosti.set(`u${this.dalsie++}`, u)
  }

  async uprav(id: string, u: UdalostKalendara): Promise<void> {
    this.udalosti.set(id, u)
  }

  async zmaz(id: string): Promise<void> {
    this.udalosti.delete(id)
  }
}
