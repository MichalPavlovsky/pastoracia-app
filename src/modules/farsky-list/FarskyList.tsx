import { prejdi } from '../../app/smerovanie'
import { Intencie } from './intencie/Intencie'
import { temaZoZdielania } from './model/temy'

type Zalozka = 'intencie' | 'temy'

const ZALOZKY: Array<{ id: Zalozka; nazov: string }> = [
  { id: 'intencie', nazov: 'Intencie Sopkovce' },
  { id: 'temy', nazov: 'Témy' },
]

export function FarskyList({ podcesta, parametre }: { podcesta: string; parametre: URLSearchParams }) {
  const zalozka: Zalozka = podcesta.startsWith('/temy') ? 'temy' : 'intencie'
  const prijate = podcesta === '/temy/pridat'

  return (
    <section className="obrazovka">
      <div className="zalozky" role="tablist" aria-label="Farský list">
        {ZALOZKY.map((z) => (
          <button
            key={z.id}
            role="tab"
            id={`zalozka-${z.id}`}
            aria-selected={zalozka === z.id}
            aria-controls="panel-zalozky"
            className="zalozka"
            onClick={() => prejdi(`/farsky-list/${z.id}`)}
          >
            {z.nazov}
          </button>
        ))}
      </div>

      <div id="panel-zalozky" role="tabpanel" aria-labelledby={`zalozka-${zalozka}`}>
        {zalozka === 'intencie' ? (
          <Intencie podcesta={podcesta} />
        ) : (
          <>
            <p>Plán tém pribudne v ďalšom kroku.</p>
            {prijate && <PrijatyOdkaz parametre={parametre} />}
          </>
        )}
      </div>
    </section>
  )
}

function PrijatyOdkaz({ parametre }: { parametre: URLSearchParams }) {
  const tema = temaZoZdielania({
    title: parametre.get('title') ?? undefined,
    text: parametre.get('text') ?? undefined,
    url: parametre.get('url') ?? undefined,
  })
  return (
    <div className="oznam">
      <p>
        <strong>Prijatý odkaz</strong>
      </p>
      <dl className="udaje">
        <dt>Názov</dt>
        <dd>{tema.nazov || '–'}</dd>
        <dt>Zdroje</dt>
        <dd>{tema.zdroje || '–'}</dd>
        <dt>Poznámka</dt>
        <dd>{tema.poznamka || '–'}</dd>
      </dl>
    </div>
  )
}
