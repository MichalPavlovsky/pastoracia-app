// React hook: dáta a stav jedného súboru, prekreslí sa pri každej zmene.

import { useSyncExternalStore } from 'react'
import { useAplikacia } from '../app/kontext'
import type { DatovySubor } from './sync'
import type { DefiniciaSuboru, StavSuboru } from './types'

export function useSubor<T>(def: DefiniciaSuboru<T>): { data: T; stav: StavSuboru; subor: DatovySubor<T> } {
  const subor = useAplikacia().uloziste.subor(def)
  const odober = (cb: () => void) => subor.odober(cb)
  const data = useSyncExternalStore(odober, () => subor.data)
  const stav = useSyncExternalStore(odober, () => subor.stav)
  return { data, stav, subor }
}
