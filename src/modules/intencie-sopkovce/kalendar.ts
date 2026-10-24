// Pomocné funkcie pre mesačný kalendár (týždeň začína pondelkom).

import { denVTyzdni, pondelokTyzdna, pridajDni } from '../../lib/datum'

export const NAZVY_DNI_KRATKE = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne']

const NAZVY_MESIACOV = [
  'január',
  'február',
  'marec',
  'apríl',
  'máj',
  'jún',
  'júl',
  'august',
  'september',
  'október',
  'november',
  'december',
]

function rokAMesiac(mesiac: string): [number, number] {
  const [r, m] = mesiac.split('-').map(Number)
  return [r!, m!]
}

function mesiacZCisel(rok: number, mesiac: number): string {
  return `${String(rok).padStart(4, '0')}-${String(mesiac).padStart(2, '0')}`
}

export function mesiacDatumu(datum: string): string {
  return datum.slice(0, 7)
}

export function posunMesiac(mesiac: string, o: number): string {
  const [r, m] = rokAMesiac(mesiac)
  const index = r * 12 + (m - 1) + o
  return mesiacZCisel(Math.floor(index / 12), (index % 12) + 1)
}

export function nazovMesiaca(mesiac: string): string {
  const [r, m] = rokAMesiac(mesiac)
  return `${NAZVY_MESIACOV[m - 1]} ${r}`
}

/** Dni od pondelka pred (alebo na) 1. dňom mesiaca po nedeľu po (alebo na) poslednom dni. */
export function mriezkaMesiaca(mesiac: string): string[] {
  const prvy = `${mesiac}-01`
  const posledny = pridajDni(`${posunMesiac(mesiac, 1)}-01`, -1)
  const zaciatok = pondelokTyzdna(prvy)
  const koniec = pridajDni(posledny, 6 - denVTyzdni(posledny))
  const dni: string[] = []
  for (let d = zaciatok; d <= koniec; d = pridajDni(d, 1)) dni.push(d)
  return dni
}

/** „Po 2. 11.“ */
export function datumKratko(datum: string): string {
  const [, m, d] = datum.split('-').map(Number)
  return `${NAZVY_DNI_KRATKE[denVTyzdni(datum)]} ${d}. ${m}.`
}
