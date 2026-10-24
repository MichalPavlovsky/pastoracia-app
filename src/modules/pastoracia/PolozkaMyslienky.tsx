// Jedna myšlienka v zozname: stav, text, štítky, zdroje a akcie (upraviť, kopírovať, zmazať).

import { useEffect, useState } from 'react'
import { formatDatum } from '../../lib/datum'
import { jeOdkaz, skratOdkaz } from '../farsky-list/temy/popis'
import { NAZVY_STAVOV, type Myslienka } from './model/myslienky'
import './pastoracia.css'

interface Props {
  myslienka: Myslienka
  aktivnyStitok: string
  onStav: () => void
  onStitok: (stitok: string) => void
  onUprav: () => void
  onZmaz: () => void
}

const DLHY_TEXT = 200

export function PolozkaMyslienky({ myslienka: m, aktivnyStitok, onStav, onStitok, onUprav, onZmaz }: Props) {
  const [rozbalene, setRozbalene] = useState(false)
  const [maze, setMaze] = useState(false)
  const [skopirovane, setSkopirovane] = useState(false)
  const popisStavu = NAZVY_STAVOV[m.stav]
  const dlhy = m.text.length > DLHY_TEXT || m.text.split('\n').length > 4

  useEffect(() => {
    if (!skopirovane) return
    const t = setTimeout(() => setSkopirovane(false), 2000)
    return () => clearTimeout(t)
  }, [skopirovane])

  const kopiruj = async () => {
    const casti = [m.nazov, '', m.text, ...(m.zdroje.length > 0 ? ['', ...m.zdroje] : [])]
    try {
      await navigator.clipboard.writeText(casti.join('\n').trim())
      setSkopirovane(true)
    } catch {
      // schránka nie je dostupná
    }
  }

  return (
    <li className={`pa-polozka${m.stav === 'hotove' ? ' pa-hotova' : ''}`}>
      <div className="pa-hlavicka">
        <p className="pa-nazov">{m.nazov || 'Bez názvu'}</p>
        <button
          type="button"
          className={`pa-stav pa-stav-${m.stav}`}
          aria-label={`Stav: ${popisStavu} – ťuknutím zmeníš`}
          onClick={onStav}
        >
          {popisStavu}
        </button>
      </div>

      <p className="pa-datum">{formatDatum(m.vytvorene)}</p>

      {m.text.trim() !== '' && (
        <>
          <p className={`pa-obsah${dlhy && !rozbalene ? ' pa-skratene' : ''}`}>{m.text}</p>
          {dlhy && (
            <button type="button" className="pa-rozbal" aria-expanded={rozbalene} onClick={() => setRozbalene((r) => !r)}>
              {rozbalene ? 'Menej' : 'Celé'}
            </button>
          )}
        </>
      )}

      {m.stitky.length > 0 && (
        <div className="pa-stitky">
          {m.stitky.map((s) => (
            <button
              key={s}
              type="button"
              className="pa-stitok"
              aria-pressed={s.toLocaleLowerCase('sk') === aktivnyStitok.toLocaleLowerCase('sk')}
              onClick={() => onStitok(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {m.zdroje.length > 0 && (
        <ul className="pa-zdroje">
          {m.zdroje.map((z, i) => (
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

      {!maze && (
        <div className="pa-akcie">
          <button type="button" className="tlacidlo" onClick={onUprav}>
            Upraviť
          </button>
          <button type="button" className="tlacidlo" onClick={() => void kopiruj()}>
            {skopirovane ? 'Skopírované ✓' : 'Kopírovať'}
          </button>
          <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={() => setMaze(true)}>
            Zmazať
          </button>
        </div>
      )}

      {maze && (
        <div className="pa-panel">
          <p className="pa-otazka">Naozaj zmazať?</p>
          <div className="rad-tlacidiel">
            <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={onZmaz}>
              Áno
            </button>
            <button type="button" className="tlacidlo" onClick={() => setMaze(false)}>
              Nie
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
