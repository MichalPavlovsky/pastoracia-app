// Jedna udalosť ako .ics (iCalendar). iPhone ho otvorí ako „Pridať do kalendára“.
// Čas je „plávajúci“ (bez časového pásma) – platí miestny čas telefónu.

import { pridajDni } from '../lib/datum'
import type { UdalostKalendara } from './types'

/** celodenná sa ozve o 18:00 deň predtým, s časom 15 min vopred */
const PRIPOMENUT_CELODENNU = '-PT6H'
const PRIPOMENUT_S_CASOM = '-PT15M'

function escapuj(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

const bezPomlciek = (datum: string) => datum.replace(/-/g, '')

export function udalostIcs(u: UdalostKalendara, teraz = new Date()): string {
  const razitko = teraz.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const cas =
    u.cas === ''
      ? [`DTSTART;VALUE=DATE:${bezPomlciek(u.datum)}`, `DTEND;VALUE=DATE:${bezPomlciek(pridajDni(u.datum, 1))}`, 'TRANSP:TRANSPARENT']
      : [`DTSTART:${bezPomlciek(u.datum)}T${u.cas.replace(':', '')}00`, 'DURATION:PT15M']
  const riadky = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pastoracia//SK',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${u.idPripomienky}@pastoracia-app`,
    `DTSTAMP:${razitko}`,
    ...cas,
    `SUMMARY:${escapuj(u.nazov)}`,
    ...(u.text ? [`DESCRIPTION:${escapuj(u.text)}`] : []),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapuj(u.nazov)}`,
    `TRIGGER:${u.cas === '' ? PRIPOMENUT_CELODENNU : PRIPOMENUT_S_CASOM}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return riadky.join('\r\n') + '\r\n'
}

/** Otvorí udalosť v telefóne (Safari ponúkne pridanie do kalendára). */
export function otvorVKalendari(u: UdalostKalendara): void {
  const url = URL.createObjectURL(new Blob([udalostIcs(u)], { type: 'text/calendar;charset=utf-8' }))
  location.assign(url)
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
