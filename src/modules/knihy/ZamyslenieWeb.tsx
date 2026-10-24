// Karta „Dnes v liturgii“: čítania dňa a krátka myšlienka zo zamyslenia-web.json (pripravuje Claude).

import { useState } from 'react'
import { useSubor } from '../../storage/useSubor'
import { ZAMYSLENIA } from './data'
import { zamyslenieNaDen, type DalsieZamyslenie, type TextCitania } from './model/zamyslenia'

const IKONA_DRUHU: Record<DalsieZamyslenie['druh'], string> = {
  otcovia: '📜',
  komentar: '💬',
  nedela: '⛪',
}

// Text čítania sa načíta zo stránky casoslov.sk až po rozkliknutí.
function Citanie({ t }: { t: TextCitania }) {
  const [otvorene, setOtvorene] = useState(false)
  return (
    <details className="knihy-web-rozbal" onToggle={(e) => setOtvorene(e.currentTarget.open)}>
      <summary>
        📖 {t.nazov}
        {t.odkaz && <span className="knihy-slabsi"> · {t.odkaz}</span>}
      </summary>
      {otvorene && <iframe className="knihy-web-ramec" src={t.url} title={`${t.nazov} ${t.odkaz}`} />}
      <a className="knihy-web-odkaz" href={t.url} target="_blank" rel="noopener">
        Otvoriť na webe ↗
      </a>
    </details>
  )
}

function Dalsie({ d }: { d: DalsieZamyslenie }) {
  return (
    <details className="knihy-web-rozbal">
      <summary>
        {IKONA_DRUHU[d.druh]} {d.nazov}
        {d.zdroj && <span className="knihy-slabsi"> · {d.zdroj}</span>}
      </summary>
      {d.text.split(/\n\n+/).map((o, i) => (
        <p key={i}>{o}</p>
      ))}
      {d.url && (
        <a className="knihy-web-odkaz" href={d.url} target="_blank" rel="noopener">
          Celý text ↗
        </a>
      )}
    </details>
  )
}

export function ZamyslenieWeb({ den }: { den: string }) {
  const { data, stav } = useSubor(ZAMYSLENIA)
  const z = zamyslenieNaDen(data, den)
  if (!z) {
    if (stav.stav === 'nacitava') return null
    return <p className="knihy-prazdny">Na dnes zatiaľ nie je zamyslenie z webu. Pripravuje ho Claude každý večer.</p>
  }
  return (
    <>
      <article className="knihy-web" aria-label="Dnes v liturgii">
        <p className="knihy-web-stitok">Dnes v liturgii</p>
        {z.nazov && <h2 className="knihy-web-nazov">{z.nazov}</h2>}
        {z.citania && <p className="knihy-web-citania">{z.citania}</p>}
        {z.svati && <p className="knihy-slabsi">{z.svati}</p>}
        {z.texty.map((t) => (
          <Citanie key={t.url} t={t} />
        ))}
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
      {z.dalsie.length > 0 && (
        <section className="knihy-web-dalsie" aria-label="Ďalšie zamyslenia">
          {z.dalsie.map((d, i) => (
            <Dalsie key={i} d={d} />
          ))}
        </section>
      )}
    </>
  )
}
