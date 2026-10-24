// Súbory modulu Farský list pre spoločnú dátovú službu (src/storage).

import type { DefiniciaSuboru } from '../../storage/types'
import { parsujIntencie, prazdnySubor, serializujIntencie, SUBOR_INTENCIE, type IntencieSubor } from './model/intencie'
import { parsujPlan, prazdnyPlan, serializujPlan, SUBOR_PLAN, type PlanSubor } from './model/temy'
import { zlucIntencie, zlucPlan } from './model/zlucenie'

export const INTENCIE: DefiniciaSuboru<IntencieSubor> = {
  nazov: SUBOR_INTENCIE,
  prazdny: prazdnySubor,
  parsuj: parsujIntencie,
  serializuj: serializujIntencie,
  zluc: zlucIntencie,
}

export const PLAN: DefiniciaSuboru<PlanSubor> = {
  nazov: SUBOR_PLAN,
  prazdny: prazdnyPlan,
  parsuj: parsujPlan,
  serializuj: serializujPlan,
  zluc: zlucPlan,
}
