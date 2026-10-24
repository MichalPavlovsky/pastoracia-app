// Prenos pripomienok do kalendára. Zapína sa v každom zariadení zvlášť (súhlas s kalendárom
// je viazaný na prihlásenie v zariadení). Beží vždy len jeden prenos naraz.

import { ChybaPrihlasenia, ChybaSiete } from '../storage/types'
import type { PoskytovatelKalendara, UdalostKalendara } from './types'
import { zosulad } from './zosulad'

const KLUC = 'pastoracia.kalendar'

export type StavKalendara =
  | { stav: 'vypnuty' }
  | { stav: 'prenasa' }
  | { stav: 'ok'; zmien: number }
  | { stav: 'offline' }
  /** chýba súhlas – treba „Pripojiť“ */
  | { stav: 'pripojit'; sprava: string }
  | { stav: 'chyba'; sprava: string }

export class SynchronizaciaKalendara {
  private stavTeraz: StavKalendara
  private odberatelia = new Set<() => void>()
  private beh: Promise<void> | null = null
  /** požiadavka, ktorá prišla počas behu – spracuje sa po ňom */
  private dalsia: { pozadovane: UdalostKalendara[]; dnesny: string } | null = null

  constructor(
    private poskytovatel: PoskytovatelKalendara,
    private uloziste: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = bezpecneUloziste(),
  ) {
    this.stavTeraz = this.zapnuty() ? { stav: 'ok', zmien: 0 } : { stav: 'vypnuty' }
  }

  get stav(): StavKalendara {
    return this.stavTeraz
  }

  odober(cb: () => void): () => void {
    this.odberatelia.add(cb)
    return () => this.odberatelia.delete(cb)
  }

  zapnuty(): boolean {
    try {
      return this.uloziste?.getItem(KLUC) === '1'
    } catch {
      return false
    }
  }

  /** Volá sa pred presmerovaním na súhlas, aby po návrate už bolo zapnuté. */
  zapni(): void {
    try {
      this.uloziste?.setItem(KLUC, '1')
    } catch {
      /* súkromné okno */
    }
    this.nastav({ stav: 'ok', zmien: 0 })
  }

  vypni(): void {
    try {
      this.uloziste?.removeItem(KLUC)
    } catch {
      /* súkromné okno */
    }
    this.dalsia = null
    this.nastav({ stav: 'vypnuty' })
  }

  /** Zosúladí kalendár s pripomienkami. Pri behu len poznačí, že treba ešte raz. */
  prenes(pozadovane: UdalostKalendara[], dnesny: string): Promise<void> {
    if (!this.zapnuty()) return Promise.resolve()
    this.dalsia = { pozadovane, dnesny }
    this.beh ??= this.bez().finally(() => {
      this.beh = null
    })
    return this.beh
  }

  private async bez(): Promise<void> {
    while (this.dalsia && this.zapnuty()) {
      const { pozadovane, dnesny } = this.dalsia
      this.dalsia = null
      this.nastav({ stav: 'prenasa' })
      try {
        const z = zosulad(pozadovane, await this.poskytovatel.nacitaj(dnesny))
        for (const u of z.vytvorit) await this.poskytovatel.vytvor(u)
        for (const { id, udalost } of z.upravit) await this.poskytovatel.uprav(id, udalost)
        for (const id of z.zmazat) await this.poskytovatel.zmaz(id)
        if (this.zapnuty()) this.nastav({ stav: 'ok', zmien: z.vytvorit.length + z.upravit.length + z.zmazat.length })
      } catch (e) {
        if (!this.zapnuty()) return
        if (e instanceof ChybaSiete) this.nastav({ stav: 'offline' })
        else if (e instanceof ChybaPrihlasenia) this.nastav({ stav: 'pripojit', sprava: e.message })
        else this.nastav({ stav: 'chyba', sprava: (e as Error).message })
        return
      }
    }
  }

  private nastav(s: StavKalendara): void {
    this.stavTeraz = s
    for (const cb of this.odberatelia) cb()
  }
}

function bezpecneUloziste(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
