# Odovzdanie – stav k 24. 10. 2026 (neskoro večer)

## Hotové
- Fáza 1, Pastorácia (myšlienky), Ľudia, rozloženie na 320 px, ukážkový režim `?ukazka` – **pushnuté a nasadené** (commit c83f1d0).
- **Kalendár Outlook pre Ľudí** (pushnuté, commit d4d44c0):
  - `src/calendar/`: `outlook.ts` (Graph, skryté vlastnosti PastoraciaZdroj/Pripomienka/Podpis), `zosulad.ts` (čo vytvoriť/upraviť/zmazať), `synchronizacia.ts` (jeden beh naraz, zapnutie v zariadení cez localStorage `pastoracia.kalendar`), `pamatovy.ts` (testy, ukážka).
  - `modules/ludia/model/kalendar.ts` (pripomienky → udalosti), `KalendarLudi.tsx` (prenos 1,5 s po zmene + riadok stavu), Nastavenia → „Pripojiť kalendár Outlook“.
  - `prihlasenie.ts`: `SCOPES_KALENDAR`, `ziskajTokenKalendara`, `pripojKalendar()` (presmerovanie); chyba pri návrate (napr. zamietnutý súhlas) už nezhodí aplikáciu → `chybaPresmerovania` v Nastaveniach.
  - `idKalendara` v `ludia.json` ostáva `""` (SCHEMA.md vysvetľuje prečo). NAVOD.md časť 5, vault aktualizovaný. 135 testov, build OK.

## Čaká na Michala
- Pridať v Azure oprávnenie `Calendars.ReadWrite` (NAVOD.md 5.1) – urobí Michal sám v portáli.
- Test na iPhone: Nastavenia → Pripojiť kalendár → Ľudia → pripomienka → je v Outlooku?
- Texty pre Knihy – dodá Michal.

## Neoverené / riziká
- Graph `$filter` na skryté vlastnosti nad `/me/events` – overené len testami s falošnou odpoveďou, nie proti skutočnému Outlooku.
- Tenant grkatpo.sk môže vyžadovať súhlas správcu pre Calendars.ReadWrite.
- Ťahanie tém prstom na iPhone, Skratky, čipy štítkov ~32 px.

## Ďalšie kroky
1. Opraviť, čo Michal nájde pri testovaní (aj kalendár).
2. Knihy (zamyslenie dňa) – podľa textov od Michala.
3. Skratky „Do Pastorácie“ / „Do myšlienok“ (NAVOD.md, časť 4).
