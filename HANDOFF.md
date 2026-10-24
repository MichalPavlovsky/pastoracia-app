# Odovzdanie – stav k 24. 10. 2026 (večer)

## Hotové a nasadené
- Fáza 1, Pastorácia, Ľudia, Farský list, ukážkový režim `?ukazka`, 📅 `.ics` do kalendára (Outlook cez Graph vypnutý).
- Farský list: téma sa dá ťahať aj do iného týždňa (jeden `DndContext` vo `FarskyList.tsx`, `presunTemuNa` v `model/temy.ts`) – pushnuté.
- Overené Michalom na iPhone: prihlásenie, skratky Do Pastorácie a Do Ľudí, štítky, 📅 z ikony na ploche, offline, odznak na dlaždici Ľudia (ráta len dnes + zmeškané – tak je to správne).

## Modul Knihy (zamyslenie dňa) – nasadený, knihy.json v OneDrive
- Kód: `src/modules/knihy/` (`model/knihy.ts` + testy, `data.ts`, `Knihy.tsx`, `Odznak.tsx`, `knihy.css`), ukážkové knihy v `src/app/ukazka.ts`. Overené v `?ukazka` na 320 px.
- Rozhodnutia: úryvky ~2 min, jedna kniha naraz, aktívne 3 knihy; české ostávajú po česky. Rebríček + aktuálny stav: vault `10 Projekty/Knihy – rebríček.md`.
- Dáta: `.knihy-praca/knihy.json` (346 úryvkov: Milovať a ctiť 37 → Pět jazyků lásky 113 → Nasledovanie Krista 196), OCR iniciály a šum v 5 jazykoch opravené. PDF 5 jazykov je neúplné (končí s. 102 uprostred poslednej kapitoly) – posledný úryvok skrátený na celú vetu.
- Nástroje: `nastroje/knihy_ocr.py`, `nastroje/knihy_uryvky.py` (Tesseract, PyMuPDF v Pythone 3.12).

## Nové (25. 10. 2026)
- **Farby:** Nastavenia → 6 liturgických farieb (`data-farba` na `<html>`, `src/ui/tema.ts`, CSS v `zaklad.css`), uložené v zariadení.
- **PDF vo Farskom liste:** `prilohy` pri téme aj týždni (SCHEMA.md), nahrávanie `onedrive.nahrajPrilohu` do `/Pastoracia-app/prilohy/<pondelok>/`, UI `temy/PrilohyPdf.tsx`. Skill fl (vault `AIOS/Skills/farsky-list.md`) z nich vytiahne text.
- **Zamyslenia z webu:** `zamyslenia-web.json` (píše len Claude), karta „Dnes v liturgii“ v Knihách (`ZamyslenieWeb.tsx`, `model/zamyslenia.ts`). Postup: vault `AIOS/Skills/zamyslenia-web.md`; naplánovaná úloha `zamyslenia-web` (nedeľa 19:00, beží len pri otvorenej aplikácii Claude). Zdroje: casoslov.sk (byzantské čítania) + opusdei.org/sk-sk/gospel (komentár). Myšlienky vlastnými slovami, nie kopírované.
- **Knihy – záložky „Knihy | Z webu“** (výber v localStorage `pastoracia.knihy.zalozka`). `zamyslenia-web.json` prvýkrát naplnený ručne 24.–31. 10. z casoslov.sk. Overené Michalom na iPhone.
- **Z webu – viac obsahu:** pole `texty` (evanjelium na rozkliknutie, rámček s casoslov.sk) a `dalsie` (Otcovia – catenaaurea.sk, komentár – Opus Dei, nedeľa – inky.sk), SCHEMA.md. Obnovovanie: `nastroje/zamyslenia-web.ps1` (claude -p, Sonnet) cez Plánovač úloh Windows každý večer 20:00, 14 dní dopredu; záznam `Pastoracia-app/zamyslenia-web.log` v OneDrive. Stará úloha v aplikácii Claude vypnutá.

## Ďalšie kroky
1. ~~Test na iPhone (Knihy, farby, PDF, Dnes v liturgii) a ručný beh `zamyslenia-web`~~ – overené Michalom 24. 10.
2. ~~„Cannot update a component while rendering“ pri `StavBodka`~~ – opravené (`Uloziste.subor` oznamuje stav cez `queueMicrotask`), pushnuté.
3. Pri „Treba načítať nové knihy“: spracovať ďalšie 2 z rebríčka.
