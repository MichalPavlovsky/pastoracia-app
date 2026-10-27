// „!“ na dlaždici Intencie: na budúci týždeň ešte nie je nahraný poriadok Humenné.

import { dnes } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { PORIADKY } from './data'
import { chybaBuduci } from './model/poriadky'

export function OdznakIntencii() {
  const { data, stav } = useSubor(PORIADKY)
  if (stav.stav === 'nacitava' || !chybaBuduci(data, dnes())) return null
  return (
    <span className="dlazdica-odznak" aria-label="Poriadok Humenné na budúci týždeň chýba" title="Poriadok chýba">
      !
    </span>
  )
}
