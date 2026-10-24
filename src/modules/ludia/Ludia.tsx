// Modul „Ľudia“: komu sa ozvať. Záložky „Na rade“ a „Všetci“, formulár človeka hore.

import { useState } from 'react'
import { dnes } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { StavSynchronizacie } from '../../ui/StavSynchronizacie'
import { LUDIA } from './data'
import { FormularCloveka } from './FormularCloveka'
import { KartaCloveka } from './KartaCloveka'
import { NaRadeZoznam } from './NaRadeZoznam'
import {
  clovekNaFormular,
  najdiCloveka,
  naRade,
  ozvalSom,
  pridajCloveka,
  upravCloveka,
  zmazCloveka,
  type ClovekForm,
  type LudiaSubor,
} from './model/ludia'
import './ludia.css'

type Zalozka = 'na-rade' | 'vsetci'

interface Otvoreny {
  /** mení sa pri každom otvorení, aby sa formulár načítal odznova */
  kluc: number
  id: string | null
}

const bezDiakritiky = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function Ludia(_props: { podcesta: string; parametre: URLSearchParams }) {
  const { data, stav, subor } = useSubor(LUDIA)
  const [zalozka, setZalozka] = useState<Zalozka>('na-rade')
  const [hladane, setHladane] = useState('')
  const [formular, setFormular] = useState<Otvoreny | null>(null)
  const [rozbaleny, setRozbaleny] = useState<string | null>(null)

  const dnesny = dnes()
  const rade = naRade(data, dnesny, 7)

  // vždy z aktuálnych dát súboru, nie z posledného vykreslenia
  const uloz = (zmena: (d: LudiaSubor) => LudiaSubor) => {
    void subor.uloz(zmena(subor.data))
  }

  const otvor = (id: string | null) => setFormular((f) => ({ id, kluc: (f?.kluc ?? 0) + 1 }))

  const ulozFormular = (f: ClovekForm) => {
    if (!formular) return
    if (formular.id === null) {
      const v = pridajCloveka(subor.data, f)
      void subor.uloz(v.data)
      setZalozka('vsetci')
      setRozbaleny(v.id)
    } else {
      const id = formular.id
      uloz((d) => upravCloveka(d, id, f))
    }
    setFormular(null)
  }

  const upravovany = formular?.id ? najdiCloveka(data, formular.id) : undefined
  const hladaneBez = bezDiakritiky(hladane.trim())
  const zobrazeni = data.ludia.filter((c) => bezDiakritiky(c.meno).includes(hladaneBez))

  return (
    <section className="obrazovka">
      <StavSynchronizacie stav={stav} subor={subor} />

      <div className="rad-tlacidiel lu-horna">
        <button type="button" className="tlacidlo tlacidlo-hlavne" onClick={() => otvor(null)}>
          + Človek
        </button>
      </div>

      {formular && (
        <FormularCloveka
          key={formular.kluc}
          nadpis={formular.id === null ? 'Nový človek' : 'Úprava'}
          pociatok={clovekNaFormular(upravovany)}
          onUloz={ulozFormular}
          onZrus={() => setFormular(null)}
        />
      )}

      <div className="prepinac lu-zalozky" role="group" aria-label="Zobrazenie">
        <button type="button" className="prepinac-tlacidlo" aria-pressed={zalozka === 'na-rade'} onClick={() => setZalozka('na-rade')}>
          Na rade{rade.length > 0 ? ` (${rade.length})` : ''}
        </button>
        <button type="button" className="prepinac-tlacidlo" aria-pressed={zalozka === 'vsetci'} onClick={() => setZalozka('vsetci')}>
          Všetci
        </button>
      </div>

      {zalozka === 'na-rade' ? (
        <NaRadeZoznam
          polozky={rade}
          dnesny={dnesny}
          onOzval={(id, idPripomienky) => uloz((d) => ozvalSom(d, id, dnesny, idPripomienky || undefined))}
        />
      ) : (
        <>
          <input
            type="search"
            className="lu-vstup lu-hladat"
            placeholder="Hľadať podľa mena"
            aria-label="Hľadať podľa mena"
            value={hladane}
            onChange={(e) => setHladane(e.target.value)}
          />
          {data.ludia.length === 0 && <p className="lu-prazdne">Zatiaľ nikto. Pridaj človeka tlačidlom „+ Človek“.</p>}
          {data.ludia.length > 0 && zobrazeni.length === 0 && <p className="lu-prazdne">Nikto také meno nemá.</p>}
          <ul className="lu-zoznam">
            {zobrazeni.map((c) => (
              <KartaCloveka
                key={c.id}
                clovek={c}
                dnesny={dnesny}
                otvorena={rozbaleny === c.id}
                onPrepni={() => setRozbaleny((r) => (r === c.id ? null : c.id))}
                onUprav={() => otvor(c.id)}
                onOzval={() => uloz((d) => ozvalSom(d, c.id, dnesny))}
                onZmaz={() => {
                  uloz((d) => zmazCloveka(d, c.id))
                  setRozbaleny(null)
                }}
                uloz={uloz}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
