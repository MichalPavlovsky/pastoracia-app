// Stav ukladania, oznam o zlúčení a potvrdenie konfliktu – spoločné pre všetky moduly.

import { useAplikacia } from '../app/kontext'
import type { DatovySubor } from '../storage/sync'
import type { Stav, StavSuboru } from '../storage/types'

const POPIS: Record<Stav, string> = {
  nacitava: 'Načítavam…',
  synchronizovane: 'Uložené v OneDrive',
  caka: 'Uložené v zariadení, odošle sa po pripojení',
  offline: 'Bez pripojenia – zobrazujem posledné dáta',
  odosiela: 'Odosielam…',
  konflikt: 'Treba potvrdiť zlúčenie',
  chyba: 'Chyba',
}

export function StavSynchronizacie<T>({ stav, subor }: { stav: StavSuboru; subor: DatovySubor<T> }) {
  const { prihlasenie } = useAplikacia()
  const prihlasZnova = stav.stav === 'chyba' && stav.chyba.includes('prihlásiť')

  return (
    <div className="stav-sync" data-stav={stav.stav}>
      <p>
        <span className="stav-bodka" aria-hidden /> {POPIS[stav.stav]}
        {stav.chyba && stav.stav !== 'offline' ? `: ${stav.chyba}` : ''}
      </p>
      {prihlasZnova && (
        <button className="tlacidlo" onClick={() => void prihlasenie.prihlas()}>
          Prihlásiť sa znova
        </button>
      )}

      {stav.posledneZlucenie.length > 0 && (
        <div className="oznam">
          <p>
            <strong>Zlúčené so zmenami z iného zariadenia:</strong>
          </p>
          <ul>
            {stav.posledneZlucenie.map((z) => (
              <li key={z}>{z}</li>
            ))}
          </ul>
          <button className="tlacidlo" onClick={() => subor.zabudniZlucenie()}>
            Rozumiem
          </button>
        </div>
      )}

      {stav.konflikt && (
        <div className="oznam oznam-varovanie">
          <p>
            <strong>Rovnaké miesto sa zmenilo aj na inom zariadení.</strong>
          </p>
          <ul>
            {stav.konflikt.konflikty.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          {stav.konflikt.zmenyZInych.length > 0 && (
            <>
              <p>Ďalšie zmeny z iného zariadenia (prevezmú sa):</p>
              <ul>
                {stav.konflikt.zmenyZInych.map((z) => (
                  <li key={z}>{z}</li>
                ))}
              </ul>
            </>
          )}
          <div className="rad-tlacidiel">
            <button className="tlacidlo tlacidlo-hlavne" onClick={() => void subor.potvrdZlucenie()}>
              Potvrdiť zlúčenie
            </button>
            <button className="tlacidlo" onClick={() => void subor.pouziVerziuZInych()}>
              Ponechať verziu z iného zariadenia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
