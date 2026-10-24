import { Pripravujeme } from '../../ui/Pripravujeme'

export function Knihy() {
  return (
    <Pripravujeme
      uvod="Tento modul prinesie zamyslenie na každý deň. Plánujeme:"
      plan={['zamyslenie dňa z PDF a webových stránok', 'zoznam kníh', 'vlastné poznámky']}
    />
  )
}
