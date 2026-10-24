import { Pripravujeme } from '../../ui/Pripravujeme'

export function Pastoracia() {
  return (
    <Pripravujeme
      uvod="Tento modul bude slúžiť na zachytávanie myšlienok a nápadov. Plánujeme:"
      plan={['zapisovanie myšlienok a nápadov', 'štítky a zdroje', 'prepojenie s témami Farského listu']}
    />
  )
}
