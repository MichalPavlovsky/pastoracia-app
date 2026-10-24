// Modul „Farský list“: moje vlastné návrhy tém na týždne dopredu.
// #/farsky-list/pridat?url=… prijme odkaz zdieľaný z telefónu (Android, Skratka na iPhone).

import { useState } from 'react'
import { prejdi } from '../../app/smerovanie'
import { dnes, pondelokTyzdna, pridajDni } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { StavSynchronizacie } from '../../ui/StavSynchronizacie'
import { PLAN } from './data'
import {
  najdiTemu,
  presunTemu,
  pridajTemu,
  temaNaFormular,
  temaZoZdielania,
  tyzdneDopredu,
  upravTemu,
  type PlanSubor,
  type TemaForm,
} from './model/temy'
import { FormularTemy } from './temy/FormularTemy'
import { Tyzden } from './temy/Tyzden'
import './temy/temy.css'

const CESTA = '/farsky-list'
const POCET_NA_ZACIATKU = 8
const RADA_VLOZENIA = 'Vlož odkaz sem (podrž prst → Vložiť).'

interface Otvoreny {
  /** mení sa pri každom otvorení, aby sa formulár načítal odznova */
  kluc: number
  id: string | null
  pociatok: TemaForm
  pondelok: string
  napoveda?: string
  zaostriZdroje?: boolean
}

export function FarskyList({ podcesta, parametre }: { podcesta: string; parametre: URLSearchParams }) {
  const { data, stav, subor } = useSubor(PLAN)
  const [pocet, setPocet] = useState(POCET_NA_ZACIATKU)
  const [formular, setFormular] = useState<Otvoreny | null>(null)
  const [predPodcesta, setPredPodcesta] = useState<string | null>(null)

  const dnesny = dnes()
  const tentoTyzden = pondelokTyzdna(dnesny)
  const buduciTyzden = pridajDni(tentoTyzden, 7)
  const tyzdne = tyzdneDopredu(data, dnesny, pocet)
  const pondelky = tyzdne.map((t) => t.pondelok)

  const otvor = (z: Omit<Otvoreny, 'kluc'>) => setFormular((f) => ({ ...z, kluc: (f?.kluc ?? 0) + 1 }))

  // Odkaz zdieľaný z telefónu otvorí predvyplnený formulár
  if (podcesta !== predPodcesta) {
    setPredPodcesta(podcesta)
    if (podcesta === '/pridat') {
      otvor({
        id: null,
        pociatok: temaZoZdielania({
          title: parametre.get('title') ?? undefined,
          text: parametre.get('text') ?? undefined,
          url: parametre.get('url') ?? undefined,
        }),
        pondelok: buduciTyzden,
      })
    }
  }

  // vždy z aktuálnych dát súboru, nie z posledného vykreslenia
  const uloz = (zmena: (p: PlanSubor) => PlanSubor) => {
    void subor.uloz(zmena(subor.data))
  }

  const zavri = () => {
    setFormular(null)
    if (podcesta === '/pridat') prejdi(CESTA)
  }

  const novaTema = (pondelok: string = buduciTyzden) => otvor({ id: null, pociatok: temaNaFormular(), pondelok })

  const vlozOdkaz = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const f = temaZoZdielania({ text })
      if (f.zdroje !== '') {
        otvor({ id: null, pociatok: f, pondelok: buduciTyzden })
        return
      }
    } catch {
      // schránka nie je dostupná – ukážeme prázdne pole
    }
    otvor({
      id: null,
      pociatok: temaNaFormular(),
      pondelok: buduciTyzden,
      napoveda: RADA_VLOZENIA,
      zaostriZdroje: true,
    })
  }

  const upravTemuVoFormulari = (id: string, pondelok: string) => {
    const n = najdiTemu(subor.data, id)
    if (!n) return
    otvor({ id, pociatok: temaNaFormular(n.tema), pondelok })
  }

  const ulozFormular = (f: TemaForm, pondelok: string) => {
    if (!formular) return
    const id = formular.id
    if (id === null) {
      uloz((p) => pridajTemu(p, pondelok, f).plan)
    } else {
      uloz((p) => {
        const upravene = upravTemu(p, id, f)
        const n = najdiTemu(upravene, id)
        return n && n.tyzden.pondelok !== pondelok ? presunTemu(upravene, id, pondelok) : upravene
      })
    }
    zavri()
  }

  return (
    <section className="obrazovka">
      <StavSynchronizacie stav={stav} subor={subor} />

      <div className="rad-tlacidiel tm-horna">
        <button type="button" className="tlacidlo tlacidlo-hlavne" onClick={() => novaTema()}>
          + Nová téma
        </button>
        <button type="button" className="tlacidlo" onClick={() => void vlozOdkaz()}>
          Vložiť odkaz
        </button>
      </div>

      {formular && (
        <FormularTemy
          key={formular.kluc}
          nadpis={formular.id === null ? 'Nová téma' : 'Úprava témy'}
          pociatok={formular.pociatok}
          pondelok={formular.pondelok}
          tyzdne={pondelky}
          napoveda={formular.napoveda}
          zaostriZdroje={formular.zaostriZdroje}
          onUloz={ulozFormular}
          onZrus={zavri}
        />
      )}

      {tyzdne.map((t) => (
        <Tyzden
          key={t.pondelok}
          tyzden={t}
          stitok={t.pondelok === tentoTyzden ? 'tento týždeň' : t.pondelok === buduciTyzden ? 'budúci týždeň' : ''}
          tyzdne={pondelky}
          uloz={uloz}
          onNovaTema={novaTema}
          onUprav={(tema, pondelok) => upravTemuVoFormulari(tema.id, pondelok)}
        />
      ))}

      <button type="button" className="tlacidlo tm-dalsi" onClick={() => setPocet((p) => p + 1)}>
        Pridať ďalší týždeň
      </button>
    </section>
  )
}
