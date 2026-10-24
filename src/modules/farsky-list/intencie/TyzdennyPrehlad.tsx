import { jeNedela, jePrvyPiatok } from '../../../lib/datum'
import { dniTyzdna, formatIntencia, NAZVY_TYPOV, type IntencieSubor } from '../model/intencie'
import { datumKratko } from './kalendar'
import './kalendar.css'

export function TyzdennyPrehlad(props: {
  subor: IntencieSubor
  pondelok: string
  dnes: string
  onVyberDen: (datum: string) => void
}) {
  const { subor, pondelok, dnes, onVyberDen } = props
  return (
    <ul className="tyz">
      {dniTyzdna(subor, pondelok).map(({ datum, den }) => {
        const trieda = ['tyz-den']
        if (jeNedela(datum)) trieda.push('tyz-nedela')
        if (jePrvyPiatok(datum)) trieda.push('tyz-prvy-piatok')
        if (datum === dnes) trieda.push('tyz-dnes')
        const prazdny =
          !den || (den.bohosluzby.length === 0 && den.spovede.length === 0 && den.oznam.trim() === '')
        return (
          <li key={datum}>
            <button type="button" className={trieda.join(' ')} onClick={() => onVyberDen(datum)}>
              <span className="tyz-datum">
                {datumKratko(datum)}
                {datum === dnes && <span className="tyz-stitok">dnes</span>}
                {jePrvyPiatok(datum) && <span className="tyz-stitok">prvý piatok</span>}
              </span>
              <span className="tyz-obsah">
                {prazdny && <span className="tyz-prazdne">—</span>}
                {den?.bohosluzby.map((b, i) => (
                  <span key={`b${i}`} className="tyz-bohosluzba">
                    <span className="tyz-cas">
                      {b.cas} {NAZVY_TYPOV[b.typ]}
                    </span>
                    {b.intencie.length > 0 && (
                      <span className="tyz-intencie">{b.intencie.map(formatIntencia).join('; ')}</span>
                    )}
                  </span>
                ))}
                {den?.spovede.map((s, i) => (
                  <span key={`s${i}`} className="tyz-spoved">
                    {s.do === '' ? `Spoveď od ${s.od}` : `Spoveď ${s.od}–${s.do}`}
                    {s.poznamka !== '' && ` (${s.poznamka})`}
                  </span>
                ))}
                {den && den.oznam.trim() !== '' && <span className="tyz-oznam">{den.oznam}</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
