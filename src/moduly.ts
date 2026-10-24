// Zoznam modulov: nový modul = nový priečinok v src/modules + jeden záznam tu.

import type { ComponentType } from 'react'
import { FarskyList } from './modules/farsky-list/FarskyList'
import { Knihy } from './modules/knihy/Knihy'
import { Ludia } from './modules/ludia/Ludia'
import { Pastoracia } from './modules/pastoracia/Pastoracia'
import { IkonaKniha, IkonaList, IkonaLudia, IkonaPastoracia } from './ui/ikony'

export interface ModulInfo {
  id: string
  nazov: string
  popis: string
  /** napr. '/farsky-list' */
  cesta: string
  Ikona: ComponentType<{ velkost?: number }>
  /** podcesta = zvyšok za cestou modulu, napr. '/temy/pridat' alebo '' */
  Obrazovka: ComponentType<{ podcesta: string; parametre: URLSearchParams }>
}

export const MODULY: ModulInfo[] = [
  {
    id: 'farsky-list',
    nazov: 'Farský list',
    popis: 'Intencie Sopkovce a témy na list',
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
  },
  {
    id: 'knihy',
    nazov: 'Knihy',
    popis: 'Zamyslenie dňa',
    cesta: '/knihy',
    Ikona: IkonaKniha,
    Obrazovka: Knihy,
  },
]
