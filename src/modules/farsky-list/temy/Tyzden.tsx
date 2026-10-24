// Karta jedného týždňa: nadpis, témy (zoraditeľné ťahaním) a poznámka týždňa.

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  najdiTyzden,
  nastavPoznamkuTyzdna,
  prepniStav,
  presunTemu,
  zmazTemu,
  zoradTemy,
  type PlanSubor,
  type Tema,
  type Tyzden as TyzdenDat,
} from '../model/temy'
import { popisTyzdna } from './popis'
import { PolozkaTemy } from './PolozkaTemy'
import './temy.css'

/** id cieľovej plochy týždňa pri ťahaní (témy majú id „t-…“) */
export const PREDPONA_TYZDNA = 'tyzden:'

interface Props {
  tyzden: TyzdenDat
  /** „tento týždeň“ / „budúci týždeň“ */
  stitok: string
  /** sem sa práve ťahá téma z iného týždňa */
  ciel: boolean
  /** všetky zobrazené pondelky */
  tyzdne: string[]
  /** zmena plánu počítaná z aktuálnych dát v čase kliknutia */
  uloz: (zmena: (p: PlanSubor) => PlanSubor) => void
  onNovaTema: (pondelok: string) => void
  onUprav: (tema: Tema, pondelok: string) => void
}

export function Tyzden({ tyzden, stitok, ciel, tyzdne, uloz, onNovaTema, onUprav }: Props) {
  const { pondelok, temy, poznamka } = tyzden
  const [poznamkaOtvorena, setPoznamkaOtvorena] = useState(false)
  const ineTyzdne = tyzdne.filter((t) => t !== pondelok)
  const { setNodeRef } = useDroppable({ id: PREDPONA_TYZDNA + pondelok })

  const presunNa = (id: string, naIndex: (ids: string[], od: number) => number) =>
    uloz((p) => {
      const ids = najdiTyzden(p, pondelok).temy.map((t) => t.id)
      const od = ids.indexOf(id)
      const na = naIndex(ids, od)
      if (od < 0 || na < 0 || na >= ids.length || na === od) return p
      return zoradTemy(p, pondelok, arrayMove(ids, od, na))
    })

  const ulozPoznamku = (hodnota: string) => {
    if (hodnota !== poznamka) uloz((p) => nastavPoznamkuTyzdna(p, pondelok, hodnota))
  }

  return (
    <section
      ref={setNodeRef}
      className={`tm-tyzden${ciel ? ' tm-ciel' : ''}`}
      aria-label={`Týždeň ${popisTyzdna(pondelok)}`}
    >
      <h2 className="tm-tyzden-nadpis">
        {popisTyzdna(pondelok)}
        {stitok && <span className="tm-stitok">{stitok}</span>}
      </h2>

      {temy.length === 0 ? (
        <div className="tm-prazdny">
          <span>{ciel ? 'Pusť tému sem' : 'Zatiaľ bez tém'}</span>
        </div>
      ) : (
        <SortableContext items={temy.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="tm-temy">
            {temy.map((t, i) => (
              <PolozkaTemy
                key={t.id}
                tema={t}
                ineTyzdne={ineTyzdne}
                prvy={i === 0}
                posledny={i === temy.length - 1}
                onStav={() => uloz((p) => prepniStav(p, t.id))}
                onPosun={(smer) => presunNa(t.id, (_ids, od) => od + smer)}
                onUprav={() => onUprav(t, pondelok)}
                onPresun={(na) => uloz((p) => presunTemu(p, t.id, na))}
                onZmaz={() => uloz((p) => zmazTemu(p, t.id))}
              />
            ))}
          </ul>
        </SortableContext>
      )}
      <div className="rad-tlacidiel">
        <button type="button" className="tlacidlo" onClick={() => onNovaTema(pondelok)}>
          + Téma
        </button>
      </div>

      <div className="tm-poznamka-tyzdna">
        <button
          type="button"
          className="tm-rozbal"
          aria-expanded={poznamkaOtvorena}
          onClick={() => setPoznamkaOtvorena((v) => !v)}
        >
          {poznamkaOtvorena ? '▾' : '▸'} Poznámka týždňa
        </button>
        {poznamkaOtvorena ? (
          <textarea
            key={poznamka}
            className="tm-vstup"
            rows={3}
            aria-label="Poznámka týždňa"
            defaultValue={poznamka}
            onBlur={(e) => ulozPoznamku(e.target.value)}
          />
        ) : (
          poznamka.trim() !== '' && <p className="tm-poznamka">{poznamka}</p>
        )}
      </div>
    </section>
  )
}
