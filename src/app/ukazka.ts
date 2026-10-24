// Ukážkový režim len pre vývoj (http://localhost:5174/?ukazka): bez prihlásenia,
// dáta len v pamäti. Slúži na kontrolu obrazoviek. Do produkcie sa nedostane.

import type { Prihlasenie } from '../auth/prihlasenie'
import { PamatovyKalendar } from '../calendar/pamatovy'
import { SynchronizaciaKalendara } from '../calendar/synchronizacia'
import { dnes, pridajDni } from '../lib/datum'
import { serializujKnihy, SUBOR_KNIHY, type KnihySubor } from '../modules/knihy/model/knihy'
import { serializujZamyslenia, SUBOR_ZAMYSLENIA } from '../modules/knihy/model/zamyslenia'
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
  // nahrávanie PDF predstiera úspech, ostatné volania OneDrive zlyhajú
  const falosnyFetch: typeof fetch = async (vstup, init) => {
    const url = String(vstup)
    if (init?.method === 'PUT' && url.includes('/prilohy/')) {
      const nazov = decodeURIComponent(url.split(':/content')[0]!.split('/').pop()!)
      return Response.json({ name: nazov, webUrl: 'about:blank' })
    }
    if (init?.method === 'DELETE') return new Response(null, { status: 204 })
    throw new Error('Ukážkový režim – bez OneDrive')
  }
  const onedrive = new GraphOneDrive(() => Promise.resolve('ukazka'), falosnyFetch)
  const falosny = new FalosnyOneDrive()
  falosny.zmenZvonku(SUBOR_KNIHY, serializujKnihy(UKAZKOVE_KNIHY))
  falosny.zmenZvonku(
    SUBOR_ZAMYSLENIA,
    serializujZamyslenia({
      verzia: 1,
      dni: [
        {
          datum: dnes(),
          nazov: 'Ukážkový deň',
          citania: 'Kol 1, 12-18 · Jn 18, 33-37',
          svati: 'Mučeníci Marcián a Martýrios',
          myslienka: 'Ježiš je Kráľ, ktorý nevládne silou, ale pravdou. Jeho trónom je kríž a jeho mocou služba.',
          otazka: 'Komu dnes v mojom živote patrí trón?',
          zdroje: [{ nazov: 'casoslov.sk', url: 'https://casoslov.sk/' }],
          texty: [
            { nazov: 'Evanjelium', odkaz: 'Lk 7, 1b-10', url: 'https://casoslov.sk/?page=pray&day=2026-10-24&id=99999236' },
          ],
          dalsie: [
            {
              druh: 'otcovia',
              nazov: 'Otcovia k evanjeliu',
              zdroj: 'Catena Aurea',
              text: 'Ukážková myšlienka Otcov vlastnými slovami.',
              url: 'https://catenaaurea.sk/CommentedBibleTextsDirect.php?volba=Lk%207,1',
            },
            { druh: 'komentar', nazov: 'Komentár k evanjeliu', zdroj: 'Opus Dei', text: 'Ukážkový komentár.', url: 'https://opusdei.org/sk-sk/gospel/' },
          ],
        },
        {
          datum: pridajDni(dnes(), 1),
          nazov: 'Ukážkový zajtrajšok',
          citania: '1 Sol 1, 6-10 · Lk 11, 1-10',
          svati: '',
          myslienka: 'Učeníci neprosia o zázraky, ale aby sa naučili modliť.',
          otazka: '',
          zdroje: [],
          texty: [],
          dalsie: [],
        },
      ],
    }),
  )
  const uloziste = new Uloziste(falosny, new PamatovaCache())
  const kalendar = new SynchronizaciaKalendara(new PamatovyKalendar())
  return { prihlasenie, ucet: { meno: 'Ukážka', email: 'ukazka@localhost', typ: 'pracovny' }, onedrive, uloziste, kalendar }
}
