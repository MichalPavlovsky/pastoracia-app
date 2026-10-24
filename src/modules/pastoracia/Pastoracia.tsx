// Modul „Pastorácia“: myšlienky a nápady so štítkami a zdrojmi.
// #/pastoracia/pridat?url=… prijme odkaz zdieľaný z telefónu (Android, Skratka na iPhone).

import { useState } from 'react'
import { prejdi } from '../../app/smerovanie'
import { dnes } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { StavSynchronizacie } from '../../ui/StavSynchronizacie'
import { MYSLIENKY } from './data'
import { FormularMyslienky } from './FormularMyslienky'
import {
  filtruj,
  myslienkaNaFormular,
  myslienkaZoZdielania,
  NAZVY_STAVOV,
  pridajMyslienku,
  prepniStav,
  STAVY_MYSLIENKY,
  upravMyslienku,
  vsetkyStitky,
  zmazMyslienku,
  type MyslienkaForm,
  type MyslienkySubor,
  type StavMyslienky,
} from './model/myslienky'
import { PolozkaMyslienky } from './PolozkaMyslienky'
import './pastoracia.css'

const CESTA = '/pastoracia'
const RADA_VLOZENIA = 'Vlož odkaz sem (podrž prst → Vložiť).'

interface Otvoreny {
  /** mení sa pri každom otvorení, aby sa formulár načítal odznova */
  kluc: number
  id: string | null
  pociatok: MyslienkaForm
  napoveda?: string
  zaostriZdroje?: boolean
}

export function Pastoracia({ podcesta, parametre }: { podcesta: string; parametre: URLSearchParams }) {
  const { data, stav, subor } = useSubor(MYSLIENKY)
  const [formular, setFormular] = useState<Otvoreny | null>(null)
  const [predPodcesta, setPredPodcesta] = useState<string | null>(null)
  const [hladat, setHladat] = useState('')
  const [stitok, setStitok] = useState('')
  const [stavFilter, setStavFilter] = useState<StavMyslienky | ''>('')

  const otvor = (z: Omit<Otvoreny, 'kluc'>) => setFormular((f) => ({ ...z, kluc: (f?.kluc ?? 0) + 1 }))

  // Odkaz zdieľaný z telefónu otvorí predvyplnený formulár
  if (podcesta !== predPodcesta) {
    setPredPodcesta(podcesta)
    if (podcesta === '/pridat') {
      otvor({
        id: null,
        pociatok: myslienkaZoZdielania({
          title: parametre.get('title') ?? undefined,
          text: parametre.get('text') ?? undefined,
          url: parametre.get('url') ?? undefined,
        }),
      })
    }
  }

  // vždy z aktuálnych dát súboru, nie z posledného vykreslenia
  const uloz = (zmena: (d: MyslienkySubor) => MyslienkySubor) => {
    void subor.uloz(zmena(subor.data))
  }

  const zavri = () => {
    setFormular(null)
    if (podcesta === '/pridat') prejdi(CESTA)
  }

  const vlozOdkaz = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const f = myslienkaZoZdielania({ text })
      if (f.zdroje !== '') {
        otvor({ id: null, pociatok: f })
        return
      }
    } catch {
      // schránka nie je dostupná – ukážeme prázdne pole
    }
    otvor({ id: null, pociatok: myslienkaNaFormular(), napoveda: RADA_VLOZENIA, zaostriZdroje: true })
  }

  const ulozFormular = (f: MyslienkaForm) => {
    if (!formular) return
    const id = formular.id
    if (id === null) uloz((d) => pridajMyslienku(d, f, dnes()).data)
    else uloz((d) => upravMyslienku(d, id, f))
    zavri()
  }

  const stitky = vsetkyStitky(data)
  const filter = { hladat, stitok, stav: stavFilter }
  const zoznam = filtruj(data, filter)
  const filterAktivny = hladat.trim() !== '' || stitok !== '' || stavFilter !== ''

  const prepniStitok = (s: string) =>
    setStitok((a) => (a.toLocaleLowerCase('sk') === s.toLocaleLowerCase('sk') ? '' : s))

  return (
    <section className="obrazovka">
      <StavSynchronizacie stav={stav} subor={subor} />

      <div className="rad-tlacidiel pa-horna">
        <button type="button" className="tlacidlo tlacidlo-hlavne" onClick={() => otvor({ id: null, pociatok: myslienkaNaFormular() })}>
          + Nová myšlienka
        </button>
        <button type="button" className="tlacidlo" onClick={() => void vlozOdkaz()}>
          Vložiť odkaz
        </button>
      </div>

      {formular && (
        <FormularMyslienky
          key={formular.kluc}
          nadpis={formular.id === null ? 'Nová myšlienka' : 'Úprava myšlienky'}
          pociatok={formular.pociatok}
          napoveda={formular.napoveda}
          zaostriZdroje={formular.zaostriZdroje}
          onUloz={ulozFormular}
          onZrus={zavri}
        />
      )}

      <input
        type="search"
        className="pa-vstup pa-hladat"
        placeholder="Hľadať…"
        aria-label="Hľadať v myšlienkach"
        value={hladat}
        onChange={(e) => setHladat(e.target.value)}
      />

      <div className="prepinac pa-prepinac pa-filter-stavu" role="group" aria-label="Filter podľa stavu">
        <button type="button" className="prepinac-tlacidlo" aria-pressed={stavFilter === ''} onClick={() => setStavFilter('')}>
          Všetky
        </button>
        {STAVY_MYSLIENKY.map((s) => (
          <button
            key={s}
            type="button"
            className="prepinac-tlacidlo"
            aria-pressed={stavFilter === s}
            onClick={() => setStavFilter(s)}
          >
            {NAZVY_STAVOV[s]}
          </button>
        ))}
      </div>

      {stitky.length > 0 && (
        <div className="pa-stitky pa-filter-stitkov" role="group" aria-label="Filter podľa štítku">
          {stitky.map((s) => (
            <button
              key={s}
              type="button"
              className="pa-stitok pa-stitok-velky"
              aria-pressed={s.toLocaleLowerCase('sk') === stitok.toLocaleLowerCase('sk')}
              onClick={() => prepniStitok(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {zoznam.length === 0 ? (
        <p className="pa-prazdny">{filterAktivny ? 'Nič sa nenašlo.' : 'Zatiaľ žiadne myšlienky.'}</p>
      ) : (
        <ul className="pa-zoznam">
          {zoznam.map((m) => (
            <PolozkaMyslienky
              key={m.id}
              myslienka={m}
              aktivnyStitok={stitok}
              onStav={() => uloz((d) => prepniStav(d, m.id))}
              onStitok={prepniStitok}
              onUprav={() => otvor({ id: m.id, pociatok: myslienkaNaFormular(m) })}
              onZmaz={() => uloz((d) => zmazMyslienku(d, m.id))}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
