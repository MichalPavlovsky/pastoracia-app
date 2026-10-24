// Ukážkový režim len pre vývoj (http://localhost:5174/?ukazka): bez prihlásenia,
// dáta len v pamäti. Slúži na kontrolu obrazoviek. Do produkcie sa nedostane.

import type { Prihlasenie } from '../auth/prihlasenie'
import { PamatovyKalendar } from '../calendar/pamatovy'
import { SynchronizaciaKalendara } from '../calendar/synchronizacia'
import { PamatovaCache } from '../storage/cache'
import { GraphOneDrive } from '../storage/graph'
import { Uloziste } from '../storage/store'
import { FalosnyOneDrive } from '../storage/test-pomocky'
import type { Aplikacia } from './kontext'

export function jeUkazka(): boolean {
  return import.meta.env.DEV && new URLSearchParams(location.search).has('ukazka')
}

export function ukazkovaAplikacia(prihlasenie: Prihlasenie): Aplikacia {
  const onedrive = new GraphOneDrive(() => Promise.reject(new Error('Ukážkový režim – bez OneDrive')))
  const uloziste = new Uloziste(new FalosnyOneDrive(), new PamatovaCache())
  const kalendar = new SynchronizaciaKalendara(new PamatovyKalendar())
  return { prihlasenie, ucet: { meno: 'Ukážka', email: 'ukazka@localhost', typ: 'pracovny' }, onedrive, uloziste, kalendar }
}
