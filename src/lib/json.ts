// Pomôcky na bezpečné čítanie JSON súborov z OneDrive.
// Chýbajúce polia doplníme prázdnou hodnotou, nesprávne hodnoty ohlásime chybou.

export class ChybaFormatu extends Error {
  constructor(cesta: string, sprava: string) {
    super(`${cesta}: ${sprava}`)
    this.name = 'ChybaFormatu'
  }
}

export type Obj = Record<string, unknown>

export function obj(v: unknown, cesta: string): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new ChybaFormatu(cesta, 'očakávaný objekt')
  return v as Obj
}

export function pole(v: unknown, cesta: string): unknown[] {
  if (v === undefined) return []
  if (!Array.isArray(v)) throw new ChybaFormatu(cesta, 'očakávané pole')
  return v
}

export function text(v: unknown, cesta: string): string {
  if (v === undefined || v === null) return ''
  if (typeof v !== 'string') throw new ChybaFormatu(cesta, 'očakávaný text')
  return v
}

export function cislo(v: unknown, cesta: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new ChybaFormatu(cesta, 'očakávané číslo')
  return v
}

export function jedenZ<T extends string>(v: unknown, moznosti: readonly T[], cesta: string): T {
  if (typeof v !== 'string' || !(moznosti as readonly string[]).includes(v)) {
    throw new ChybaFormatu(cesta, `očakávané ${moznosti.map((m) => `"${m}"`).join(' | ')}, je ${JSON.stringify(v)}`)
  }
  return v as T
}

export function overVerziu(koren: Obj, subor: string): void {
  if (koren.verzia !== 1) throw new ChybaFormatu(subor, `nepodporovaná verzia ${JSON.stringify(koren.verzia)}`)
}

export function parsujText(s: string, subor: string): unknown {
  try {
    return JSON.parse(s.charCodeAt(0) === 0xfeff ? s.slice(1) : s)
  } catch (e) {
    throw new ChybaFormatu(subor, `neplatný JSON (${(e as Error).message})`)
  }
}

/** Zápis podľa SCHEMA.md: odsadenie 2 medzery, nový riadok na konci. */
export function naText(data: unknown): string {
  return JSON.stringify(data, null, 2) + '\n'
}

export function novyKluc(): string {
  return crypto.randomUUID()
}
