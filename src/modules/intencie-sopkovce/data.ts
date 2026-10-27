// Súbor modulu Intencie Sopkovce pre spoločnú dátovú službu (src/storage).

import type { DefiniciaSuboru } from '../../storage/types'
import { parsujIntencie, prazdnySubor, serializujIntencie, SUBOR_INTENCIE, type IntencieSubor } from './model/intencie'
import { parsujPoriadky, prazdnePoriadky, serializujPoriadky, SUBOR_PORIADKY, zlucPoriadky, type PoriadkySubor } from './model/poriadky'
import { zlucIntencie } from './model/zlucenie'

export const INTENCIE: DefiniciaSuboru<IntencieSubor> = {
  nazov: SUBOR_INTENCIE,
  prazdny: prazdnySubor,
  parsuj: parsujIntencie,
  serializuj: serializujIntencie,
  zluc: zlucIntencie,
}

export const PORIADKY: DefiniciaSuboru<PoriadkySubor> = {
  nazov: SUBOR_PORIADKY,
  prazdny: prazdnePoriadky,
  parsuj: parsujPoriadky,
  serializuj: serializujPoriadky,
  zluc: zlucPoriadky,
}
