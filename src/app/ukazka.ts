// Ukážkový režim len pre vývoj (http://localhost:5174/?ukazka): bez prihlásenia,
// dáta len v pamäti. Slúži na kontrolu obrazoviek. Do produkcie sa nedostane.

import type { Prihlasenie } from '../auth/prihlasenie'
import { PamatovyKalendar } from '../calendar/pamatovy'
import { SynchronizaciaKalendara } from '../calendar/synchronizacia'
import { serializujKnihy, SUBOR_KNIHY, type KnihySubor } from '../modules/knihy/model/knihy'
import { PamatovaCache } from '../storage/cache'
import { GraphOneDrive } from '../storage/graph'
import { Uloziste } from '../storage/store'
import { FalosnyOneDrive } from '../storage/test-pomocky'
import type { Aplikacia } from './kontext'

const UKAZKOVE_KNIHY: KnihySubor = {
  verzia: 1,
  knihy: [
    {
      id: 'ranny-pokoj',
      nazov: 'Ranný pokoj',
      autor: 'Ján Vymyslený',
      zdroj: 'Knihy/ranny-pokoj.pdf',
      uryvky: [
        {
          id: 'ranny-pokoj-001',
          nadpis: 'Prvé ticho',
          miesto: 's. 4',
          text: 'Deň sa nezačína v kalendári, ale v tichu. Kto vie ráno chvíľu mlčať, ten počuje aj to, čo cez deň prehluší.\n\nNie je to nič zložité. Stačí sa na chvíľu zastaviť a nechať myšlienky doznieť.',
        },
        {
          id: 'ranny-pokoj-002',
          nadpis: 'Drobná vďaka',
          miesto: 's. 9',
          text: 'Vďačnosť sa učí v malom. Šálka teplého čaju, strecha nad hlavou, známy hlas v telefóne.\n\nKto si všimne drobnosti, ten ťažšie podľahne zatrpknutosti.\n\nSkús dnes večer spomenúť tri veci, ktoré sa podarili.',
        },
        {
          id: 'ranny-pokoj-003',
          nadpis: 'Trpezlivosť',
          miesto: 's. 15',
          text: 'Trpezlivosť nie je čakanie so založenými rukami. Je to dôvera, že všetko má svoj čas.\n\nSemienko tiež nevyrastie za noc.',
        },
      ],
    },
    {
      id: 'cesta-domov',
      nazov: 'Cesta domů',
      autor: 'Karel Smyšlený',
      zdroj: 'Knihy/cesta-domov.pdf',
      uryvky: [
        {
          id: 'cesta-domov-001',
          nadpis: 'Návrat',
          miesto: 'kap. 1',
          text: 'Každý z nás se jednou vrací domů, i když třeba jen v myšlenkách. Domov není místo na mapě, ale chvíle, kdy se cítíme přijati.\n\nProto je dobré mít kam se vrátit.',
        },
        {
          id: 'cesta-domov-002',
          nadpis: 'Otevřené dveře',
          miesto: 'kap. 2',
          text: 'Dveře, které zůstávají otevřené, zvou dál. Jsou to často ty nejobyčejnější dveře u sousedů či přátel.\n\nPohostinnost začíná malým gestem.\n\nStačí říct: pojď dál.',
        },
        {
          id: 'cesta-domov-003',
          nadpis: 'Společný stůl',
          miesto: 'kap. 3',
          text: 'U společného stolu se mlčí jinak než o samotě. Chléb, který se láme, spojuje víc než dlouhé řeči.\n\nKdo sdílí stůl, sdílí i život.',
        },
      ],
    },
  ],
}

export function jeUkazka(): boolean {
  return import.meta.env.DEV && new URLSearchParams(location.search).has('ukazka')
}

export function ukazkovaAplikacia(prihlasenie: Prihlasenie): Aplikacia {
  const onedrive = new GraphOneDrive(() => Promise.reject(new Error('Ukážkový režim – bez OneDrive')))
  const falosny = new FalosnyOneDrive()
  falosny.zmenZvonku(SUBOR_KNIHY, serializujKnihy(UKAZKOVE_KNIHY))
  const uloziste = new Uloziste(falosny, new PamatovaCache())
  const kalendar = new SynchronizaciaKalendara(new PamatovyKalendar())
  return { prihlasenie, ucet: { meno: 'Ukážka', email: 'ukazka@localhost', typ: 'pracovny' }, onedrive, uloziste, kalendar }
}
