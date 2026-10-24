import { denVTyzdni, jeNedela, jePrvyPiatok } from '../../lib/datum'
import { najdiDen, znackyDna, type IntencieSubor } from './model/intencie'
import { mesiacDatumu, mriezkaMesiaca, nazovMesiaca, NAZVY_DNI_KRATKE, posunMesiac } from './kalendar'
import './kalendar.css'

const NAZVY_DNI_PLNE = ['pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota', 'nedeľa']

function bohosluzbyText(n: number): string {
  if (n === 1) return '1 bohoslužba'
  if (n >= 2 && n <= 4) return `${n} bohoslužby`
  return `${n} bohoslužieb`
}

function popisDna(subor: IntencieSubor, datum: string, dnes: string): string {
  const [r, m, d] = datum.split('-').map(Number)
  const z = znackyDna(najdiDen(subor, datum))
  const casti = [`${NAZVY_DNI_PLNE[denVTyzdni(datum)]} ${d}. ${m}. ${r}`]
  if (datum === dnes) casti.push('dnes')
  if (jePrvyPiatok(datum)) casti.push('prvý piatok')
  if (z.bohosluzby > 0) casti.push(bohosluzbyText(z.bohosluzby))
  if (z.spoved) casti.push('spoveď')
  if (z.oznam) casti.push('oznam')
  return casti.join(', ')
}

export function MesacnyKalendar(props: {
  subor: IntencieSubor
  mesiac: string
  dnes: string
  onZmenMesiac: (mesiac: string) => void
  onVyberDen: (datum: string) => void
}) {
  const { subor, mesiac, dnes, onZmenMesiac, onVyberDen } = props
  return (
    <div className="kal">
      <div className="kal-hlavicka">
        <button
          type="button"
          className="kal-sipka"
          aria-label="Predchádzajúci mesiac"
          onClick={() => onZmenMesiac(posunMesiac(mesiac, -1))}
        >
          ‹
        </button>
        <h2 className="kal-nazov" aria-live="polite">
          {nazovMesiaca(mesiac)}
        </h2>
        <button
          type="button"
          className="kal-sipka"
          aria-label="Nasledujúci mesiac"
          onClick={() => onZmenMesiac(posunMesiac(mesiac, 1))}
        >
          ›
        </button>
        <button type="button" className="kal-dnes" onClick={() => onZmenMesiac(mesiacDatumu(dnes))}>
          Dnes
        </button>
      </div>
      <div className="kal-mriezka">
        {NAZVY_DNI_KRATKE.map((n, i) => (
          <div key={n} className={i === 6 ? 'kal-hlavicka-dna kal-nedela' : 'kal-hlavicka-dna'} aria-hidden="true">
            {n}
          </div>
        ))}
        {mriezkaMesiaca(mesiac).map((datum) => {
          const z = znackyDna(najdiDen(subor, datum))
          const trieda = ['kal-den']
          if (mesiacDatumu(datum) !== mesiac) trieda.push('kal-mimo')
          if (datum === dnes) trieda.push('kal-dnes-den')
          if (jeNedela(datum)) trieda.push('kal-nedela')
          if (jePrvyPiatok(datum)) trieda.push('kal-prvy-piatok')
          return (
            <button
              key={datum}
              type="button"
              className={trieda.join(' ')}
              aria-label={popisDna(subor, datum, dnes)}
              onClick={() => onVyberDen(datum)}
            >
              <span className="kal-cislo">{Number(datum.slice(8))}</span>
              <span className="kal-znacky" aria-hidden="true">
                {z.bohosluzby > 0 && <span className="kal-bohosluzby">{z.bohosluzby}×</span>}
                {z.spoved && <span className="kal-spoved" />}
                {z.oznam && <span className="kal-oznam" />}
              </span>
            </button>
          )
        })}
      </div>
      <ul className="kal-legenda">
        <li>
          <span className="kal-bohosluzby">2×</span> bohoslužby
        </li>
        <li>
          <span className="kal-spoved" /> spoveď
        </li>
        <li>
          <span className="kal-oznam" /> oznam
        </li>
        <li>
          <span className="kal-pf" /> prvý piatok
        </li>
        <li>
          <span className="kal-ne">Ne</span> nedeľa
        </li>
      </ul>
    </div>
  )
}
