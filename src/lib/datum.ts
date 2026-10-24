// Práca s dátumami RRRR-MM-DD a časmi HH:MM bez časových pásiem.
// Interne počítame v UTC, aby letný čas nikdy neposunul deň.

const DATUM_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const CAS_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function jeDatum(s: string): boolean {
  const m = DATUM_RE.exec(s)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!))
  return d.getUTCFullYear() === +m[1]! && d.getUTCMonth() === +m[2]! - 1 && d.getUTCDate() === +m[3]!
}

export function jeCas(s: string): boolean {
  return CAS_RE.test(s)
}

function naDate(datum: string): Date {
  if (!jeDatum(datum)) throw new Error(`Neplatný dátum: ${datum}`)
  const [r, m, d] = datum.split('-').map(Number)
  return new Date(Date.UTC(r!, m! - 1, d!))
}

function zDate(d: Date): string {
  const r = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const den = String(d.getUTCDate()).padStart(2, '0')
  return `${r}-${m}-${den}`
}

export function dnes(): string {
  const t = new Date()
  return zDate(new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())))
}

export function pridajDni(datum: string, pocet: number): string {
  const d = naDate(datum)
  d.setUTCDate(d.getUTCDate() + pocet)
  return zDate(d)
}

/** 0 = pondelok … 6 = nedeľa */
export function denVTyzdni(datum: string): number {
  return (naDate(datum).getUTCDay() + 6) % 7
}

export function jeNedela(datum: string): boolean {
  return denVTyzdni(datum) === 6
}

export function pondelokTyzdna(datum: string): string {
  return pridajDni(datum, -denVTyzdni(datum))
}

export function jePondelok(datum: string): boolean {
  return jeDatum(datum) && denVTyzdni(datum) === 0
}

/** Dátum prvého piatku v mesiaci, do ktorého patrí `datum`. */
export function prvyPiatokMesiaca(datum: string): string {
  const prvy = `${datum.slice(0, 7)}-01`
  return pridajDni(prvy, (4 - denVTyzdni(prvy) + 7) % 7)
}

export function jePrvyPiatok(datum: string): boolean {
  return prvyPiatokMesiaca(datum) === datum
}

/** Týždeň (Po–Ne) obsahuje prvý piatok niektorého mesiaca. */
export function tyzdenSPrvymPiatkom(datum: string): boolean {
  return jePrvyPiatok(pridajDni(pondelokTyzdna(datum), 4))
}

export function casNaMinuty(cas: string): number {
  if (!jeCas(cas)) throw new Error(`Neplatný čas: ${cas}`)
  const [h, m] = cas.split(':').map(Number)
  return h! * 60 + m!
}

export function minutyNaCas(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function posunCas(cas: string, minuty: number): string {
  return minutyNaCas(casNaMinuty(cas) + minuty)
}

const SKRATKY_DNI = ['po', 'ut', 'st', 'št', 'pi', 'so', 'ne']

/** "st 23. 12. 2026" */
export function formatDatum(datum: string): string {
  const [r, m, d] = datum.split('-').map(Number)
  return `${SKRATKY_DNI[denVTyzdni(datum)]} ${d}. ${m}. ${r}`
}
