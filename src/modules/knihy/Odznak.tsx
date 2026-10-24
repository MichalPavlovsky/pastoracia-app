// Bodka na dlaždici Knihy: dnešný úryvok ešte nie je prečítaný.

import { dnes } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { KNIHY, KNIHY_STAV } from './data'
import { dnesnyUryvok } from './model/knihy'

export function OdznakKnih() {
  const knihy = useSubor(KNIHY).data
  const stav = useSubor(KNIHY_STAV).data
  const u = dnesnyUryvok(knihy, stav, dnes())
  if (!u || u.precitanyDnes) return null
  return (
    <span className="dlazdica-odznak" aria-label="Dnešný úryvok neprečítaný">
      1
    </span>
  )
}
