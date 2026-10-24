// Karta jedného týždňa: nadpis, témy (zoraditeľné ťahaním) a poznámka týždňa.

import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
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

interface Props {
  tyzden: TyzdenDat
  /** „tento týždeň“ / „budúci týždeň“ */
  stitok: string
  /** všetky zobrazené pondelky */
  tyzdne: string[]
  /** zmena plánu počítaná z aktuálnych dát v čase kliknutia */
  uloz: (zmena: (p: PlanSubor) => PlanSubor) => void
  onNovaTema: (pondelok: string) => void
  onUprav: (tema: Tema, pondelok: string) => void
}

export function Tyzden({ tyzden, stitok, tyzdne, uloz, onNovaTema, onUprav }: Props) {
  const { pondelok, temy, poznamka } = tyzden
  const [poznamkaOtvorena, setPoznamkaOtvorena] = useState(false)
  const ineTyzdne = tyzdne.filter((t) => t !== pondelok)

  const senzory = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const presunNa = (id: string, naIndex: (ids: string[], od: number) => number) =>
    uloz((p) => {
      const ids = najdiTyzden(p, pondelok).temy.map((t) => t.id)
      const od = ids.indexOf(id)
      const na = naIndex(ids, od)
      if (od < 0 || na < 0 || na >= ids.length || na === od) return p
      return zoradTemy(p, pondelok, arrayMove(ids, od, na))
    })

  const poTahani = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const cielId = String(e.over.id)
    presunNa(String(e.active.id), (ids) => ids.indexOf(cielId))
  }

  const ulozPoznamku = (hodnota: string) => {
    if (hodnota !== poznamka) uloz((p) => nastavPoznamkuTyzdna(p, pondelok, hodnota))
  }

  return (
    <section className="tm-tyzden" aria-label={`Týždeň ${popisTyzdna(pondelok)}`}>
      <h2 className="tm-tyzden-nadpis">
        {popisTyzdna(pondelok)}
        {stitok && <span className="tm-stitok">{stitok}</span>}
      </h2>

      {temy.length === 0 ? (
        <div className="tm-prazdny">
          <span>Zatiaľ bez tém</span>
        </div>
      ) : (
        <DndContext sensors={senzory} collisionDetection={closestCenter} onDragEnd={poTahani}>
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
        </DndContext>
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
