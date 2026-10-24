// Nastavenia z .env.local (pozri .env.example). Nič tajné tu nie je, ale nepatrí to do kódu.

// z hodnoty berieme len samotné GUID – pri kopírovaní do GitHubu sa prilepia aj znaky konca riadku
const clientId = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(import.meta.env.VITE_MSAL_CLIENT_ID ?? '')?.[0] ?? ''

export const config = {
  clientId,
  /** adresy, ktoré smú aplikáciu používať (malými písmenami) */
  povoleneAdresy: (import.meta.env.VITE_POVOLENE_ADRESY ?? '')
    .split(',')
    .map((a: string) => a.trim().toLowerCase())
    .filter((a: string) => a !== ''),
  /** napr. http://localhost:5174/ alebo https://michalpavlovsky.github.io/pastoracia-app/ */
  adresaAplikacie: new URL(import.meta.env.BASE_URL, window.location.origin).href,
}

export function chybaKonfiguracie(): string {
  if (!/^[0-9a-f-]{36}$/i.test(config.clientId)) return 'Chýba VITE_MSAL_CLIENT_ID v .env.local'
  if (config.povoleneAdresy.length === 0) return 'Chýba VITE_POVOLENE_ADRESY v .env.local'
  return ''
}

export function jePovolenaAdresa(adresa: string): boolean {
  return config.povoleneAdresy.includes(adresa.trim().toLowerCase())
}
