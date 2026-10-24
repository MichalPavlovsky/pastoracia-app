// Karta „Dnes v liturgii“: čítania dňa a krátka myšlienka zo zamyslenia-web.json (pripravuje Claude raz týždenne).

import { useSubor } from '../../storage/useSubor'
import { ZAMYSLENIA } from './data'
import { zamyslenieNaDen } from './model/zamyslenia'

export function ZamyslenieWeb({ den }: { den: string }) {
  const { data, stav } = useSubor(ZAMYSLENIA)
  const z = zamyslenieNaDen(data, den)
  if (!z) return null
  return (
    <article className="knihy-web" aria-label="Dnes v liturgii">
      <p className="knihy-web-stitok">Dnes v liturgii</p>
      {z.nazov && <h2 className="knihy-web-nazov">{z.nazov}</h2>}
      {z.citania && <p className="knihy-web-citania">{z.citania}</p>}
      {z.svati && <p className="knihy-slabsi">{z.svati}</p>}
      {z.myslienka && <p className="knihy-web-myslienka">{z.myslienka}</p>}
      {z.otazka && <p className="knihy-web-otazka">{z.otazka}</p>}
      {z.zdroje.length > 0 && (
        <p className="knihy-web-zdroje">
          {z.zdroje.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener">
              {s.nazov || s.url} ↗
            </a>
          ))}
        </p>
      )}
      {stav.stav === 'chyba' && <p className="chyba">{stav.chyba}</p>}
    </article>
  )
}
