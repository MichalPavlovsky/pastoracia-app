import { Pripravujeme } from '../../ui/Pripravujeme'

export function Ludia() {
  return (
    <Pripravujeme
      uvod="Tento modul ti pripomenie, komu sa ozvať. Plánujeme:"
      plan={[
        'zoznam ľudí, komu sa ozvať',
        'pripomienky v kalendári (Outlook alebo Google)',
        'poznámka o poslednom kontakte',
      ]}
    />
  )
}
