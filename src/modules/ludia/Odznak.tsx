// Číslo na dlaždici Ľudia: koľkým sa treba ozvať dnes (aj zmeškané).

import { dnes } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { LUDIA } from './data'
import { naRade } from './model/ludia'

export function OdznakLudi() {
  const { data } = useSubor(LUDIA)
  const pocet = new Set(naRade(data, dnes(), 0).map((r) => r.clovek.id)).size
  if (pocet === 0) return null
  return (
    <span className="dlazdica-odznak" aria-label={`Na rade dnes: ${pocet}`}>
      {pocet}
    </span>
  )
}
