// Výber týždňa: zoznam zobrazených týždňov alebo „Iný týždeň…“ s dátumom (prevedie sa na pondelok).

import { useState } from 'react'
import { jeDatum, pondelokTyzdna } from '../../../lib/datum'
import { popisTyzdnaKratky } from './popis'
import './temy.css'

interface Props {
  /** vybraný pondelok */
  pondelok: string
  /** ponúkané pondelky */
  tyzdne: string[]
  label: string
  /** pondelok, alebo null, ak je zadaný dátum neplatný */
  onZmena: (pondelok: string | null) => void
}

const INY = '__iny'

export function VyberTyzdna({ pondelok, tyzdne, label, onZmena }: Props) {
  const [iny, setIny] = useState(!tyzdne.includes(pondelok))
  const [datum, setDatum] = useState(tyzdne.includes(pondelok) ? '' : pondelok)

  const zDatumu = (d: string) => (jeDatum(d) ? pondelokTyzdna(d) : null)

  return (
    <div className="tm-pole">
      <label className="tm-popis">
        {label}
        <select
          className="tm-vstup"
          value={iny ? INY : pondelok}
          onChange={(e) => {
            if (e.target.value === INY) {
              setIny(true)
              onZmena(zDatumu(datum))
            } else {
              setIny(false)
              onZmena(e.target.value)
            }
          }}
        >
          {tyzdne.map((t) => (
            <option key={t} value={t}>
              {popisTyzdnaKratky(t)}
            </option>
          ))}
          <option value={INY}>Iný týždeň…</option>
        </select>
      </label>
      {iny && (
        <label className="tm-popis">
          Dátum v danom týždni
          <input
            type="date"
            className="tm-vstup"
            value={datum}
            onChange={(e) => {
              setDatum(e.target.value)
              onZmena(zDatumu(e.target.value))
            }}
          />
        </label>
      )}
    </div>
  )
}
