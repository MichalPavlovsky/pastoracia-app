// Vzhľad aplikácie: automaticky (podľa systému), svetlý alebo tmavý. Uložené len v tomto zariadení.

export type Tema = 'auto' | 'svetly' | 'tmavy'

const KLUC = 'pastoracia.tema'
const FARBA_SVETLA = '#faf8f5'
const FARBA_TMAVA = '#171412'

export function nacitajTemu(): Tema {
  try {
    const t = localStorage.getItem(KLUC)
    return t === 'svetly' || t === 'tmavy' ? t : 'auto'
  } catch {
    return 'auto'
  }
}

export function ulozTemu(t: Tema): void {
  try {
    localStorage.setItem(KLUC, t)
  } catch {
    // súkromný režim alebo zablokované úložisko – téma platí aspoň do zatvorenia
  }
}

export function pouziTemu(t: Tema): void {
  const koren = document.documentElement
  if (t === 'auto') delete koren.dataset.tema
  else koren.dataset.tema = t

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    if (t === 'svetly') meta.content = FARBA_SVETLA
    else if (t === 'tmavy') meta.content = FARBA_TMAVA
    else meta.content = meta.media.includes('dark') ? FARBA_TMAVA : FARBA_SVETLA
  }
}

// Hlavná farba (liturgické farby). Tiež len v tomto zariadení.

export const FARBY = [
  { id: 'bordova', nazov: 'Bordová', vzorka: '#7a1f2b' },
  { id: 'zelena', nazov: 'Zelená', vzorka: '#2e6b3a' },
  { id: 'fialova', nazov: 'Fialová', vzorka: '#5b2a86' },
  { id: 'modra', nazov: 'Modrá', vzorka: '#1f4e8c' },
  { id: 'zlata', nazov: 'Zlatá', vzorka: '#8a6100' },
  { id: 'siva', nazov: 'Sivá', vzorka: '#4a4f57' },
] as const

export type Farba = (typeof FARBY)[number]['id']

const KLUC_FARBA = 'pastoracia.farba'

export function nacitajFarbu(): Farba {
  try {
    const f = localStorage.getItem(KLUC_FARBA)
    return FARBY.find((x) => x.id === f)?.id ?? 'bordova'
  } catch {
    return 'bordova'
  }
}

export function ulozFarbu(f: Farba): void {
  try {
    localStorage.setItem(KLUC_FARBA, f)
  } catch {
    // zablokované úložisko – farba platí aspoň do zatvorenia
  }
}

export function pouziFarbu(f: Farba): void {
  const koren = document.documentElement
  if (f === 'bordova') delete koren.dataset.farba
  else koren.dataset.farba = f
}
