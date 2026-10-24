// Čo treba v kalendári vytvoriť, upraviť a zmazať, aby sedel s požadovanými udalosťami.

import { podpisUdalosti, type UdalostKalendara, type UlozenaUdalost } from './types'

export interface Zmeny {
  vytvorit: UdalostKalendara[]
  upravit: { id: string; udalost: UdalostKalendara }[]
  zmazat: string[]
}

/** `existujuce` sú naše udalosti od dnes ďalej. */
export function zosulad(pozadovane: UdalostKalendara[], existujuce: UlozenaUdalost[]): Zmeny {
  const zmeny: Zmeny = { vytvorit: [], upravit: [], zmazat: [] }
  const podlaPripomienky = new Map<string, UlozenaUdalost[]>()
  for (const u of existujuce) podlaPripomienky.set(u.idPripomienky, [...(podlaPripomienky.get(u.idPripomienky) ?? []), u])

  for (const poz of pozadovane) {
    const [prva, ...navyse] = podlaPripomienky.get(poz.idPripomienky) ?? []
    podlaPripomienky.delete(poz.idPripomienky)
    // dve zariadenia naraz mohli vytvoriť dvojicu
    zmeny.zmazat.push(...navyse.map((u) => u.id))
    if (!prva) zmeny.vytvorit.push(poz)
    else if (prva.podpis !== podpisUdalosti(poz)) zmeny.upravit.push({ id: prva.id, udalost: poz })
  }
  // pripomienka je hotová, zmazaná alebo v minulosti
  for (const zvysne of podlaPripomienky.values()) zmeny.zmazat.push(...zvysne.map((u) => u.id))
  return zmeny
}
