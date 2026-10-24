# Odovzdanie – stav k 24. 10. 2026 (noc)

## Hotové a nasadené
- Fáza 1, Pastorácia (myšlienky), Ľudia, rozloženie 320 px, ukážkový režim `?ukazka`.
- Opravy po teste na iPhone: Client ID z GitHub premennej sa berie ako čisté GUID (premenná mala `\r\n`); PWA sa po novej verzii sama obnoví (`registerSW` v `main.tsx`, kontrola aj pri návrate do aplikácie); pole dátumu/času na iPhone nevytŕča (`zaklad.css`).
- **Kalendár:** Outlook (Graph, `src/calendar/outlook.ts`, `synchronizacia.ts`) je hotový, ale **vypnutý** (`config.kalendarOutlook = false`) – tenant grkatpo.sk chce na `Calendars.ReadWrite` súhlas správcu a Michal ho nechce žiadať. Pri štarte sa v zariadení vypne. Namiesto toho tlačidlo 📅 pri pripomienke → `.ics` (`src/calendar/ics.ts`) → iPhone „Pridať do kalendára“.
- **Skratka „Do Ľudí“:** `#/ludia/pridat?text=meno\nčíslo` (alebo `?meno=&kontakt=`) otvorí predvyplneného nového človeka (NAVOD.md, časť 4).
- Overené Michalom: prihlásenie, skratka Do Pastorácie, štítky (veľkosť OK).

## Čaká na Michala
- Test: 📅 z ikony na ploche (blob .ics – neoverené na iPhone), Skratka Do Ľudí, zvyšok testovacieho zoznamu (Intencie, témy ťahaním, Ľudia, offline).
- Texty pre Knihy.
- V Azure ostalo pridané oprávnenie `Calendars.ReadWrite` – neškodí, aplikácia ho nepýta.

## Ďalšie kroky
1. Opraviť, čo Michal nájde. Ak 📅 v PWA nefunguje → záloha: Skratka „Do kalendára“ (`shortcuts://run-shortcut?name=…&input=text&text=…`).
2. Knihy (zamyslenie dňa) – podľa textov od Michala.
