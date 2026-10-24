// Formulár témy (nová aj úprava): názov, zdroje, poznámka, stav a týždeň.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { NAZVY_STAVOV, STAVY_TEMY, validujTemu, type TemaForm } from '../model/temy'
import { VyberTyzdna } from './VyberTyzdna'
import './temy.css'

interface Props {
  nadpis: string
  pociatok: TemaForm
  pondelok: string
  tyzdne: string[]
  /** krátka rada pod poľom Zdroje */
  napoveda?: string | undefined
  zaostriZdroje?: boolean
  onUloz: (f: TemaForm, pondelok: string) => void
  onZrus: () => void
}

export function FormularTemy({ nadpis, pociatok, pondelok, tyzdne, napoveda, zaostriZdroje, onUloz, onZrus }: Props) {
  const [form, setForm] = useState<TemaForm>(pociatok)
  const [tyzden, setTyzden] = useState<string | null>(pondelok)
  const [chyby, setChyby] = useState<string[]>([])
  const zdroje = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (zaostriZdroje) zdroje.current?.focus()
  }, [zaostriZdroje])

  const uloz = (e: FormEvent) => {
    e.preventDefault()
    const c = validujTemu(form)
    if (tyzden === null) c.push('Vyber platný týždeň.')
    setChyby(c)
    if (c.length === 0 && tyzden !== null) onUloz(form, tyzden)
  }

  return (
    <form className="tm-formular" onSubmit={uloz} noValidate>
      <h2 className="tm-formular-nadpis">{nadpis}</h2>

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

      <label className="tm-pole tm-popis">
        Názov
        <input
          type="text"
          className="tm-vstup"
          value={form.nazov}
          onChange={(e) => setForm((f) => ({ ...f, nazov: e.target.value }))}
        />
      </label>

      <label className="tm-pole tm-popis">
        Zdroje (jeden odkaz na riadok)
        <textarea
          ref={zdroje}
          className="tm-vstup"
          rows={3}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={form.zdroje}
          onChange={(e) => setForm((f) => ({ ...f, zdroje: e.target.value }))}
        />
        {napoveda && <span className="tm-pomoc">{napoveda}</span>}
      </label>

      <label className="tm-pole tm-popis">
        Poznámka
        <textarea
          className="tm-vstup"
          rows={3}
          value={form.poznamka}
          onChange={(e) => setForm((f) => ({ ...f, poznamka: e.target.value }))}
        />
      </label>

      <div className="tm-pole">
        <span className="tm-popis">Stav</span>
        <div className="prepinac" role="group" aria-label="Stav témy">
          {STAVY_TEMY.map((s) => (
            <button
              key={s}
              type="button"
              className="prepinac-tlacidlo"
              aria-pressed={form.stav === s}
              onClick={() => setForm((f) => ({ ...f, stav: s }))}
            >
              {NAZVY_STAVOV[s]}
            </button>
          ))}
        </div>
      </div>

      <VyberTyzdna pondelok={pondelok} tyzdne={tyzdne} label="Týždeň" onZmena={setTyzden} />

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
