# Formáty dát – Pastorácia

Súbory sú v OneDrive v priečinku `/Pastoracia-app/data/`
(na PC: `C:\Users\MIchalPC\OneDrive\Pastoracia-app\data\`).
Číta ich aj iný nástroj (Claude), preto sa formát musí dodržať presne.

## Spoločné pravidlá

- JSON, kódovanie UTF-8 (bez BOM), odsadenie 2 medzery, na konci súboru jeden znak nového riadku.
- Každý súbor má na začiatku `"verzia": 1`.
- Dátumy `RRRR-MM-DD`, časy `HH:MM` (24-hodinový formát, s vedúcou nulou, napr. `08:00`).
- Polia s prázdnou hodnotou sa ukladajú ako `""` alebo `[]`, nikdy sa nevynechávajú.
- Poradie kľúčov v objektoch je také, ako v príkladoch nižšie.

## sopkovce-intencie.json

```json
{
  "verzia": 1,
  "dni": [
    {
      "datum": "2026-12-23",
      "bohosluzby": [
        {
          "cas": "16:30",
          "typ": "liturgia",
          "intencie": [
            { "znak": "+", "text": "Mária, Ján", "objednal": "", "poznamka": "" }
          ]
        }
      ],
      "spovede": [
        { "od": "15:00", "do": "16:20", "poznamka": "predvianočná spoveď" }
      ],
      "oznam": ""
    }
  ]
}
```

| Pole | Hodnoty |
|---|---|
| `typ` | `"liturgia"` \| `"moleben"` \| `"panychida"` \| `"ine"` |
| `znak` | `"*"` za živých, `"+"` za zosnulých |
| `text` | presne tak, ako bol zadaný (bez úprav) |
| `objednal`, `poznamka` | voliteľné, inak `""` |
| `spovede` | 0 až N v ktorýkoľvek deň; `"do"` je voliteľné (`""`) |
| `oznam` | voľný text, inak `""` |

- Deň bez bohoslužieb, spovedí aj oznamu sa neukladá.
- Pole `dni` je zoradené podľa `datum` vzostupne, každý dátum je v ňom najviac raz.
- Bohoslužby v dni sú zoradené podľa `cas`, spovede podľa `od`.

## farsky-list-plan.json

Vlastné návrhy tém na Farský list.

```json
{
  "verzia": 1,
  "tyzdne": [
    {
      "pondelok": "2026-11-02",
      "temy": [
        {
          "id": "t-3f2b8c1e-6d4a-4b7e-9c11-2a5d8e0f7b34",
          "nazov": "Dušičky – odpustky",
          "zdroje": ["https://..."],
          "poznamka": "krátko, 1 strana",
          "poradie": 1,
          "stav": "plan"
        }
      ],
      "poznamka": ""
    }
  ]
}
```

| Pole | Hodnoty |
|---|---|
| `pondelok` | dátum pondelka daného týždňa |
| `id` | `"t-"` + UUID, nemení sa ani pri presune na iný týždeň |
| `zdroje` | zoznam odkazov, inak `[]` |
| `poradie` | 1, 2, 3 … v rámci týždňa bez medzier |
| `stav` | `"napad"` \| `"plan"` \| `"pouzite"` |

- Pole `tyzdne` je zoradené podľa `pondelok` vzostupne, každý pondelok je v ňom najviac raz.
- Témy v týždni sú zoradené podľa `poradie`.
- Týždeň bez tém aj bez poznámky sa neukladá.

## Ďalšie moduly

Pastorácia, Ľudia a Knihy majú zatiaľ len TypeScript typy
(`src/modules/*/types.ts`). Ich súbory sa doplnia sem, keď sa budú tvoriť.
