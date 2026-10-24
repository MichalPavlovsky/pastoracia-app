import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AplikaciaKontext, type Aplikacia } from './app/kontext'
import { jeUkazka, ukazkovaAplikacia } from './app/ukazka'
import { Prihlasenie } from './auth/prihlasenie'
import { KalendarOutlook } from './calendar/outlook'
import { SynchronizaciaKalendara } from './calendar/synchronizacia'
import { chybaKonfiguracie, jePovolenaAdresa } from './config'
import { Shell } from './shell/Shell'
import { IndexedDbCache } from './storage/cache'
import { GraphOneDrive } from './storage/graph'
import { Uloziste } from './storage/store'

type Faza =
  | { typ: 'spusta' }
  | { typ: 'odhlaseny' }
  | { typ: 'nepovoleny'; email: string }
  | { typ: 'prihlaseny'; aplikacia: Aplikacia }
  | { typ: 'chyba'; sprava: string }

export default function App() {
  const prihlasenie = useMemo(() => new Prihlasenie(), [])
  const [faza, setFaza] = useState<Faza>(() => {
    const chyba = chybaKonfiguracie()
    return chyba ? { typ: 'chyba', sprava: chyba } : { typ: 'spusta' }
  })

  useEffect(() => {
    if (faza.typ !== 'spusta') return
    if (import.meta.env.DEV && jeUkazka()) return setFaza({ typ: 'prihlaseny', aplikacia: ukazkovaAplikacia(prihlasenie) })
    prihlasenie.spusti().then(
      () => {
        const ucet = prihlasenie.ucet()
        if (!ucet) return setFaza({ typ: 'odhlaseny' })
        if (!jePovolenaAdresa(ucet.email)) return setFaza({ typ: 'nepovoleny', email: ucet.email })
        const onedrive = new GraphOneDrive(prihlasenie.ziskajToken)
        const uloziste = new Uloziste(onedrive, new IndexedDbCache())
        uloziste.sledujPripojenie()
        const kalendar = new SynchronizaciaKalendara(new KalendarOutlook(prihlasenie.ziskajTokenKalendara))
        setFaza({ typ: 'prihlaseny', aplikacia: { prihlasenie, ucet, onedrive, uloziste, kalendar } })
      },
      (e: Error) => setFaza({ typ: 'chyba', sprava: e.message }),
    )
  }, [faza.typ, prihlasenie])

  switch (faza.typ) {
    case 'spusta':
      return <Uvod>Načítavam…</Uvod>
    case 'chyba':
      return (
        <Uvod>
          <p className="chyba">{faza.sprava}</p>
          <button className="tlacidlo" onClick={() => setFaza({ typ: 'spusta' })}>
            Skúsiť znova
          </button>
        </Uvod>
      )
    case 'odhlaseny':
      return (
        <Uvod>
          <button className="tlacidlo tlacidlo-hlavne tlacidlo-velke" onClick={() => void prihlasenie.prihlas()}>
            Prihlásiť sa cez Microsoft
          </button>
        </Uvod>
      )
    case 'nepovoleny':
      return (
        <Uvod>
          <p>
            Účet <strong>{faza.email}</strong> nemá prístup do tejto aplikácie.
          </p>
          <button className="tlacidlo" onClick={() => void prihlasenie.odhlas()}>
            Odhlásiť sa
          </button>
        </Uvod>
      )
    case 'prihlaseny':
      return (
        <AplikaciaKontext.Provider value={faza.aplikacia}>
          <Shell />
        </AplikaciaKontext.Provider>
      )
  }
}

function Uvod({ children }: { children: ReactNode }) {
  return (
    <main className="uvod">
      <h1>Pastorácia</h1>
      {children}
    </main>
  )
}
