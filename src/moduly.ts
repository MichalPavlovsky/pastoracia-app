// Zoznam modulov: nový modul = nový priečinok v src/modules + jeden záznam tu.

import type { ComponentType } from 'react'
import { FarskyList } from './modules/farsky-list/FarskyList'
import { Intencie } from './modules/intencie-sopkovce/Intencie'
import { OdznakIntencii } from './modules/intencie-sopkovce/Odznak'
import { Knihy } from './modules/knihy/Knihy'
import { OdznakKnih } from './modules/knihy/Odznak'
import { Ludia } from './modules/ludia/Ludia'
import { OdznakLudi } from './modules/ludia/Odznak'
import { Pastoracia } from './modules/pastoracia/Pastoracia'
import { IkonaKalendar, IkonaKniha, IkonaList, IkonaLudia, IkonaPastoracia } from './ui/ikony'

export interface ModulInfo {
  id: string
  nazov: string
  popis: string
  /** napr. '/farsky-list' */
  cesta: string
  Ikona: ComponentType<{ velkost?: number }>
  /** podcesta = zvyšok za cestou modulu, napr. '/temy/pridat' alebo '' */
  Obrazovka: ComponentType<{ podcesta: string; parametre: URLSearchParams }>
  /** voliteľné číslo v rohu dlaždice (napr. koľko je na rade) */
  Odznak?: ComponentType
}

export const MODULY: ModulInfo[] = [
  {
    id: 'intencie-sopkovce',
    nazov: 'Intencie Sopkovce',
    popis: 'Bohoslužby, intencie a spovede',
    cesta: '/intencie',
    Ikona: IkonaKalendar,
    Obrazovka: Intencie,
    Odznak: OdznakIntencii,
  },
  {
    id: 'farsky-list',
    nazov: 'Farský list',
    popis: 'Moje témy na týždne dopredu',
    cesta: '/farsky-list',
    Ikona: IkonaList,
    Obrazovka: FarskyList,
  },
  {
    id: 'pastoracia',
    nazov: 'Pastorácia',
    popis: 'Myšlienky a nápady',
    cesta: '/pastoracia',
    Ikona: IkonaPastoracia,
    Obrazovka: Pastoracia,
  },
  {
    id: 'ludia',
    nazov: 'Ľudia',
    popis: 'Komu sa ozvať',
    cesta: '/ludia',
    Ikona: IkonaLudia,
    Obrazovka: Ludia,
    Odznak: OdznakLudi,
  },
  {
    id: 'knihy',
    nazov: 'Knihy',
    popis: 'Zamyslenie dňa',
    cesta: '/knihy',
    Ikona: IkonaKniha,
    Obrazovka: Knihy,
    Odznak: OdznakKnih,
  },
]
