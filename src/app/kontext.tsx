// Spoločné služby pre celú aplikáciu po prihlásení.

import { createContext, useContext } from 'react'
import type { Prihlasenie, Ucet } from '../auth/prihlasenie'
import type { SynchronizaciaKalendara } from '../calendar/synchronizacia'
import type { GraphOneDrive } from '../storage/graph'
import type { Uloziste } from '../storage/store'

export interface Aplikacia {
  prihlasenie: Prihlasenie
  ucet: Ucet
  onedrive: GraphOneDrive
  uloziste: Uloziste
  kalendar: SynchronizaciaKalendara
}

export const AplikaciaKontext = createContext<Aplikacia | null>(null)

export function useAplikacia(): Aplikacia {
  const a = useContext(AplikaciaKontext)
  if (!a) throw new Error('useAplikacia mimo prihlásenej aplikácie')
  return a
}
