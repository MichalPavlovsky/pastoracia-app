// Formulár myšlienky (nová aj úprava): názov, text, štítky, zdroje a stav.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { NAZVY_STAVOV, STAVY_MYSLIENKY, validujMyslienku, type MyslienkaForm } from './model/myslienky'
import './pastoracia.css'

interface Props {
  nadpis: string
  pociatok: MyslienkaForm
  /** krátka rada pod poľom Zdroje */
  napoveda?: string | undefined
  zaostriZdroje?: boolean | undefined
  onUloz: (f: MyslienkaForm) => void
  onZrus: () => void
}

export function FormularMyslienky({ nadpis, pociatok, napoveda, zaostriZdroje, onUloz, onZrus }: Props) {
  const [form, setForm] = useState<MyslienkaForm>(pociatok)
  const [chyby, setChyby] = useState<string[]>([])
  const koren = useRef<HTMLFormElement>(null)
  const zdroje = useRef<HTMLTextAreaElement>(null)
  const text = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    koren.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    if (zaostriZdroje) zdroje.current?.focus({ preventScroll: true })
  }, [zaostriZdroje])

  // textarea rastie podľa obsahu
  useEffect(() => {
    const t = text.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${t.scrollHeight + 2}px`
  }, [form.text])

  const uloz = (e: FormEvent) => {
    e.preventDefault()
    const c = validujMyslienku(form)
    setChyby(c)
    if (c.length === 0) onUloz(form)
  }

  return (
    <form ref={koren} className="pa-formular" onSubmit={uloz} noValidate>
      <h2 className="pa-formular-nadpis">{nadpis}</h2>

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

      <label className="pa-popis">
        Názov
        <input
          type="text"
          className="pa-vstup"
          value={form.nazov}
          onChange={(e) => setForm((f) => ({ ...f, nazov: e.target.value }))}
        />
      </label>

      <label className="pa-popis">
        Text
        <textarea
          ref={text}
          className="pa-vstup pa-text"
          rows={6}
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
        />
      </label>

      <label className="pa-popis">
        Štítky
        <input
          type="text"
          className="pa-vstup"
          value={form.stitky}
          onChange={(e) => setForm((f) => ({ ...f, stitky: e.target.value }))}
        />
        <span className="pa-pomoc">oddeľ čiarkou, napr. advent, rodiny</span>
      </label>

      <label className="pa-popis">
        Zdroje (jeden odkaz na riadok)
        <textarea
          ref={zdroje}
          className="pa-vstup"
          rows={3}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={form.zdroje}
          onChange={(e) => setForm((f) => ({ ...f, zdroje: e.target.value }))}
        />
        {napoveda && <span className="pa-pomoc">{napoveda}</span>}
      </label>

      <div className="pa-popis">
        <span>Stav</span>
        <div className="prepinac pa-prepinac" role="group" aria-label="Stav myšlienky">
          {STAVY_MYSLIENKY.map((s) => (
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
