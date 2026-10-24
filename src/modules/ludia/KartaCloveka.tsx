// Človek v zozname „Všetci“: súhrn a po ťuknutí rozbalený detail.

import { useState } from 'react'
import { formatDatum } from '../../lib/datum'
import { FormularPripomienky } from './FormularPripomienky'
import { OdkazKontaktu, popisDna } from './NaRadeZoznam'
import {
  nazovIntervalu,
  pridajPripomienku,
  prepniHotovo,
  zmazPripomienku,
  type Clovek,
  type LudiaSubor,
  type Pripomienka,
} from './model/ludia'

interface Props {
  clovek: Clovek
  dnesny: string
  otvorena: boolean
  onPrepni: () => void
  onUprav: () => void
  onOzval: () => void
  onZmaz: () => void
  uloz: (zmena: (d: LudiaSubor) => LudiaSubor) => void
}

function popisPripomienky(p: Pripomienka, dnesny: string): string {
  return [popisDna(p.datum, dnesny), p.cas, p.dovod].filter((x) => x !== '').join(' · ')
}

export function KartaCloveka({ clovek: c, dnesny, otvorena, onPrepni, onUprav, onOzval, onZmaz, uloz }: Props) {
  const [potvrdZmazanie, setPotvrdZmazanie] = useState(false)
  const najblizsia = c.pripomienky.find((p) => !p.hotovo)

  return (
    <li className="lu-karta">
      <button type="button" className="lu-hlavicka" aria-expanded={otvorena} onClick={onPrepni}>
        <span className="lu-meno">{c.meno}</span>
        <span className="lu-info">
          {c.poslednyKontakt !== '' ? `naposledy: ${formatDatum(c.poslednyKontakt)}` : 'zatiaľ bez kontaktu'}
          {c.ozvatSaKazdych > 0 && ` · ${nazovIntervalu(c.ozvatSaKazdych)}`}
        </span>
        {najblizsia && (
          <span className={najblizsia.datum < dnesny ? 'lu-info lu-meskanie' : 'lu-info'}>
            pripomienka: {popisPripomienky(najblizsia, dnesny)}
          </span>
        )}
      </button>

      {otvorena && (
        <div className="lu-detail">
          {c.kontakt !== '' && (
            <div className="lu-kontakt">
              <span className="lu-kontakt-text">{c.kontakt}</span>
              <OdkazKontaktu kontakt={c.kontakt} />
            </div>
          )}
          {c.poznamka !== '' && <p className="lu-poznamka">{c.poznamka}</p>}

          {c.pripomienky.length > 0 && (
            <ul className="lu-pripomienky">
              {c.pripomienky.map((p) => (
                <li key={p.id} className={p.hotovo ? 'lu-pripomienka lu-hotovo' : 'lu-pripomienka'}>
                  <label className="lu-zaskrtni">
                    <input type="checkbox" checked={p.hotovo} onChange={() => uloz((d) => prepniHotovo(d, c.id, p.id))} />
                    <span className={!p.hotovo && p.datum < dnesny ? 'lu-meskanie' : ''}>{popisPripomienky(p, dnesny)}</span>
                  </label>
                  <button
                    type="button"
                    className="lu-zmaz"
                    aria-label="Zmazať pripomienku"
                    onClick={() => uloz((d) => zmazPripomienku(d, c.id, p.id))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FormularPripomienky onUloz={(f) => uloz((d) => pridajPripomienku(d, c.id, f))} />

          {potvrdZmazanie ? (
            <div className="lu-potvrdenie">
              <p>Naozaj zmazať?</p>
              <div className="lu-akcie lu-akcie-2">
                <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={onZmaz}>
                  Áno
                </button>
                <button type="button" className="tlacidlo" onClick={() => setPotvrdZmazanie(false)}>
                  Nie
                </button>
              </div>
            </div>
          ) : (
            <div className="lu-akcie lu-akcie-3">
              <button type="button" className="tlacidlo tlacidlo-hlavne" onClick={onOzval}>
                Ozval som sa
              </button>
              <button type="button" className="tlacidlo" onClick={onUprav}>
                Upraviť
              </button>
              <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={() => setPotvrdZmazanie(true)}>
                Zmazať
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
