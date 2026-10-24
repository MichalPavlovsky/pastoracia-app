// Súbor modulu Farský list (témy) pre spoločnú dátovú službu (src/storage).

import type { DefiniciaSuboru } from '../../storage/types'
import { parsujPlan, prazdnyPlan, serializujPlan, SUBOR_PLAN, type PlanSubor } from './model/temy'
import { zlucPlan } from './model/zlucenie'

export const PLAN: DefiniciaSuboru<PlanSubor> = {
  nazov: SUBOR_PLAN,
  prazdny: prazdnyPlan,
  parsuj: parsujPlan,
  serializuj: serializujPlan,
  zluc: zlucPlan,
}
