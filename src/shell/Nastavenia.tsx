import { useEffect, useState } from 'react'
import { useAplikacia } from '../app/kontext'
import { INTENCIE } from '../modules/intencie-sopkovce/data'
import { PLAN } from '../modules/farsky-list/data'
import type { InfoPriecinka } from '../storage/graph'
import { useSubor } from '../storage/useSubor'
import { StavSynchronizacie } from '../ui/StavSynchronizacie'
import { nacitajTemu, pouziTemu, ulozTemu, type Tema } from '../ui/tema'

const TEMY: Array<{ id: Tema; nazov: string }> = [
  { id: 'auto', nazov: 'Automaticky' },
  { id: 'svetly', nazov: 'Svetlý' },
  { id: 'tmavy', nazov: 'Tmavý' },
]

export function Nastavenia() {
  const { ucet, onedrive, uloziste, prihlasenie } = useAplikacia()
  const [info, setInfo] = useState<InfoPriecinka | null>(null)
  const [chybaInfo, setChybaInfo] = useState('')
  const intencie = useSubor(INTENCIE)
  const plan = useSubor(PLAN)

  useEffect(() => {
    onedrive.infoPriecinka().then(setInfo, (e: Error) => setChybaInfo(e.message))
  }, [onedrive])

  const [tema, nastavTemu] = useState<Tema>(nacitajTemu)
  const zvolTemu = (t: Tema) => {
    ulozTemu(t)
    pouziTemu(t)
    nastavTemu(t)
  }

  const odhlas = async () => {
    await uloziste.vymazLokalneData()
    await prihlasenie.odhlas()
  }

  return (
    <section className="obrazovka">
      <h2 className="prva">Vzhľad</h2>
      <div className="prepinac" role="group" aria-label="Vzhľad">
        {TEMY.map((t) => (
          <button key={t.id} className="prepinac-tlacidlo" aria-pressed={tema === t.id} onClick={() => zvolTemu(t.id)}>
            {t.nazov}
          </button>
        ))}
      </div>

      <h2>Účet</h2>
      <dl className="udaje">
        <dt>Meno</dt>
        <dd>{ucet.meno}</dd>
        <dt>E-mail</dt>
        <dd>{ucet.email}</dd>
        <dt>Typ účtu</dt>
        <dd>{ucet.typ === 'pracovny' ? 'pracovný (organizácia)' : 'osobný Microsoft účet'}</dd>
      </dl>

      <h2>Dáta v OneDrive</h2>
      <dl className="udaje">
        <dt>Priečinok</dt>
        <dd>{info?.cesta ?? '/Pastoracia-app/data'}</dd>
        <dt>OneDrive</dt>
        <dd>
          {info
            ? `${info.majitel} (${info.typDisku === 'business' ? 'pracovný' : 'osobný'})`
            : chybaInfo || 'Načítavam…'}
        </dd>
        {info?.webUrl && (
          <>
            <dt>Na webe</dt>
            <dd>
              <a href={info.webUrl} target="_blank" rel="noreferrer">
                Otvoriť priečinok v OneDrive
              </a>
            </dd>
          </>
        )}
      </dl>

      <h3>{INTENCIE.nazov}</h3>
      <StavSynchronizacie stav={intencie.stav} subor={intencie.subor} />
      <h3>{PLAN.nazov}</h3>
      <StavSynchronizacie stav={plan.stav} subor={plan.subor} />
      <div className="rad-tlacidiel">
        <button className="tlacidlo" onClick={() => void uloziste.synchronizujVsetko()}>
          Synchronizovať teraz
        </button>
      </div>

      <h2>Odhlásenie</h2>
      <p>Dáta v OneDrive ostanú. Zmaže sa len kópia v tomto zariadení.</p>
      <button className="tlacidlo tlacidlo-nebezpecne" onClick={() => void odhlas()}>
        Odhlásiť a vymazať dáta v zariadení
      </button>
    </section>
  )
}
