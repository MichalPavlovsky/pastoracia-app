// Súbory modulu Knihy pre spoločnú dátovú službu (src/storage).

import type { DefiniciaSuboru } from '../../storage/types'
import {
  parsujKnihy,
  parsujStav,
  prazdneKnihy,
  prazdnyStav,
  serializujKnihy,
  serializujStav,
  SUBOR_KNIHY,
  SUBOR_KNIHY_STAV,
  zlucKnihy,
  zlucStav,
  type KnihyStav,
  type KnihySubor,
} from './model/knihy'

/** Len na čítanie – aplikácia ho nikdy neukladá. */
export const KNIHY: DefiniciaSuboru<KnihySubor> = {
  nazov: SUBOR_KNIHY,
  prazdny: prazdneKnihy,
  parsuj: parsujKnihy,
  serializuj: serializujKnihy,
  zluc: zlucKnihy,
}

export const KNIHY_STAV: DefiniciaSuboru<KnihyStav> = {
  nazov: SUBOR_KNIHY_STAV,
  prazdny: prazdnyStav,
  parsuj: parsujStav,
  serializuj: serializujStav,
  zluc: zlucStav,
}
