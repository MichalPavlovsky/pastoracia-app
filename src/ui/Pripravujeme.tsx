// Spoločná obrazovka pre moduly, ktoré ešte nie sú hotové.

export function Pripravujeme({ uvod, plan }: { uvod: string; plan: string[] }) {
  return (
    <section className="obrazovka pripravujeme">
      <h1>Pripravujeme</h1>
      <p>{uvod}</p>
      <ul>
        {plan.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  )
}
