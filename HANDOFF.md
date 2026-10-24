# Odovzdanie – stav k 24. 10. 2026 (večer)

## Hotové a nasadené
- Fáza 1, Pastorácia, Ľudia, Farský list, ukážkový režim `?ukazka`, 📅 `.ics` do kalendára (Outlook cez Graph vypnutý).
- Farský list: téma sa dá ťahať aj do iného týždňa (jeden `DndContext` vo `FarskyList.tsx`, `presunTemuNa` v `model/temy.ts`) – pushnuté.
- Overené Michalom na iPhone: prihlásenie, skratky Do Pastorácie a Do Ľudí, štítky, 📅 z ikony na ploche, offline, odznak na dlaždici Ľudia (ráta len dnes + zmeškané – tak je to správne).

## Modul Knihy (zamyslenie dňa) – hotový lokálne, nepushnutý
- Kód: `src/modules/knihy/` (`model/knihy.ts` + testy, `data.ts`, `Knihy.tsx`, `Odznak.tsx`, `knihy.css`), ukážkové knihy v `src/app/ukazka.ts`. Overené v `?ukazka` na 320 px.
- Rozhodnutia: úryvky ~2 min, jedna kniha naraz, aktívne 3 knihy; české ostávajú po česky. Rebríček + aktuálny stav: vault `10 Projekty/Knihy – rebríček.md`.
- Dáta: `.knihy-praca/knihy.json` (346 úryvkov: Milovať a ctiť 37 → Pět jazyků lásky 113 → Nasledovanie Krista 196), OCR iniciály a šum v 5 jazykoch opravené. PDF 5 jazykov je neúplné (končí s. 102 uprostred poslednej kapitoly) – posledný úryvok skrátený na celú vetu.
- Nástroje: `nastroje/knihy_ocr.py`, `nastroje/knihy_uryvky.py` (Tesseract, PyMuPDF v Pythone 3.12).

## Ďalšie kroky
1. **Opýtať sa:** skopírovať `.knihy-praca/knihy.json` do OneDrive `Pastoracia-app/data/` a pushnúť.
2. Michal na iPhone: Knihy (úryvok, Prečítané ✓, Zrušiť, ⭐, Obľúbené, odznak na dlaždici, druhé zariadenie) + zvyšok testov (Intencie).
3. Keď app ukáže „Treba načítať nové knihy“: opýtať sa a spracovať ďalšie 2 z rebríčka (dočítané knihy z `knihy.json` odstrániť), aktualizovať stav v rebríčku.
4. Drobnosť: v konzole „Cannot update a component while rendering“ pri `OdznakLudi`/`StavBodka` (existovalo už pred Knihami).
