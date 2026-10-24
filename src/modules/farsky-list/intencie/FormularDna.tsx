// Formulár jedného dňa: bohoslužby s intenciami, spovede a oznam.

import { useState, type FormEvent } from 'react'
import { formatDatum, jeCas, jeDatum, jeNedela, jePrvyPiatok } from '../../../lib/datum'
import {
  NAZVY_TYPOV,
  RYCHLE_BOHOSLUZBY,
  TYPY_BOHOSLUZBY,
  denNaFormular,
  molebenPred,
  novaIntencia,
  prvaLiturgia,
  spovedPred,
  type Bohosluzba,
  type BohosluzbaForm,
  type ChybaFormulara,
  type Den,
  type DenForm,
  type IntenciaForm,
  type SpovedForm,
  type TypBohosluzby,
  type Znak,
} from '../model/intencie'
import { PonukaSpovede } from './PonukaSpovede'
import './formular.css'

interface Props {
  datum: string
  den: Den | undefined
  onUloz: (f: DenForm) => ChybaFormulara[]
  onVymaz: () => void
  onZrus: () => void
  onKopiruj: (b: Bohosluzba, naDatum: string, sIntenciami: boolean) => void
}

type Chyby = Record<string, string>

export function FormularDna({ datum, den, onUloz, onVymaz, onZrus, onKopiruj }: Props) {
  const [form, setForm] = useState<DenForm>(() => denNaFormular(datum, den))
  const [zDatumu, setZDatumu] = useState(datum)
  const [chyby, setChyby] = useState<ChybaFormulara[]>([])
  const [potvrdVymaz, setPotvrdVymaz] = useState(false)

  // Pri zmene dňa sa formulár načíta odznova
  if (zDatumu !== datum) {
    setZDatumu(datum)
    setForm(denNaFormular(datum, den))
    setChyby([])
    setPotvrdVymaz(false)
  }

  const chybyPodlaCesty: Chyby = {}
  for (const c of chyby) chybyPodlaCesty[c.cesta] = c.sprava

  const liturgia = prvaLiturgia(form)

  const upravBohosluzbu = (kluc: string, zmena: Partial<BohosluzbaForm>) =>
    setForm((f) => ({ ...f, bohosluzby: f.bohosluzby.map((b) => (b.kluc === kluc ? { ...b, ...zmena } : b)) }))
  const pridajBohosluzbu = (b: BohosluzbaForm) => setForm((f) => ({ ...f, bohosluzby: [...f.bohosluzby, b] }))
  const odstranBohosluzbu = (kluc: string) =>
    setForm((f) => ({ ...f, bohosluzby: f.bohosluzby.filter((b) => b.kluc !== kluc) }))
  const upravIntenciu = (bk: string, ik: string, zmena: Partial<IntenciaForm>) =>
    setForm((f) => ({
      ...f,
      bohosluzby: f.bohosluzby.map((b) =>
        b.kluc === bk ? { ...b, intencie: b.intencie.map((i) => (i.kluc === ik ? { ...i, ...zmena } : i)) } : b,
      ),
    }))
  const pridajIntenciu = (bk: string) =>
    setForm((f) => ({
      ...f,
      bohosluzby: f.bohosluzby.map((b) => (b.kluc === bk ? { ...b, intencie: [...b.intencie, novaIntencia()] } : b)),
    }))
  const odstranIntenciu = (bk: string, ik: string) =>
    setForm((f) => ({
      ...f,
      bohosluzby: f.bohosluzby.map((b) =>
        b.kluc === bk ? { ...b, intencie: b.intencie.filter((i) => i.kluc !== ik) } : b,
      ),
    }))
  const pridajSpoved = (s: SpovedForm) => setForm((f) => ({ ...f, spovede: [...f.spovede, s] }))
  const upravSpoved = (kluc: string, zmena: Partial<SpovedForm>) =>
    setForm((f) => ({ ...f, spovede: f.spovede.map((s) => (s.kluc === kluc ? { ...s, ...zmena } : s)) }))
  const odstranSpoved = (kluc: string) => setForm((f) => ({ ...f, spovede: f.spovede.filter((s) => s.kluc !== kluc) }))

  const uloz = (e?: FormEvent) => {
    e?.preventDefault()
    setChyby(onUloz(form))
  }

  const stitok = jeDatum(datum) ? (jeNedela(datum) ? 'nedeľa' : jePrvyPiatok(datum) ? 'prvý piatok' : '') : ''

  return (
    <form className="fd" onSubmit={uloz} noValidate>
      <h2 className="fd-nadpis">
        {jeDatum(datum) ? formatDatum(datum) : datum}
        {stitok && <span className="fd-stitok">{stitok}</span>}
      </h2>

      {chyby.length > 0 && (
        <div className="oznam fd-suhrn" role="alert">
          <strong className="chyba">Formulár obsahuje chyby:</strong>
          <ul>
            {chyby.map((c) => (
              <li key={c.cesta} className="chyba">
                {c.sprava}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section aria-labelledby="fd-h-bohosluzby">
        <h3 id="fd-h-bohosluzby" className="fd-sekcia">
          Bohoslužby
        </h3>
        <div className="fd-rychle">
          {RYCHLE_BOHOSLUZBY.map((v) => (
            <button key={v.nazov} type="button" className="tlacidlo" onClick={() => pridajBohosluzbu(v.bohosluzba())}>
              {v.nazov}
            </button>
          ))}
          <button
            type="button"
            className="tlacidlo"
            disabled={!liturgia}
            onClick={() => liturgia && pridajBohosluzbu(molebenPred(liturgia.cas))}
          >
            Moleben 20 min pred liturgiou
          </button>
          <button
            type="button"
            className="tlacidlo"
            disabled={!liturgia}
            onClick={() => liturgia && pridajSpoved(spovedPred(liturgia.cas))}
          >
            Spoveď hodinu pred liturgiou
          </button>
        </div>
        {!liturgia && <p className="fd-pomoc">Najprv pridaj liturgiu s platným časom.</p>}

        {form.bohosluzby.map((b, i) => (
          <KartaBohosluzby
            key={b.kluc}
            b={b}
            index={i}
            datum={datum}
            chyby={chybyPodlaCesty}
            onUprav={(z) => upravBohosluzbu(b.kluc, z)}
            onOdstran={() => odstranBohosluzbu(b.kluc)}
            onPridajIntenciu={() => pridajIntenciu(b.kluc)}
            onUpravIntenciu={(ik, z) => upravIntenciu(b.kluc, ik, z)}
            onOdstranIntenciu={(ik) => odstranIntenciu(b.kluc, ik)}
            onKopiruj={onKopiruj}
          />
        ))}
        {form.bohosluzby.length === 0 && <p className="fd-pomoc">Zatiaľ žiadna bohoslužba.</p>}
        <div className="rad-tlacidiel">
          <button type="button" className="tlacidlo" onClick={() => pridajBohosluzbu(novaPrazdna())}>
            + Bohoslužba
          </button>
        </div>
      </section>

      <PonukaSpovede form={form} onPridaj={pridajSpoved} />

      <section aria-labelledby="fd-h-spovede">
        <h3 id="fd-h-spovede" className="fd-sekcia">
          Spovede
        </h3>
        {form.spovede.map((s, i) => (
          <div key={s.kluc} className="fd-karta">
            <div className="fd-polia">
              <Pole label="Od" chyba={chybyPodlaCesty[`spovede.${i}.od`]}>
                <input
                  type="time"
                  className="fd-vstup"
                  value={s.od}
                  onChange={(e) => upravSpoved(s.kluc, { od: e.target.value })}
                />
              </Pole>
              <Pole label="Do (nepovinné)" chyba={chybyPodlaCesty[`spovede.${i}.do`]}>
                <input
                  type="time"
                  className="fd-vstup"
                  value={s.do}
                  onChange={(e) => upravSpoved(s.kluc, { do: e.target.value })}
                />
              </Pole>
              <Pole label="Poznámka" siroke>
                <input
                  type="text"
                  className="fd-vstup"
                  value={s.poznamka}
                  onChange={(e) => upravSpoved(s.kluc, { poznamka: e.target.value })}
                />
              </Pole>
            </div>
            <div className="rad-tlacidiel">
              <button type="button" className="tlacidlo" onClick={() => odstranSpoved(s.kluc)}>
                Odstrániť spoveď
              </button>
            </div>
          </div>
        ))}
        <div className="rad-tlacidiel">
          <button
            type="button"
            className="tlacidlo"
            onClick={() => pridajSpoved({ kluc: crypto.randomUUID(), od: '', do: '', poznamka: '' })}
          >
            + Spoveď
          </button>
        </div>
      </section>

      <section aria-labelledby="fd-h-oznam">
        <h3 id="fd-h-oznam" className="fd-sekcia">
          Oznam
        </h3>
        <textarea
          className="fd-vstup fd-oznam"
          aria-label="Oznam"
          rows={4}
          value={form.oznam}
          onChange={(e) => setForm((f) => ({ ...f, oznam: e.target.value }))}
        />
      </section>

      <div className="fd-pata">
        {chybyPodlaCesty.datum && <p className="chyba fd-chyba">{chybyPodlaCesty.datum}</p>}
        <div className="fd-pata-rad">
          <button type="submit" className="tlacidlo tlacidlo-hlavne">
            Uložiť
          </button>
          <button type="button" className="tlacidlo" onClick={onZrus}>
            Zrušiť
          </button>
          {den &&
            (potvrdVymaz ? (
              <span className="fd-potvrdenie">
                <span>Naozaj vymazať celý deň?</span>
                <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={onVymaz}>
                  Áno, vymazať
                </button>
                <button type="button" className="tlacidlo" onClick={() => setPotvrdVymaz(false)}>
                  Nie
                </button>
              </span>
            ) : (
              <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={() => setPotvrdVymaz(true)}>
                Vymazať deň
              </button>
            ))}
        </div>
      </div>
    </form>
  )
}

function novaPrazdna(): BohosluzbaForm {
  return { kluc: crypto.randomUUID(), cas: '', typ: 'liturgia', intencie: [] }
}

function Pole({
  label,
  chyba,
  siroke,
  children,
}: {
  label: string
  chyba?: string | undefined
  siroke?: boolean
  children: React.ReactNode
}) {
  return (
    <label className={siroke ? 'fd-pole fd-pole-siroke' : 'fd-pole'}>
      <span className="fd-popis">{label}</span>
      {children}
      {chyba && <span className="chyba fd-chyba">{chyba}</span>}
    </label>
  )
}

interface KartaProps {
  b: BohosluzbaForm
  index: number
  datum: string
  chyby: Chyby
  onUprav: (z: Partial<BohosluzbaForm>) => void
  onOdstran: () => void
  onPridajIntenciu: () => void
  onUpravIntenciu: (ik: string, z: Partial<IntenciaForm>) => void
  onOdstranIntenciu: (ik: string) => void
  onKopiruj: Props['onKopiruj']
}

function KartaBohosluzby(p: KartaProps) {
  const { b, index } = p
  const [potvrd, setPotvrd] = useState(false)
  const [kopiruje, setKopiruje] = useState(false)

  return (
    <div className="fd-karta">
      <div className="fd-polia">
        <Pole label="Čas" chyba={p.chyby[`bohosluzby.${index}.cas`]}>
          <input
            type="time"
            className="fd-vstup"
            value={b.cas}
            onChange={(e) => p.onUprav({ cas: e.target.value })}
          />
        </Pole>
        <Pole label="Typ">
          <select
            className="fd-vstup"
            value={b.typ}
            onChange={(e) => p.onUprav({ typ: e.target.value as TypBohosluzby })}
          >
            {TYPY_BOHOSLUZBY.map((t) => (
              <option key={t} value={t}>
                {NAZVY_TYPOV[t]}
              </option>
            ))}
          </select>
        </Pole>
      </div>

      <div className="fd-intencie">
        {b.intencie.map((it, j) => (
          <RiadokIntencie
            key={it.kluc}
            it={it}
            chyba={p.chyby[`bohosluzby.${index}.intencie.${j}.text`]}
            onUprav={(z) => p.onUpravIntenciu(it.kluc, z)}
            onOdstran={() => p.onOdstranIntenciu(it.kluc)}
          />
        ))}
      </div>

      <div className="rad-tlacidiel">
        <button type="button" className="tlacidlo" onClick={p.onPridajIntenciu}>
          + Intencia
        </button>
        <button type="button" className="tlacidlo" onClick={() => setKopiruje((v) => !v)} aria-expanded={kopiruje}>
          Kopírovať na iný deň
        </button>
        {potvrd ? (
          <span className="fd-potvrdenie">
            <span>Naozaj odstrániť?</span>
            <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={p.onOdstran}>
              Áno, odstrániť
            </button>
            <button type="button" className="tlacidlo" onClick={() => setPotvrd(false)}>
              Nie
            </button>
          </span>
        ) : (
          <button type="button" className="tlacidlo tlacidlo-nebezpecne" onClick={() => setPotvrd(true)}>
            Odstrániť bohoslužbu
          </button>
        )}
      </div>

      {kopiruje && <PanelKopirovania {...p} onZavri={() => setKopiruje(false)} />}
    </div>
  )
}

function RiadokIntencie({
  it,
  chyba,
  onUprav,
  onOdstran,
}: {
  it: IntenciaForm
  chyba?: string | undefined
  onUprav: (z: Partial<IntenciaForm>) => void
  onOdstran: () => void
}) {
  const [viac, setViac] = useState(it.objednal !== '' || it.poznamka !== '')
  const znak = (z: Znak, popis: string) => (
    <button
      type="button"
      className="prepinac-tlacidlo fd-znak"
      aria-pressed={it.znak === z}
      aria-label={popis}
      onClick={() => onUprav({ znak: z })}
    >
      {z}
    </button>
  )
  return (
    <div className="fd-intencia">
      <div className="fd-intencia-rad">
        <div className="prepinac fd-prepinac" role="group" aria-label="Za koho">
          {znak('*', 'Za živých')}
          {znak('+', 'Za zosnulých')}
        </div>
        <input
          type="text"
          className="fd-vstup fd-text"
          aria-label="Text intencie"
          aria-invalid={chyba ? true : undefined}
          value={it.text}
          onChange={(e) => onUprav({ text: e.target.value })}
        />
        <button type="button" className="tlacidlo fd-mala" aria-label="Odstrániť intenciu" onClick={onOdstran}>
          ✕
        </button>
      </div>
      {chyba && <span className="chyba fd-chyba">{chyba}</span>}
      <button type="button" className="fd-viac" aria-expanded={viac} onClick={() => setViac((v) => !v)}>
        {viac ? '▾ Menej' : '▸ Viac'}
      </button>
      {viac && (
        <div className="fd-polia">
          <Pole label="Kto objednal">
            <input
              type="text"
              className="fd-vstup"
              value={it.objednal}
              onChange={(e) => onUprav({ objednal: e.target.value })}
            />
          </Pole>
          <Pole label="Poznámka">
            <input
              type="text"
              className="fd-vstup"
              value={it.poznamka}
              onChange={(e) => onUprav({ poznamka: e.target.value })}
            />
          </Pole>
        </div>
      )}
    </div>
  )
}

function PanelKopirovania({ b, datum, onKopiruj, onZavri }: KartaProps & { onZavri: () => void }) {
  const [naDatum, setNaDatum] = useState('')
  const [sIntenciami, setSIntenciami] = useState(true)
  const [hotovo, setHotovo] = useState('')
  const mozno = jeCas(b.cas) && jeDatum(naDatum) && naDatum !== datum

  const kopiruj = () => {
    onKopiruj(
      {
        cas: b.cas,
        typ: b.typ,
        intencie: b.intencie.map((i) => ({ znak: i.znak, text: i.text, objednal: i.objednal, poznamka: i.poznamka })),
      },
      naDatum,
      sIntenciami,
    )
    setHotovo(`Skopírované na ${formatDatum(naDatum)}`)
  }

  return (
    <div className="fd-kopia">
      <Pole label="Skopírovať na deň">
        <input
          type="date"
          className="fd-vstup"
          value={naDatum}
          onChange={(e) => {
            setNaDatum(e.target.value)
            setHotovo('')
          }}
        />
      </Pole>
      <label className="fd-zaskrtnutie">
        <input type="checkbox" checked={sIntenciami} onChange={(e) => setSIntenciami(e.target.checked)} />
        aj s intenciami
      </label>
      {!jeCas(b.cas) && <p className="fd-pomoc">Najprv zadaj platný čas bohoslužby.</p>}
      {naDatum === datum && <p className="fd-pomoc">Vyber iný deň, než je tento.</p>}
      <div className="rad-tlacidiel">
        <button type="button" className="tlacidlo tlacidlo-hlavne" disabled={!mozno} onClick={kopiruj}>
          Kopírovať
        </button>
        <button type="button" className="tlacidlo" onClick={onZavri}>
          Zrušiť
        </button>
      </div>
      {hotovo && (
        <p className="fd-hotovo" role="status">
          {hotovo}
        </p>
      )}
    </div>
  )
}
