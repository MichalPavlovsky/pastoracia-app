// Modul „Knihy“: zamyslenie dňa. knihy.json píše len Claude, aplikácia ukladá iba knihy-stav.json.

import { useState } from 'react'
import { dnes } from '../../lib/datum'
import { useSubor } from '../../storage/useSubor'
import { StavSynchronizacie } from '../../ui/StavSynchronizacie'
import { KNIHY, KNIHY_STAV } from './data'
import {
  dnesnyUryvok,
  jeOblubeny,
  oblubeneUryvky,
  oznacPrecitany,
  postupKnihy,
  prepniOblubeny,
  trebaNacitat,
  zrusPrecitany,
  type KnihyStav,
  type Kniha,
  type Uryvok,
} from './model/knihy'
import { ZamyslenieWeb } from './ZamyslenieWeb'
import './knihy.css'

function Text({ text }: { text: string }) {
  return (
    <div className="knihy-text">
      {text
        .split(/\n\n+/)
        .filter((o) => o.trim() !== '')
        .map((o, i) => (
          <p key={i}>{o}</p>
        ))}
    </div>
  )
}

function Podpis({ kniha, uryvok }: { kniha: Kniha; uryvok: Uryvok }) {
  return (
    <p className="knihy-podpis">
      {[kniha.nazov, kniha.autor, uryvok.miesto].filter((x) => x !== '').join(' · ')}
    </p>
  )
}

type Zalozka = 'knihy' | 'web'
const KLUC_ZALOZKY = 'pastoracia.knihy.zalozka'

function nacitajZalozku(): Zalozka {
  try {
    return localStorage.getItem(KLUC_ZALOZKY) === 'web' ? 'web' : 'knihy'
  } catch {
    return 'knihy'
  }
}

export function Knihy() {
  const [zalozka, setZalozka] = useState<Zalozka>(nacitajZalozku)
  const prepni = (z: Zalozka) => {
    setZalozka(z)
    try {
      localStorage.setItem(KLUC_ZALOZKY, z)
    } catch {
      // bez úložiska sa výber len nezapamätá
    }
  }

  const knihy = useSubor(KNIHY)
  const stav = useSubor(KNIHY_STAV)

  const uloz = (zmena: (d: KnihyStav) => KnihyStav) => {
    void stav.subor.uloz(zmena(stav.subor.data))
  }

  const den = dnes()
  const dnesny = dnesnyUryvok(knihy.data, stav.data, den)
  const oblubene = oblubeneUryvky(knihy.data, stav.data)
  const ziadneKnihy = knihy.data.knihy.length === 0

  return (
    <section className="obrazovka knihy">
      <StavSynchronizacie stav={stav.stav} subor={stav.subor} />
      {knihy.stav.stav === 'chyba' && <p className="chyba">Súbor kníh: {knihy.stav.chyba}</p>}

      <div className="prepinac knihy-zalozky" role="group" aria-label="Zobrazenie">
        <button type="button" className="prepinac-tlacidlo" aria-pressed={zalozka === 'knihy'} onClick={() => prepni('knihy')}>
          Knihy
        </button>
        <button type="button" className="prepinac-tlacidlo" aria-pressed={zalozka === 'web'} onClick={() => prepni('web')}>
          Z webu
        </button>
      </div>

      {zalozka === 'web' ? (
        <ZamyslenieWeb den={den} />
      ) : (
        <>
      {trebaNacitat(knihy.data, stav.data) && !ziadneKnihy && (
        <div className="oznam oznam-varovanie">
          <p>
            <strong>Treba načítať nové knihy</strong>
          </p>
          <p>Povedz Claudovi, nech spracuje ďalšie knihy z rebríčka.</p>
        </div>
      )}

      {dnesny ? (
        <article className="knihy-dnes">
          <h2 className="knihy-nadpis">{dnesny.uryvok.nadpis}</h2>
          <Podpis kniha={dnesny.kniha} uryvok={dnesny.uryvok} />
          <Text text={dnesny.uryvok.text} />

          <p className="knihy-postup-text">
            Úryvok {dnesny.poradie} z {dnesny.kniha.uryvky.length}
          </p>
          <progress
            className="knihy-pruh"
            max={dnesny.kniha.uryvky.length}
            value={postupKnihy(dnesny.kniha, stav.data).precitane}
            aria-label="Postup v knihe"
          />

          <div className="rad-tlacidiel knihy-akcie">
            {dnesny.precitanyDnes ? (
              <>
                <p className="knihy-hotovo">Prečítané dnes ✓</p>
                <button type="button" className="tlacidlo" onClick={() => uloz((d) => zrusPrecitany(d, dnesny.uryvok.id))}>
                  Zrušiť
                </button>
              </>
            ) : (
              <button
                type="button"
                className="tlacidlo tlacidlo-hlavne"
                onClick={() => uloz((d) => oznacPrecitany(d, dnesny.uryvok.id, den))}
              >
                Prečítané ✓
              </button>
            )}
            <button
              type="button"
              className="tlacidlo knihy-hviezda"
              aria-pressed={jeOblubeny(stav.data, dnesny.uryvok.id)}
              aria-label={jeOblubeny(stav.data, dnesny.uryvok.id) ? 'Odobrať z obľúbených' : 'Pridať do obľúbených'}
              onClick={() => uloz((d) => prepniOblubeny(d, dnesny.uryvok.id))}
            >
              {jeOblubeny(stav.data, dnesny.uryvok.id) ? '⭐' : '☆'}
            </button>
          </div>
        </article>
      ) : (
        knihy.stav.stav !== 'nacitava' && (
          <p className="knihy-prazdny">
            {ziadneKnihy
              ? 'Zatiaľ tu nie sú žiadne knihy. Povedz Claudovi, nech spracuje knihy z rebríčka.'
              : 'Všetko prečítané. Povedz Claudovi, nech spracuje ďalšie knihy z rebríčka.'}
          </p>
        )
      )}

      {!ziadneKnihy && (
        <>
          <h3 className="knihy-sekcia">Knihy</h3>
          <ul className="knihy-zoznam">
            {knihy.data.knihy.map((k) => {
              const p = postupKnihy(k, stav.data)
              return (
                <li key={k.id} className="knihy-kniha">
                  <strong>{k.nazov}</strong>
                  <span className="knihy-slabsi">{k.autor}</span>
                  <span className="knihy-slabsi">
                    Prečítané {p.precitane} z {p.spolu}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <details className="knihy-oblubene">
        <summary>Obľúbené ({oblubene.length})</summary>
        {oblubene.length === 0 ? (
          <p className="knihy-slabsi">Zatiaľ žiadne. Ťukni na ⭐ pri úryvku.</p>
        ) : (
          <ul className="knihy-zoznam">
            {oblubene.map(({ kniha, uryvok }) => (
              <li key={uryvok.id}>
                <details className="knihy-uryvok">
                  <summary>{uryvok.nadpis}</summary>
                  <Podpis kniha={kniha} uryvok={uryvok} />
                  <Text text={uryvok.text} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </details>
        </>
      )}
    </section>
  )
}
