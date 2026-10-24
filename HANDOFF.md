# Odovzdanie – stav k 24. 10. 2026 (večer)

## Hotové
- Fáza 1 (nasadená na GitHub Pages): kostra, prihlásenie, OneDrive + offline + zlúčenie, Intencie Sopkovce, Farský list, Nastavenia, NAVOD.md.
- **Rozloženie na 320 px** overené v prehliadači (ukážkový režim) a opravené: riadok intencie (text na celý riadok), karta témy (lišta v jednom riadku, akcie 3 v rade), nadpis v lište, prepínač vzhľadu „Automaticky“.
- **Ukážkový režim** `?ukazka` (len vývoj, v produkčnom builde nie je).
- **Pastorácia** (myšlienky): `pastoracia-myslienky.json`, hľadanie bez diakritiky, filter stavu a štítkov, Vložiť odkaz, `#/pastoracia/pridat?url=…`, kopírovanie.
- **Ľudia** (bez kalendára): `ludia.json`, „Na rade“ (pripomienky + pravidelný kontakt každých N dní), Zavolať/Napísať, „Ozval som sa“, číslo na dlaždici Domov (dnes + zmeškané).
- SCHEMA.md, NAVOD.md (druhá Skratka „Do myšlienok“) a vault (`Aplikácia – Pastorácia.md`) aktualizované. 126 testov, build OK.
- **Nič z tohto ešte nie je pushnuté** – čaká na Michalov súhlas.

## Čaká na Michala
- Súhlas s `git push` (nasadí Pastoráciu a Ľudí).
- Testovací zoznam na iPhone (posledná správa v konverzácii z 24. 10. večer): fáza 1 + nové dlaždice.
- Rozhodnutie o kalendári pre Ľudí: Outlook (Graph, rovnaké prihlásenie, treba pridať oprávnenie `Calendars.ReadWrite`) alebo Google.

## Neoverené / riziká
- Ťahanie tém prstom na iPhone, prihlásenie v PWA z plochy, Skratky.
- Malé čipy štítkov v karte myšlienky majú výšku ~32 px (menej ako 48 px) – ak sa zle trafujú, zväčšiť.
- Strážca dĺžky konverzácie (hook) – overiť, že sa spúšťa.

## Ďalšie kroky
1. Opraviť, čo Michal nájde pri testovaní.
2. Skratky „Do Pastorácie“ / „Do myšlienok“ (NAVOD.md, časť 4).
3. Kalendár k Ľuďom (`src/calendar/types.ts`, pole `idKalendara` v `ludia.json` je pripravené).
4. Knihy (zamyslenie dňa) – treba s Michalom dohodnúť, odkiaľ brať texty (PDF v OneDrive / web).
