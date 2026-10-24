// Jedna téma v týždni: ťahanie, stav, odkazy a akcie (upraviť, presunúť, zmazať).

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NAZVY_STAVOV, type Tema } from '../model/temy'
import { jeOdkaz, skratOdkaz } from './popis'
import { VyberTyzdna } from './VyberTyzdna'
import './temy.css'

interface Props {
  tema: Tema
  /** ponúkané pondelky pre presun (bez tohto týždňa) */
  ineTyzdne: string[]
  prvy: boolean
  posledny: boolean
  onStav: () => void
  onPosun: (smer: -1 | 1) => void
  onUprav: () => void
  onPresun: (naPondelok: string) => void
  onZmaz: () => void
}

type Rezim = 'presun' | 'zmaz' | null

export function PolozkaTemy({ tema, ineTyzdne, prvy, posledny, onStav, onPosun, onUprav, onPresun, onZmaz }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: tema.id,
  })
  const [rezim, setRezim] = useState<Rezim>(null)
  const [cielovy, setCielovy] = useState<string | null>(ineTyzdne[0] ?? null)

  const styl = { transform: CSS.Transform.toString(transform), transition }
  const popisStavu = NAZVY_STAVOV[tema.stav]

  return (
    <li
      ref={setNodeRef}
      style={styl}
      className={`tm-tema${tema.stav === 'pouzite' ? ' tm-pouzita' : ''}${isDragging ? ' tm-taha' : ''}`}
    >
      <div className="tm-lista">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="tm-ikona tm-uchyt"
          aria-label="Presunúť poradie ťahaním"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <button type="button" className="tm-ikona" aria-label="Posunúť vyššie" disabled={prvy} onClick={() => onPosun(-1)}>
          ▲
        </button>
        <button
          type="button"
          className="tm-ikona"
          aria-label="Posunúť nižšie"
          disabled={posledny}
          onClick={() => onPosun(1)}
        >
          ▼
        </button>
        <button
          type="button"
          className={`tm-stav tm-stav-${tema.stav}`}
          aria-label={`Stav: ${popisStavu} – ťuknutím zmeníš`}
          onClick={onStav}
        >
          {popisStavu}
        </button>
      </div>

      <p className="tm-nazov">{tema.nazov}</p>

      {tema.zdroje.length > 0 && (
        <ul className="tm-zdroje">
          {tema.zdroje.map((z, i) => (
            <li key={`${i}-${z}`}>
              {jeOdkaz(z) ? (
                <a href={z} target="_blank" rel="noreferrer" title={z}>
                  {skratOdkaz(z)}
                </a>
              ) : (
                <span>{z}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {tema.poznamka.trim() !== '' && <p className="tm-poznamka">{tema.poznamka}</p>}

      {rezim === null && (
        <div className="rad-tlacidiel">
          <button type="button" className="tlacidlo" onClick={onUprav}>
            Upraviť
          </button>
          <button type="button" className="tlacidlo" onClick={() => setRezim('presun')}>
            Presunúť
          </button>
          <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={() => setRezim('zmaz')}>
            Zmazať
          </button>
        </div>
      )}

      {rezim === 'presun' && (
        <div className="tm-panel">
          <VyberTyzdna pondelok={ineTyzdne[0] ?? ''} tyzdne={ineTyzdne} label="Presunúť na týždeň" onZmena={setCielovy} />
          <div className="rad-tlacidiel">
            <button
              type="button"
              className="tlacidlo tlacidlo-hlavne"
              disabled={cielovy === null}
              onClick={() => cielovy !== null && onPresun(cielovy)}
            >
              Presunúť
            </button>
            <button type="button" className="tlacidlo" onClick={() => setRezim(null)}>
              Zrušiť
            </button>
          </div>
        </div>
      )}

      {rezim === 'zmaz' && (
        <div className="tm-panel">
          <p className="tm-otazka">Naozaj zmazať túto tému?</p>
          <div className="rad-tlacidiel">
            <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={onZmaz}>
              Áno, zmazať
            </button>
            <button type="button" className="tlacidlo" onClick={() => setRezim(null)}>
              Nie
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
