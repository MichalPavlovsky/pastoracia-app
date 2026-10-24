# Pastorácia – pokyny pre Claude

PWA pre gréckokatolíckeho kňaza Michala (farnosť Humenné – Pod Sokolejom, filiálka Sopkovce). Michal je programátor samouk: odpovedaj **stručne a po slovensky**, celé UI je v slovenčine. Používa **iPhone**.

## Ako pracovať
- Rob viac krokov za sebou sám a na konci daj **jeden zoznam, čo otestovať** (viac dlaždíc naraz). Na „áno“ pred každým krokom nečakaj.
- **Pred `git push` a pred každou zmenou navonok (GitHub, Azure) sa opýtaj.**
- Prácu deľ podľa náročnosti: mechanické veci → subagent Haiku, bežné UI → Sonnet, logika (dáta, synchronizácia, formát), kontrola a commit → ty. Agentom daj nekolidujúce súbory a podrobné zadanie, výsledok vždy skontroluj (testy, build, prečítanie kódu).
- Tajomstvá necommituj (`.env.local` je v `.gitignore`).
- Pri dlhej konverzácii (pripomienka `[kontext-strazca]`) postupuj podľa skillu `odovzdanie`: aktualizuj `HANDOFF.md` a navrhni `/clear` alebo `/compact`.

## Príkazy
- `npm run dev` → http://localhost:5174/ (port 5173 obsadzuje Michalova iná aplikácia „Prípravy“, nevypínaj ju). Často už beží – v prehliadači použi `http://[::1]:5174/`.
- `http://[::1]:5174/?ukazka` – ukážkový režim bez prihlásenia, dáta len v pamäti (len vo vývoji, `src/app/ukazka.ts`); na kontrolu obrazoviek na 320 px. CSS modulov sa načíta pred `zaklad.css` → pri prepise základných tried treba vyššiu špecifickosť.
- `npm test` (vitest) · `npm run build` (tsc + vite) · `npm run ikony` (PNG ikony z `public/icon.svg`)
- Nasadenie: push do `main` → GitHub Actions → https://michalpavlovsky.github.io/pastoracia-app/ (repo `MichalPavlovsky/pastoracia-app`, premenné `VITE_MSAL_CLIENT_ID`, `VITE_POVOLENE_ADRESY` v Actions → Variables)

## Technológie
React 19 + Vite 8 + TypeScript 7 (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), vite-plugin-pwa, vlastné CSS (mobile first, premenné v `src/ui/zaklad.css`, svetlý/tmavý režim), @azure/msal-browser, @dnd-kit. Žiadny server.

Štýl kódu: jednoduché úvodzovky, bez bodkočiarok, 2 medzery, identifikátory po slovensky bez diakritiky, komentáre po slovensky a skúpo. Dotykové prvky ≥ 48 px, vstupy ≥ 16 px, nikdy `alert/confirm/prompt`.

## Štruktúra
- `src/moduly.ts` – zoznam dlaždíc (nový modul = priečinok v `src/modules/` + jeden záznam)
- `src/modules/intencie-sopkovce/` – kalendár, týždeň, formulár dňa, `model/intencie.ts`
- `src/modules/farsky-list/` – plán tém, `model/temy.ts`, UI v `temy/`
- `src/modules/pastoracia/` – myšlienky, `model/myslienky.ts`
- `src/modules/ludia/` – komu sa ozvať, „Na rade“, pripomienky → 📅 .ics do kalendára v telefóne, `#/ludia/pridat?text=meno
číslo` (Skratka „Do Ľudí“), `model/ludia.ts`, `model/kalendar.ts`, odznak na dlaždici
- `src/modules/knihy/` – zatiaľ „Pripravujeme“ + `types.ts`
- `src/storage/` – OneDrive cez Graph (eTag/If-Match), IndexedDB, offline fronta, trojcestné zlúčenie konfliktov; modul opíše súbor cez `DefiniciaSuboru`
- `src/auth/prihlasenie.ts` – MSAL, presmerovanie, authority `common`, `responseMode: query` (hash používa smerovanie)
- `src/app/smerovanie.ts` – router nad `#hash`; `src/shell/` – lišta, Domov, Nastavenia
- `src/calendar/` – `ics.ts` (používa sa); Outlook cez Graph je **vypnutý** (`config.kalendarOutlook`, tenant chce súhlas správcu) – (`outlook.ts`), `zosulad.ts`, `synchronizacia.ts` (zapína sa v zariadení, localStorage `pastoracia.kalendar`)

## Dáta – formát dodrž presne
- Záväzný popis: **`SCHEMA.md`**. Súbory číta aj skill `fl` (Farský list) – len číta.
- OneDrive **pracovného** účtu michal.pavlovsky@grkatpo.sk, `/Pastoracia-app/data/`; na PC `C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\Pastoracia-app\data\` (nie osobný `C:\Users\MIchalPC\OneDrive`).
- Pri zmene formátu alebo cesty uprav aj Michalov vault: `C:\Users\MIchalPC\Desktop\Claude_vault\10 Projekty\Aplikácia – Pastorácia.md` a `AIOS\Skills\farsky-list.md`.

## Azure
App registration „Pastorácia“ v tenante grkatpo.sk, osobné aj organizačné účty, SPA. Redirect URI: `http://localhost:5174/` a `https://michalpavlovsky.github.io/pastoracia-app/`. Oprávnenia: Files.ReadWrite, offline_access, Calendars.ReadWrite (pýta sa zvlášť, `SCOPES_KALENDAR`).

Aktuálny stav a ďalšie kroky: `HANDOFF.md`.
