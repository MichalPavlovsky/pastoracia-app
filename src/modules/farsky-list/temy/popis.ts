// Čisté pomocníčky na popisy týždňov a odkazov.

import { pridajDni } from '../../../lib/datum'

function casti(datum: string): { r: number; m: number; d: number } {
  const [r, m, d] = datum.split('-').map(Number)
  return { r: r!, m: m!, d: d! }
}

/** „2. 11. – 8. 11.“ (pondelok až nedeľa) */
export function popisTyzdnaKratky(pondelok: string): string {
  const a = casti(pondelok)
  const b = casti(pridajDni(pondelok, 6))
  return `${a.d}. ${a.m}. – ${b.d}. ${b.m}.`
}

/** „2. 11. – 8. 11. 2026“; cez prelom roka s rokom pri oboch dátumoch */
export function popisTyzdna(pondelok: string): string {
  const a = casti(pondelok)
  const b = casti(pridajDni(pondelok, 6))
  if (a.r === b.r) return `${popisTyzdnaKratky(pondelok)} ${b.r}`
  return `${a.d}. ${a.m}. ${a.r} – ${b.d}. ${b.m}. ${b.r}`
}

export function jeOdkaz(s: string): boolean {
  return /^https?:\/\//i.test(s)
}

function dekoduj(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Hostiteľ bez „www.“ a prvých `max` znakov cesty; celý odkaz patrí do `title`. */
export function skratOdkaz(odkaz: string, max = 30): string {
  try {
    const u = new URL(odkaz)
    const host = u.hostname.replace(/^www\./, '')
    const cesta = u.pathname === '/' ? '' : dekoduj(u.pathname)
    return cesta.length > max ? `${host}${cesta.slice(0, max)}…` : `${host}${cesta}`
  } catch {
    return odkaz.length > 40 ? `${odkaz.slice(0, 40)}…` : odkaz
  }
}
