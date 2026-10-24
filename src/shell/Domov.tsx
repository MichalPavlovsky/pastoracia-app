import { MODULY } from '../moduly'

export function Domov() {
  return (
    <nav className="dlazdice" aria-label="Moduly">
      {MODULY.map(({ id, nazov, popis, cesta, Ikona, Odznak }) => (
        <a key={id} className="dlazdica" href={`#${cesta}`}>
          <Ikona velkost={40} />
          {Odznak && <Odznak />}
          <span className="dlazdica-nazov">{nazov}</span>
          <span className="dlazdica-popis">{popis}</span>
        </a>
      ))}
    </nav>
  )
}
