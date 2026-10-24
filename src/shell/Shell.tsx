import { useEffect, useSyncExternalStore } from 'react'
import { useAplikacia } from '../app/kontext'
import { prejdi, useCesta } from '../app/smerovanie'
import { MODULY } from '../moduly'
import { IkonaNastavenia, IkonaSpat } from '../ui/ikony'
import { POPIS_STAVU } from '../ui/StavSynchronizacie'
import { Domov } from './Domov'
import { Nastavenia } from './Nastavenia'

export function Shell() {
  const { cesta, parametre } = useCesta()
  const modul = MODULY.find((m) => cesta === m.cesta || cesta.startsWith(`${m.cesta}/`))
  const jeNastavenia = cesta === '/nastavenia'
  const jeDomov = !modul && !jeNastavenia
  const nazov = modul ? modul.nazov : jeNastavenia ? 'Nastavenia' : 'Pastorácia'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [cesta])

  return (
    <>
      <header className="lista">
        <div className="lista-obsah">
          {jeDomov ? (
            <span className="lista-miesto" aria-hidden />
          ) : (
            <button className="lista-tlacidlo" aria-label="Späť" onClick={() => prejdi('/')}>
              <IkonaSpat />
            </button>
          )}
          <p className="lista-nazov">{nazov}</p>
          <StavBodka />
          <button
            className="lista-tlacidlo"
            aria-label="Nastavenia"
            aria-current={jeNastavenia ? 'page' : undefined}
            onClick={() => prejdi('/nastavenia')}
          >
            <IkonaNastavenia />
          </button>
        </div>
      </header>
      <main className="aplikacia">
        {modul ? (
          <modul.Obrazovka podcesta={cesta.slice(modul.cesta.length)} parametre={parametre} />
        ) : jeNastavenia ? (
          <Nastavenia />
        ) : (
          <Domov />
        )}
      </main>
    </>
  )
}

function StavBodka() {
  const { uloziste } = useAplikacia()
  const stav = useSyncExternalStore(
    (cb) => uloziste.odoberStav(cb),
    () => uloziste.celkovyStav(),
  )
  return (
    <button
      className="lista-tlacidlo"
      data-stav={stav}
      aria-label={`Stav ukladania: ${POPIS_STAVU[stav]}`}
      title={POPIS_STAVU[stav]}
      onClick={() => prejdi('/nastavenia')}
    >
      <span className="stav-bodka" aria-hidden />
    </button>
  )
}
