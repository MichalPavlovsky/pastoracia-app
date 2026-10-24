// Malý formulár „+ Pripomienka“ v detaile človeka.

import { useState, type FormEvent } from 'react'
import { dnes, pridajDni } from '../../lib/datum'
import { validujPripomienku, type PripomienkaForm } from './model/ludia'

export function FormularPripomienky({ onUloz }: { onUloz: (f: PripomienkaForm) => void }) {
  const [otvoreny, setOtvoreny] = useState(false)
  const [form, setForm] = useState<PripomienkaForm>({ datum: '', cas: '', dovod: '' })
  const [chyby, setChyby] = useState<string[]>([])

  const otvor = () => {
    setForm({ datum: pridajDni(dnes(), 1), cas: '', dovod: '' })
    setChyby([])
    setOtvoreny(true)
  }

  const uloz = (e: FormEvent) => {
    e.preventDefault()
    const c = validujPripomienku(form)
    setChyby(c)
    if (c.length > 0) return
    onUloz(form)
    setOtvoreny(false)
  }

  if (!otvoreny) {
    return (
      <button type="button" className="tlacidlo lu-pridat" onClick={otvor}>
        + Pripomienka
      </button>
    )
  }

  return (
    <form className="lu-pripomienka-form" onSubmit={uloz} noValidate>
      {chyby.length > 0 && (
        <p className="chyba" role="alert">
          {chyby.join(' ')}
        </p>
      )}
      <div className="lu-riadok-2">
        <label className="lu-popis">
          Dátum
          <input type="date" className="lu-vstup" value={form.datum} onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))} />
        </label>
        <label className="lu-popis">
          Čas (voliteľné)
          <input type="time" className="lu-vstup" value={form.cas} onChange={(e) => setForm((f) => ({ ...f, cas: e.target.value }))} />
        </label>
      </div>
      <div className="lu-riadok-2">
        <button type="button" className="tlacidlo" onClick={() => setForm((f) => ({ ...f, datum: pridajDni(dnes(), 7) }))}>
          o týždeň
        </button>
        <button type="button" className="tlacidlo" onClick={() => setForm((f) => ({ ...f, datum: pridajDni(dnes(), 30) }))}>
          o mesiac
        </button>
      </div>
      <label className="lu-pole lu-popis">
        Dôvod
        <input type="text" className="lu-vstup" value={form.dovod} onChange={(e) => setForm((f) => ({ ...f, dovod: e.target.value }))} />
      </label>
      <div className="lu-riadok-2">
        <button type="submit" className="tlacidlo tlacidlo-hlavne">
          Pridať
        </button>
        <button type="button" className="tlacidlo" onClick={() => setOtvoreny(false)}>
          Zrušiť
        </button>
      </div>
    </form>
  )
}
