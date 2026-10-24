// Záložka „Na rade“: kto je na rade do týždňa (vrátane zmeškaných).

import { formatDatum, pridajDni } from '../../lib/datum'
import { odkazKontaktu, type NaRade } from './model/ludia'

/** „dnes“, „zajtra“ alebo dátum. */
export function popisDna(datum: string, dnesny: string): string {
  if (datum === dnesny) return 'dnes'
  if (datum === pridajDni(dnesny, 1)) return 'zajtra'
  return formatDatum(datum)
}

export function OdkazKontaktu({ kontakt }: { kontakt: string }) {
  const href = odkazKontaktu(kontakt)
  if (href === '') return null
  return (
    <a className="tlacidlo lu-odkaz" href={href}>
      {href.startsWith('tel:') ? 'Zavolať' : 'Napísať'}
    </a>
  )
}

interface Props {
  polozky: NaRade[]
  dnesny: string
  onOzval: (idCloveka: string, idPripomienky: string) => void
}

export function NaRadeZoznam({ polozky, dnesny, onOzval }: Props) {
  if (polozky.length === 0) return <p className="lu-prazdne">Tento týždeň nikto nie je na rade.</p>

  return (
    <ul className="lu-zoznam">
      {polozky.map((p) => (
        <li key={`${p.clovek.id}-${p.idPripomienky || 'pravidelny'}`} className="lu-karta">
          <p className="lu-meno">{p.clovek.meno}</p>
          <p className={p.meskanie ? 'lu-info lu-meskanie' : 'lu-info'}>
            {p.meskanie ? `meškám od ${formatDatum(p.datum)}` : popisDna(p.datum, dnesny)}
            {p.cas !== '' && ` o ${p.cas}`}
          </p>
          {p.dovod !== '' && <p className="lu-dovod">{p.dovod}</p>}
          <div className={odkazKontaktu(p.clovek.kontakt) !== '' ? 'lu-akcie lu-akcie-2' : 'lu-akcie'}>
            <button type="button" className="tlacidlo tlacidlo-hlavne" onClick={() => onOzval(p.clovek.id, p.idPripomienky)}>
              Ozval som sa
            </button>
            <OdkazKontaktu kontakt={p.clovek.kontakt} />
          </div>
        </li>
      ))}
    </ul>
  )
}
