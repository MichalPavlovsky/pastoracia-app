// Jednoduchý router nad #hash. Časť ?query v adrese (location.search) sa nikdy nemení – používa ju prihlásenie.

import { useSyncExternalStore } from 'react'

export interface Cesta {
  cesta: string
  parametre: URLSearchParams
}

export function parsujHash(hash: string): Cesta {
  const bezOhrady = hash.startsWith('#') ? hash.slice(1) : hash
  const otaznik = bezOhrady.indexOf('?')
  const cestaText = otaznik === -1 ? bezOhrady : bezOhrady.slice(0, otaznik)
  const query = otaznik === -1 ? '' : bezOhrady.slice(otaznik + 1)
  let cesta = cestaText.startsWith('/') ? cestaText : `/${cestaText}`
  if (cesta.length > 1) cesta = cesta.replace(/\/+$/, '') || '/'
  return { cesta, parametre: new URLSearchParams(query) }
}

// useSyncExternalStore potrebuje stabilný výsledok, kým sa hash nezmení
let posledny: { hash: string; cesta: Cesta } | null = null

function aktualna(): Cesta {
  const hash = window.location.hash
  if (!posledny || posledny.hash !== hash) posledny = { hash, cesta: parsujHash(hash) }
  return posledny.cesta
}

function odober(cb: () => void): () => void {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useCesta(): Cesta {
  return useSyncExternalStore(odober, aktualna)
}

export function prejdi(cesta: string): void {
  window.location.hash = cesta
}
