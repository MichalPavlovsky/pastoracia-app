// Prenos pripomienok do Outlooku po každej zmene a riadok so stavom.

import { useEffect, useSyncExternalStore } from 'react'
import { useAplikacia } from '../../app/kontext'
import type { StavKalendara } from '../../calendar/synchronizacia'
import { pozadovaneUdalosti } from './model/kalendar'
import type { LudiaSubor } from './model/ludia'

const ODKLAD_MS = 1500

// farba bodky ako pri stave OneDrive (zaklad.css)
const BODKA: Record<StavKalendara['stav'], string> = {
  vypnuty: '',
  prenasa: 'odosiela',
  ok: 'synchronizovane',
  offline: 'offline',
  pripojit: 'chyba',
  chyba: 'chyba',
}

export function useStavKalendara(): StavKalendara {
  const { kalendar } = useAplikacia()
  return useSyncExternalStore((cb) => kalendar.odober(cb), () => kalendar.stav)
}

export function KalendarLudi({ data, nacitane, dnesny }: { data: LudiaSubor; nacitane: boolean; dnesny: string }) {
  const { kalendar, prihlasenie } = useAplikacia()
  const stav = useStavKalendara()
  const zapnuty = stav.stav !== 'vypnuty'

  useEffect(() => {
    if (!nacitane || !zapnuty) return
    const t = setTimeout(() => void kalendar.prenes(pozadovaneUdalosti(data, dnesny), dnesny), ODKLAD_MS)
    return () => clearTimeout(t)
  }, [data, nacitane, zapnuty, dnesny, kalendar])

  if (!zapnuty) return null
  return (
    <div className="stav-sync" data-stav={BODKA[stav.stav]}>
      <p>
        <span className="stav-bodka" aria-hidden /> Kalendár Outlook: {popis(stav)}
      </p>
      {stav.stav === 'pripojit' && (
        <button type="button" className="tlacidlo" onClick={() => void prihlasenie.pripojKalendar()}>
          Pripojiť znova
        </button>
      )}
      {stav.stav === 'chyba' && (
        <button type="button" className="tlacidlo" onClick={() => void kalendar.prenes(pozadovaneUdalosti(data, dnesny), dnesny)}>
          Skúsiť znova
        </button>
      )}
    </div>
  )
}

function popis(s: StavKalendara): string {
  switch (s.stav) {
    case 'vypnuty':
      return 'vypnutý'
    case 'prenasa':
      return 'zapisujem…'
    case 'ok':
      return 'aktuálny'
    case 'offline':
      return 'zapíše sa po pripojení'
    case 'pripojit':
    case 'chyba':
      return s.sprava
  }
}
