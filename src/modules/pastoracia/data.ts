// Súbor modulu Pastorácia (myšlienky) pre spoločnú dátovú službu (src/storage).

import type { DefiniciaSuboru } from '../../storage/types'
import {
  parsujMyslienky,
  prazdneMyslienky,
  serializujMyslienky,
  SUBOR_MYSLIENKY,
  zlucMyslienky,
  type MyslienkySubor,
} from './model/myslienky'

export const MYSLIENKY: DefiniciaSuboru<MyslienkySubor> = {
  nazov: SUBOR_MYSLIENKY,
  prazdny: prazdneMyslienky,
  parsuj: parsujMyslienky,
  serializuj: serializujMyslienky,
  zluc: zlucMyslienky,
}
