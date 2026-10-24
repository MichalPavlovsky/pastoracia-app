# Formáty dát – Pastorácia

Súbory sú v OneDrive pracovného účtu michal.pavlovsky@grkatpo.sk v priečinku `/Pastoracia-app/data/`
(na PC: `C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\Pastoracia-app\data\`).
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
          "stav": "plan",
          "prilohy": [
            {
              "nazov": "odpustky.pdf",
              "cesta": "Pastoracia-app/prilohy/2026-11-02/odpustky.pdf",
              "webUrl": "https://..."
            }
          ]
        }
      ],
      "poznamka": "",
      "prilohy": []
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
- `prilohy`: PDF k téme (pri téme) alebo k celému týždňu (pri týždni), inak `[]`. `nazov` = pôvodný názov súboru,
  `cesta` = od koreňa OneDrive, `webUrl` = odkaz na otvorenie. Aplikácia ich nahráva do `/Pastoracia-app/prilohy/<pondelok>/`
  (rovnaký názov OneDrive premenuje). Skill `fl` z nich pri písaní listu vytiahne text
  (na PC: `C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\` + `cesta`).
- Týždeň bez tém, bez poznámky a bez príloh sa neukladá.

## pastoracia-myslienky.json

Myšlienky a nápady (dlaždica Pastorácia).

```json
{
  "verzia": 1,
  "myslienky": [
    {
      "id": "m-3f2b8c1e-6d4a-4b7e-9c11-2a5d8e0f7b34",
      "nazov": "Advent s rodinou",
      "text": "Adventný veniec doma – krátka modlitba pri zapaľovaní sviec.",
      "stitky": ["advent", "rodiny"],
      "zdroje": ["https://..."],
      "vytvorene": "2026-10-24",
      "stav": "napad"
    }
  ]
}
```

| Pole | Hodnoty |
|---|---|
| `id` | `"m-"` + UUID |
| `nazov`, `text` | aspoň jedno z nich je neprázdne; `text` môže mať viac riadkov |
| `stitky` | zoznam štítkov bez duplicít (bez ohľadu na veľkosť písmen), inak `[]` |
| `zdroje` | zoznam odkazov, inak `[]` |
| `vytvorene` | dátum vytvorenia, pri úprave sa nemení |
| `stav` | `"napad"` \| `"rozpracovane"` \| `"hotove"` |

- Pole `myslienky` je zoradené podľa `vytvorene` **zostupne** (najnovšie prvé), pri zhode podľa `id`.

## ludia.json

Komu sa ozvať (dlaždica Ľudia).

```json
{
  "verzia": 1,
  "ludia": [
    {
      "id": "c-3f2b8c1e-6d4a-4b7e-9c11-2a5d8e0f7b34",
      "meno": "Anna Nováková",
      "kontakt": "0905 123 456",
      "poznamka": "",
      "poslednyKontakt": "2026-10-20",
      "ozvatSaKazdych": 30,
      "pripomienky": [
        {
          "id": "p-9a1c…",
          "datum": "2026-11-03",
          "cas": "",
          "dovod": "po operácii",
          "hotovo": false,
          "idKalendara": ""
        }
      ]
    }
  ]
}
```

| Pole | Hodnoty |
|---|---|
| `id` | `"c-"` + UUID (človek), `"p-"` + UUID (pripomienka) |
| `kontakt` | telefón, e-mail alebo iný text, inak `""` |
| `poslednyKontakt` | dátum alebo `""` |
| `ozvatSaKazdych` | počet dní (celé číslo); `0` = nepravidelne. Aplikácia ponúka 0, 7, 14, 30, 60, 91, 182, 365 |
| `cas` | `HH:MM` alebo `""` |
| `hotovo` | `true` \| `false` |
| `idKalendara` | rezerva, vždy `""` – prepojenie s Outlookom sa do súboru nezapisuje (pozri nižšie) |

- Pole `ludia` je zoradené podľa `meno` (slovenská abeceda), pri zhode podľa `id`.
- Pripomienky sú zoradené podľa `datum`, potom `cas`, potom `id`.
- „Na rade“ je: každá nehotová pripomienka s dátumom do 7 dní (aj zmeškaná) a pravidelný kontakt
  `poslednyKontakt + ozvatSaKazdych` (ak `poslednyKontakt` chýba, tak hneď).
- Kalendár: tlačidlo 📅 vytvorí z pripomienky súbor .ics (UID `<id pripomienky>@pastoracia-app`), do `ludia.json` sa nič nezapisuje.
- **Kalendár Outlook** (v kóde pripravený, vypnutý – `config.kalendarOutlook`): každá nehotová pripomienka s dátumom od dnes má
  v predvolenom kalendári udalosť. Udalosť nesie skryté vlastnosti (sada `{5d0c9f4e-2b7a-4c3e-8f61-a94b2e7d1c38}`):
  `PastoraciaZdroj = "ludia"`, `PastoraciaPripomienka = id pripomienky`, `PastoraciaPodpis` (názov, text, dátum, čas
  v čase zápisu). Aplikácia porovná udalosti s pripomienkami a chýbajúce vytvorí, zmenené upraví, nepotrebné
  (hotové, zmazané) zmaže. Pravidelný kontakt do kalendára nejde.

## knihy.json

Úryvky na zamyslenie dňa. **Zapisuje ho len Claude** (spracovanie kníh na PC), aplikácia ho iba číta.
Poradie v `knihy` = poradie čítania (číta sa jedna kniha od začiatku do konca). Rebríček kníh je vo vaulte
(`10 Projekty/Knihy – rebríček.md`).

```json
{
  "verzia": 1,
  "knihy": [
    {
      "id": "milovat-a-ctit",
      "nazov": "Milovať a ctiť",
      "autor": "Richard Vašečka",
      "zdroj": "Knihy/milovat-a-ctit.pdf",
      "uryvky": [
        {
          "id": "milovat-a-ctit-001",
          "nadpis": "Podstata manželstva",
          "miesto": "s. 4",
          "text": "Prvý odsek.\n\nDruhý odsek."
        }
      ]
    }
  ]
}
```

- `id` knihy: malé písmená bez diakritiky a pomlčky. `id` úryvku: `<id knihy>-NNN` (trojmiestne, od 001), nikdy sa nemení.
- `zdroj`: cesta od koreňa OneDrive. `miesto`: strana alebo kapitola v origináli (môže byť `""`).
- `text`: v jazyku knihy (české knihy ostávajú po česky, neprekladajú sa), ~2 minúty čítania (asi 220–320 slov), odseky oddelené `\n\n`.
- Dočítané knihy Claude pri načítaní nových odstráni; ich `id` úryvkov ostávajú v `knihy-stav.json`.

## knihy-stav.json

Čo už Michal prečítal. Zapisuje aplikácia.

```json
{
  "verzia": 1,
  "precitane": [
    { "uryvok": "milovat-a-ctit-001", "datum": "2026-10-25" }
  ],
  "oblubene": ["milovat-a-ctit-001"]
}
```

- Dnešný úryvok = úryvok prečítaný dnes, inak prvý neprečítaný v poradí `knihy.json`.
- Keď má neprečítané úryvky už len jedna kniha, aplikácia ukáže „Treba načítať nové knihy“ (Claude sa opýta
  a spracuje ďalšie dve z rebríčka). Aktívne sú vždy 3 knihy.
- Zlúčenie: zjednotenie oboch zoznamov (podľa `uryvok`, resp. id), pri `oblubene` sa rešpektuje odobratie.

## zamyslenia-web.json

Čítania dňa a krátka myšlienka z webu (karta „Dnes v liturgii“ v Knihách). **Zapisuje ho len Claude** (raz týždenne,
postup vo vaulte `AIOS/Skills/zamyslenia-web.md`), aplikácia ho iba číta. Ak súbor chýba, karta sa neukáže.

```json
{
  "verzia": 1,
  "dni": [
    {
      "datum": "2026-10-25",
      "nazov": "Nedeľa Krista Kráľa",
      "citania": "Kol 1, 12-18 · Jn 18, 33-37",
      "svati": "Mučeníci Marcián a Martýrios",
      "myslienka": "Vlastnými slovami, 2–4 vety.",
      "otazka": "Jedna otázka na zamyslenie.",
      "zdroje": [
        { "nazov": "casoslov.sk", "url": "https://casoslov.sk/?day=2026-10-25" }
      ]
    }
  ]
}
```

- `dni` zoradené podľa `datum`, každý dátum najviac raz; v súbore je posledný týždeň dozadu a 7–14 dní dopredu.
- `myslienka` a `otazka` píše Claude **vlastnými slovami** podľa zdrojov (cudzie texty sa nekopírujú, na celý text je odkaz v `zdroje`).
- Čítania sú podľa gréckokatolíckeho (byzantského) poriadku z casoslov.sk.
