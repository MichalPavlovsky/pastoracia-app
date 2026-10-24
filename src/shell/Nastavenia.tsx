import { useEffect, useState } from 'react'
import { useAplikacia } from '../app/kontext'
import { INTENCIE, PLAN } from '../modules/farsky-list/data'
import { nahradDen } from '../modules/farsky-list/model/intencie'
import type { InfoPriecinka } from '../storage/graph'
import { useSubor } from '../storage/useSubor'
import { StavSynchronizacie } from '../ui/StavSynchronizacie'

// Dátum mimo bežného používania – len na skúšku zápisu (krok 5)
const SKUSOBNY_DEN = '2099-01-01'

export function Nastavenia() {
  const { ucet, onedrive, uloziste, prihlasenie } = useAplikacia()
  const [info, setInfo] = useState<InfoPriecinka | null>(null)
  const [chybaInfo, setChybaInfo] = useState('')
  const intencie = useSubor(INTENCIE)
  const plan = useSubor(PLAN)

  useEffect(() => {
    onedrive.infoPriecinka().then(setInfo, (e: Error) => setChybaInfo(e.message))
  }, [onedrive])

  const skusobny = intencie.data.dni.some((d) => d.datum === SKUSOBNY_DEN)
  const prepniSkusku = () =>
    void intencie.subor.uloz(
      nahradDen(
        intencie.data,
        SKUSOBNY_DEN,
        skusobny ? null : { datum: SKUSOBNY_DEN, bohosluzby: [], spovede: [], oznam: 'Skúška pripojenia – môžeš zmazať' },
      ),
    )

  const odhlas = async () => {
    await uloziste.vymazLokalneData()
    await prihlasenie.odhlas()
  }

  return (
    <section className="obrazovka">
      <h1>Nastavenia</h1>

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

      <h2>Skúška pripojenia</h2>
      <p>
        Zapíše do intencií skúšobný oznam na {SKUSOBNY_DEN}. Po skúške ho tým istým tlačidlom zmaž.
      </p>
      <button className="tlacidlo" onClick={prepniSkusku}>
        {skusobny ? 'Zmazať skúšobný oznam' : 'Zapísať skúšobný oznam'}
      </button>

      <h2>Odhlásenie</h2>
      <p>Dáta v OneDrive ostanú. Zmaže sa len kópia v tomto zariadení.</p>
      <button className="tlacidlo tlacidlo-nebezpecne" onClick={() => void odhlas()}>
        Odhlásiť a vymazať dáta v zariadení
      </button>
    </section>
  )
}
