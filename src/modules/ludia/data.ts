// Súbor modulu Ľudia pre spoločnú dátovú službu (src/storage).

import type { DefiniciaSuboru } from '../../storage/types'
import { parsujLudi, prazdniLudia, serializujLudi, SUBOR_LUDIA, zlucLudi, type LudiaSubor } from './model/ludia'

export const LUDIA: DefiniciaSuboru<LudiaSubor> = {
  nazov: SUBOR_LUDIA,
  prazdny: prazdniLudia,
  parsuj: parsujLudi,
  serializuj: serializujLudi,
  zluc: zlucLudi,
}
