// V týždni prvého piatku ponúkne spoveď hodinu pred liturgiou. Pridá ju až po kliknutí.

import { navrhSpovedePrvyPiatok, type DenForm, type SpovedForm } from '../model/intencie'

export function PonukaSpovede({ form, onPridaj }: { form: DenForm; onPridaj: (s: SpovedForm) => void }) {
  const navrh = navrhSpovedePrvyPiatok(form)
  if (!navrh) return null
  return (
    <div className="oznam ponuka-spovede">
      <p>
        Týždeň prvého piatku – pridať spoveď od <strong>{navrh.od}</strong> (hodinu pred liturgiou)?
      </p>
      <button type="button" className="tlacidlo" onClick={() => onPridaj(navrh)}>
        Pridať spoveď
      </button>
    </div>
  )
}
