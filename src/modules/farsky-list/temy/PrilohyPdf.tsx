// Zoznam PDF príloh s nahrávaním na OneDrive (spoločné pre tému aj týždeň).

import { useRef, useState } from 'react'
import { useAplikacia } from '../../../app/kontext'
import type { Priloha } from '../model/temy'
import './temy.css'

interface Props {
  prilohy: Priloha[]
  /** priečinok na OneDrive = pondelok týždňa */
  priecinok: string
  onPridaj: (p: Priloha) => void
  onOdober: (p: Priloha) => void
}

export function PrilohyPdf({ prilohy, priecinok, onPridaj, onOdober }: Props) {
  const { onedrive } = useAplikacia()
  const vstup = useRef<HTMLInputElement>(null)
  const [nahrava, setNahrava] = useState<string | null>(null)
  const [chyba, setChyba] = useState('')

  const vybrane = async (subor: File | undefined) => {
    if (!subor) return
    setChyba('')
    setNahrava(subor.name)
    try {
      const p = await onedrive.nahrajPrilohu(priecinok, subor)
      onPridaj({ nazov: p.nazov, cesta: p.cesta, webUrl: p.webUrl })
    } catch (e) {
      setChyba(e instanceof Error ? e.message : 'Nahrávanie sa nepodarilo.')
    } finally {
      setNahrava(null)
      if (vstup.current) vstup.current.value = ''
    }
  }

  const odober = (p: Priloha) => {
    onOdober(p)
    void onedrive.zmazPrilohu(p.cesta).catch(() => {})
  }

  return (
    <div className="tm-prilohy">
      {prilohy.length > 0 && (
        <ul className="tm-prilohy-zoznam">
          {prilohy.map((p) => (
            <li key={p.cesta} className="tm-priloha">
              <a href={p.webUrl} target="_blank" rel="noopener" className="tm-priloha-nazov">
                📄 {p.nazov}
              </a>
              <button type="button" className="tm-ikona" aria-label={`Odobrať ${p.nazov}`} onClick={() => odober(p)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={vstup}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => void vybrane(e.target.files?.[0])}
      />
      <button
        type="button"
        className="tlacidlo"
        disabled={nahrava !== null}
        onClick={() => vstup.current?.click()}
      >
        {nahrava !== null ? `Nahrávam ${nahrava}…` : '+ PDF'}
      </button>
      {chyba && (
        <p className="chyba" role="alert">
          {chyba}
        </p>
      )}
      <span className="tm-pomoc">Text z PDF použije Claude pri písaní listu.</span>
    </div>
  )
}
