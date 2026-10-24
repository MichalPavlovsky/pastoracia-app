// Formulár človeka (nový aj úprava).

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { dnes } from '../../lib/datum'
import { INTERVALY, validujCloveka, type ClovekForm } from './model/ludia'

interface Props {
  nadpis: string
  pociatok: ClovekForm
  onUloz: (f: ClovekForm) => void
  onZrus: () => void
}

export function FormularCloveka({ nadpis, pociatok, onUloz, onZrus }: Props) {
  const [form, setForm] = useState<ClovekForm>(pociatok)
  const [chyby, setChyby] = useState<string[]>([])
  const koren = useRef<HTMLFormElement>(null)

  useEffect(() => {
    koren.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [])

  const uloz = (e: FormEvent) => {
    e.preventDefault()
    const c = validujCloveka(form)
    setChyby(c)
    if (c.length === 0) onUloz(form)
  }

  return (
    <form ref={koren} className="lu-formular" onSubmit={uloz} noValidate>
      <h2 className="lu-formular-nadpis">{nadpis}</h2>

      {chyby.length > 0 && (
        <div className="oznam" role="alert">
          <ul>
            {chyby.map((c) => (
              <li key={c} className="chyba">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="lu-pole lu-popis">
        Meno
        <input type="text" className="lu-vstup" value={form.meno} onChange={(e) => setForm((f) => ({ ...f, meno: e.target.value }))} />
      </label>

      <label className="lu-pole lu-popis">
        Kontakt
        <input
          type="text"
          className="lu-vstup"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={form.kontakt}
          onChange={(e) => setForm((f) => ({ ...f, kontakt: e.target.value }))}
        />
        <span className="lu-pomoc">telefón alebo e-mail</span>
      </label>

      <label className="lu-pole lu-popis">
        Poznámka
        <textarea className="lu-vstup" rows={3} value={form.poznamka} onChange={(e) => setForm((f) => ({ ...f, poznamka: e.target.value }))} />
      </label>

      <div className="lu-pole">
        <label className="lu-popis">
          Posledný kontakt
          <input
            type="date"
            className="lu-vstup"
            value={form.poslednyKontakt}
            onChange={(e) => setForm((f) => ({ ...f, poslednyKontakt: e.target.value }))}
          />
        </label>
        <div className="lu-riadok-2">
          <button type="button" className="tlacidlo" onClick={() => setForm((f) => ({ ...f, poslednyKontakt: dnes() }))}>
            Dnes
          </button>
          <button type="button" className="tlacidlo" onClick={() => setForm((f) => ({ ...f, poslednyKontakt: '' }))}>
            Vymazať
          </button>
        </div>
      </div>

      <label className="lu-pole lu-popis">
        Ozvať sa
        <select
          className="lu-vstup"
          value={form.ozvatSaKazdych}
          onChange={(e) => setForm((f) => ({ ...f, ozvatSaKazdych: Number(e.target.value) }))}
        >
          {INTERVALY.map((i) => (
            <option key={i.dni} value={i.dni}>
              {i.nazov}
            </option>
          ))}
        </select>
      </label>

      <div className="rad-tlacidiel">
        <button type="submit" className="tlacidlo tlacidlo-hlavne">
          Uložiť
        </button>
        <button type="button" className="tlacidlo" onClick={onZrus}>
          Zrušiť
        </button>
      </div>
    </form>
  )
}
