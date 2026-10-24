// Trojcestné zlúčenie zoznamov podľa kľúča (dátum, id témy …).
// Pre každý kľúč porovná: spoločný základ, moju verziu a verziu z iného zariadenia.

export type Druh = 'pridane' | 'zmenene' | 'zmazane'

export interface Zlucenie<P> {
  vysledok: Map<string, P>
  /** prevzaté z iného zariadenia */
  zInych: { kluc: string; druh: Druh; ich?: P }[]
  /** zmenené na oboch zariadeniach rôzne */
  konflikty: { kluc: string; moje?: P; ich?: P; ponechane: 'moje' | 'ich' }[]
}

const rovnake = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function zlucPodlaKluca<P>(zaklad: Map<string, P>, moje: Map<string, P>, ich: Map<string, P>): Zlucenie<P> {
  const z: Zlucenie<P> = { vysledok: new Map(), zInych: [], konflikty: [] }
  const kluce = new Set([...zaklad.keys(), ...moje.keys(), ...ich.keys()])
  for (const k of [...kluce].sort()) {
    const b = zaklad.get(k)
    const m = moje.get(k)
    const t = ich.get(k)
    let vysledok: P | undefined
    if (rovnake(m, t)) {
      vysledok = m
    } else if (rovnake(m, b)) {
      // zmenilo sa len inde
      vysledok = t
      z.zInych.push({ kluc: k, druh: b === undefined ? 'pridane' : t === undefined ? 'zmazane' : 'zmenene', ich: t })
    } else if (rovnake(t, b)) {
      // zmenilo sa len u mňa
      vysledok = m
    } else {
      // zmenilo sa na oboch – ponechaj moju verziu, ak som ju nezmazal
      const ponechane = m !== undefined ? 'moje' : 'ich'
      vysledok = ponechane === 'moje' ? m : t
      z.konflikty.push({ kluc: k, moje: m, ich: t, ponechane })
    }
    if (vysledok !== undefined) z.vysledok.set(k, vysledok)
  }
  return z
}
