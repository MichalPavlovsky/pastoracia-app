# Odovzdanie – stav k 24. 10. 2026

## Hotové (fáza 1)
- Kostra, SCHEMA.md, dátový model s testami (103 testov).
- Storage: OneDrive (Graph, eTag), IndexedDB, offline, zlúčenie konfliktov s potvrdením.
- Prihlásenie Microsoft (MSAL) – overené na localhoste pracovným účtom, zápis do OneDrive funguje.
- Domov s 5 dlaždicami: **Intencie Sopkovce**, **Farský list** (témy), Pastorácia / Ľudia / Knihy („Pripravujeme“). Intencie a témy boli pôvodne jedna dlaždica – rozdelené na Michalovu žiadosť.
- Intencie Sopkovce: mesačný kalendár, Tento/Budúci týždeň, formulár dňa, rýchle voľby, ponuka spovede v týždni prvého piatku (nič nepridá samo), kopírovanie bohoslužby.
- Farský list: 8 týždňov + ďalší, témy (stav jedným klikom, ťahanie ⋮⋮ aj ▲▼, presun, mazanie), Vložiť odkaz zo schránky, prijatie odkazu cez `#/farsky-list/pridat?url=…`.
- Nastavenia: účet, priečinok OneDrive, stav synchronizácie, vzhľad, odhlásenie.
- Nasadené na GitHub Pages (beh Actions úspešný, stránka obsahuje správne premenné). NAVOD.md napísaný.
- Vault aktualizovaný (cesta k dátam, 5 dlaždíc); Cowork upravil nainštalovaný skill `farsky-list`, aby si vyžiadal priečinok s dátami.

## Čaká na Michala – testovací zoznam (na iPhone)
1. Pridať na plochu, prihlásenie na GitHub Pages (prvé ostré prihlásenie mimo localhostu).
2. Intencie: uložiť deň, ikonky v kalendári, ponuka spovede prvý piatok, týždenný pohľad „+Mária, Ján“, kopírovanie.
3. Farský list: nová téma, stav, **ťahanie prstom** (neoverené na dotyku), presun, Vložiť odkaz.
4. Synchronizácia PC ↔ telefón, súbory v OneDrive na PC, režim lietadlo (oranžová → zelená bodka).
5. Svetlý/tmavý režim.

## Neoverené / riziká
- Rozloženie na šírke 320–375 px (formulár dňa, kalendár, témy) – nikto ho nevidel na telefóne.
- Ťahanie tém na iPhone (dnd-kit TouchSensor, oneskorenie 200 ms).
- Prihlásenie v PWA z plochy na iPhone (presmerovanie MSAL v režime standalone).

## Ďalšie kroky
1. Opraviť, čo Michal nájde pri testovaní (dostaneš to stručne, napr. „3 ťahanie nejde“).
2. Prejsť s ním nastavenie Skratky „Do Pastorácie“ (NAVOD.md, časť 4) – sľúbené.
3. Fáza 2: modul **Ľudia** + kalendár (Outlook cez Graph alebo Google – rozhodnúť s Michalom). Typy v `src/modules/ludia/types.ts`, rozhranie v `src/calendar/types.ts`. Formát nového súboru doplniť do SCHEMA.md aj do vaultu.
4. Fáza 3: Knihy (zamyslenie dňa), fáza 4: Pastorácia (myšlienky).
