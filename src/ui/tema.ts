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
