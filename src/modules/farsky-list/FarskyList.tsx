// Modul „Farský list“: moje vlastné návrhy tém na týždne dopredu.
// #/farsky-list/pridat?url=… prijme odkaz zdieľaný z telefónu (Android, Skratka na iPhone).

import { temaZoZdielania } from './model/temy'

export function FarskyList({ podcesta, parametre }: { podcesta: string; parametre: URLSearchParams }) {
  return (
    <section className="obrazovka">
      <p>Plán tém pribudne v ďalšom kroku.</p>
      {podcesta === '/pridat' && <PrijatyOdkaz parametre={parametre} />}
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
