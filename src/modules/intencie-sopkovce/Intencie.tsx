// Modul „Intencie Sopkovce“: kalendár / týždeň a formulár dňa.
// Otvorený deň je v adrese (#/intencie/2026-11-06), takže Späť v telefóne formulár zavrie.

import { useState } from 'react'
import { prejdi } from '../../app/smerovanie'
import { dnes, jeDatum, pondelokTyzdna, pridajDni } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { StavSynchronizacie } from '../../ui/StavSynchronizacie'
import { INTENCIE } from './data'
import { nahradDen, najdiDen, pridajBohosluzbu, ulozDen, type Bohosluzba, type DenForm } from './model/intencie'
import { FormularDna } from './FormularDna'
import { mesiacDatumu } from './kalendar'
import { MesacnyKalendar } from './MesacnyKalendar'
import { PoriadokHumenne } from './PoriadokHumenne'
import { TyzdennyPrehlad } from './TyzdennyPrehlad'

type Pohlad = 'mesiac' | 'tento' | 'buduci'

const POHLADY: Array<{ id: Pohlad; nazov: string }> = [
  { id: 'mesiac', nazov: 'Mesiac' },
  { id: 'tento', nazov: 'Tento týždeň' },
  { id: 'buduci', nazov: 'Budúci týždeň' },
]

const CESTA = '/intencie'

/** podcesta = časť za /intencie, napr. '/2026-11-06' */
export function Intencie({ podcesta }: { podcesta: string }) {
  const { data, stav, subor } = useSubor(INTENCIE)
  const dnesny = dnes()
  const [pohlad, setPohlad] = useState<Pohlad>('mesiac')
  const [mesiac, setMesiac] = useState(() => mesiacDatumu(dnesny))

  const zhoda = /^\/(\d{4}-\d{2}-\d{2})$/.exec(podcesta)
  const otvorenyDen = zhoda && jeDatum(zhoda[1]!) ? zhoda[1]! : null

  const otvor = (datum: string) => {
    setMesiac(mesiacDatumu(datum))
    prejdi(`${CESTA}/${datum}`)
  }
  const zavri = () => prejdi(CESTA)

  // vždy z aktuálnych dát súboru, nie z posledného vykreslenia
  const uloz = (f: DenForm) => {
    const r = ulozDen(subor.data, f)
    if (r.chyby.length > 0) return r.chyby
    void subor.uloz(r.subor)
    zavri()
    return []
  }
  const vymaz = () => {
    if (!otvorenyDen) return
    void subor.uloz(nahradDen(subor.data, otvorenyDen, null))
    zavri()
  }
  const kopiruj = (b: Bohosluzba, naDatum: string, sIntenciami: boolean) => {
    void subor.uloz(pridajBohosluzbu(subor.data, naDatum, b, sIntenciami))
  }

  if (otvorenyDen) {
    return (
      <>
        <StavSynchronizacie stav={stav} subor={subor} />
        <FormularDna
          key={otvorenyDen}
          datum={otvorenyDen}
          den={najdiDen(data, otvorenyDen)}
          onUloz={uloz}
          onVymaz={vymaz}
          onZrus={zavri}
          onKopiruj={kopiruj}
        />
      </>
    )
  }

  const pondelok = pondelokTyzdna(dnesny)
  const tyzden = pohlad === 'tento' ? pondelok : pridajDni(pondelok, 7)
  return (
    <>
      <StavSynchronizacie stav={stav} subor={subor} />
      <div className="prepinac intencie-pohlad" role="group" aria-label="Zobrazenie">
        {POHLADY.map((p) => (
          <button
            key={p.id}
            type="button"
            className="prepinac-tlacidlo"
            aria-pressed={pohlad === p.id}
            onClick={() => setPohlad(p.id)}
          >
            {p.nazov}
          </button>
        ))}
      </div>
      {pohlad === 'mesiac' ? (
        <MesacnyKalendar subor={data} mesiac={mesiac} dnes={dnesny} onZmenMesiac={setMesiac} onVyberDen={otvor} />
      ) : (
        <>
          <TyzdennyPrehlad subor={data} pondelok={tyzden} dnes={dnesny} onVyberDen={otvor} />
          <PoriadokHumenne pondelok={tyzden} jeBuduci={pohlad === 'buduci'} />
        </>
      )}
    </>
  )
}
