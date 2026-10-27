// Poriadok Humenné: nahrávanie .doc/.docx bohoslužobného poriadku na OneDrive podľa týždňov.

import { useEffect, useRef, useState } from 'react'
import { useAplikacia } from '../../app/kontext'
import { pondelokTyzdna } from '../../lib/datum'
import { PRIECINOK } from '../../storage/graph'
import { useSubor } from '../../storage/useSubor'
import { StavSynchronizacie } from '../../ui/StavSynchronizacie'
import { PORIADKY } from './data'
import {
  casTeraz,
  cestaSuboru,
  odoberSubor,
  pondelokZNazvu,
  pridajSubor,
  suboryTyzdna,
  volnyNazov,
} from './model/poriadky'
import './poriadok.css'

/** „2026-11-02“ → „2. 11.“ alebo „2. 11. 2026“ */
function dm(datum: string, rok: boolean): string {
  const [r, m, d] = datum.split('-').map(Number)
  return `${d}. ${m}.${rok ? ` ${r}` : ''}`
}

/** „2026-10-30T18:20“ → „30. 10. 2026 18:20“ */
function nahrateText(nahrane: string): string {
  const [datum = '', cas = ''] = nahrane.split('T')
  return `${dm(datum, true)} ${cas}`
}

export function PoriadokHumenne({ pondelok, jeBuduci }: { pondelok: string; jeBuduci: boolean }) {
  const { onedrive } = useAplikacia()
  const { stav, subor } = useSubor(PORIADKY)
  const vstup = useRef<HTMLInputElement>(null)
  const [vybrany, setVybrany] = useState<File | null>(null)
  const [datum, setDatum] = useState('')
  const [nerozpoznane, setNerozpoznane] = useState(false)
  const [nahrava, setNahrava] = useState(false)
  const [chyba, setChyba] = useState('')
  const [oznam, setOznam] = useState('')
  const [maze, setMaze] = useState<string | null>(null)
  const [odkazy, setOdkazy] = useState<Record<string, string>>({})

  const subory = suboryTyzdna(subor.data, pondelok)
  const klucCiest = subory.map((s) => s.cesta).join('|')

  useEffect(() => {
    let zrusene = false
    for (const cesta of klucCiest ? klucCiest.split('|') : []) {
      onedrive
        .odkazVDatach(cesta)
        .then((url) => {
          if (!zrusene) setOdkazy((o) => ({ ...o, [cesta]: url }))
        })
        .catch(() => {})
    }
    return () => {
      zrusene = true
    }
  }, [klucCiest, onedrive])

  const vybrane = (f: File | undefined) => {
    if (!f) return
    const z = pondelokZNazvu(f.name)
    setVybrany(f)
    setDatum(z ?? pondelok)
    setNerozpoznane(z === null)
    setChyba('')
    setOznam('')
  }

  const zrus = () => {
    setVybrany(null)
    if (vstup.current) vstup.current.value = ''
  }

  const nahraj = async () => {
    if (!vybrany || !datum) return
    setNahrava(true)
    setChyba('')
    setOznam('')
    try {
      const p = pondelokTyzdna(datum)
      const obsadene = suboryTyzdna(subor.data, p).map((s) => s.nazov)
      const zaklad = vybrany.name.replace(/[\\/:*?"<>|#%]/g, '_')
      let nazov = volnyNazov(zaklad, obsadene)
      let hotovo = false
      for (let i = 0; i < 20 && !hotovo; i++) {
        hotovo = await onedrive.nahrajDoDat(cestaSuboru(p, nazov), vybrany)
        // na OneDrive už je (napr. nahraté z PC) – ďalšie voľné číslo
        if (!hotovo) {
          obsadene.push(nazov)
          nazov = volnyNazov(zaklad, obsadene)
        }
      }
      if (!hotovo) throw new Error('Súbor sa nepodarilo nahrať, skús ho premenovať.')
      await subor.uloz(pridajSubor(subor.data, p, { cesta: cestaSuboru(p, nazov), nazov, nahrane: casTeraz() }))
      if (p !== pondelok) setOznam(`Nahraté k týždňu od ${dm(p, false)}`)
      zrus()
    } catch (e) {
      setChyba(e instanceof Error ? e.message : 'Nahrávanie sa nepodarilo.')
    } finally {
      setNahrava(false)
    }
  }

  const zmaz = (cesta: string) => {
    if (maze !== cesta) {
      setMaze(cesta)
      return
    }
    setMaze(null)
    void subor.uloz(odoberSubor(subor.data, cesta))
    void onedrive.zmazPrilohu(`${PRIECINOK}/${cesta}`).catch(() => {})
  }

  return (
    <section className="ph">
      {(stav.stav === 'chyba' || stav.stav === 'konflikt') && <StavSynchronizacie stav={stav} subor={subor} />}
      <h3 className="ph-nadpis">Poriadok Humenné</h3>
      {jeBuduci && subory.length === 0 && <div className="oznam oznam-varovanie">Poriadok chýba</div>}
      {subory.length > 0 && (
        <ul className="ph-zoznam">
          {subory.map((s) => (
            <li key={s.cesta} className="ph-polozka">
              <div className="ph-text">
                {odkazy[s.cesta] ? (
                  <a href={odkazy[s.cesta]} target="_blank" rel="noopener" className="ph-nazov">
                    📄 {s.nazov}
                  </a>
                ) : (
                  <span className="ph-nazov">📄 {s.nazov}</span>
                )}
                <span className="ph-cas">Nahraté {nahrateText(s.nahrane)}</span>
              </div>
              <button
                type="button"
                className="ph-zmaz"
                aria-label={`Zmazať ${s.nazov}`}
                onClick={() => zmaz(s.cesta)}
                onBlur={() => setMaze((m) => (m === s.cesta ? null : m))}
              >
                {maze === s.cesta ? 'Zmazať?' : '✕'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {oznam && <div className="oznam">{oznam}</div>}
      <input
        ref={vstup}
        type="file"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(e) => vybrane(e.target.files?.[0])}
      />
      {vybrany ? (
        <div className="ph-panel">
          <div className="ph-subor">{vybrany.name}</div>
          <label htmlFor="ph-datum">Týždeň od</label>
          <input id="ph-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          {nerozpoznane && <p className="ph-pomoc">Z názvu sa nedal rozpoznať týždeň – vyber ho.</p>}
          <div className="ph-tlacidla">
            <button type="button" className="tlacidlo tlacidlo-hlavne" disabled={nahrava || !datum} onClick={() => void nahraj()}>
              {nahrava ? 'Nahrávam…' : 'Nahrať'}
            </button>
            <button type="button" className="tlacidlo" disabled={nahrava} onClick={zrus}>
              Zrušiť
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="tlacidlo" onClick={() => vstup.current?.click()}>
          Nahrať poriadok Humenné
        </button>
      )}
      {chyba && (
        <p className="chyba" role="alert">
          {chyba}
        </p>
      )}
      <p className="ph-pomoc">Obsah poriadku použije Claude pri Farskom liste.</p>
    </section>
  )
}
