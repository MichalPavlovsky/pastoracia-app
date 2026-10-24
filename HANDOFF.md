# Odovzdanie – stav k 24. 10. 2026 (večer)

## Hotové a nasadené
- Fáza 1, Pastorácia, Ľudia, Farský list, ukážkový režim `?ukazka`, 📅 `.ics` do kalendára (Outlook cez Graph vypnutý).
- Farský list: téma sa dá ťahať aj do iného týždňa (jeden `DndContext` vo `FarskyList.tsx`, `presunTemuNa` v `model/temy.ts`) – pushnuté.
- Overené Michalom na iPhone: prihlásenie, skratky Do Pastorácie a Do Ľudí, štítky, 📅 z ikony na ploche, offline, odznak na dlaždici Ľudia (ráta len dnes + zmeškané – tak je to správne).

## Rozpracované: modul Knihy (zamyslenie dňa)
Rozhodnutia Michala:
- Úryvky ~2 min čítania, **jedna kniha naraz**, aktívne vždy **3 knihy**. Keď ostane posledná, aplikácia upozorní „Treba načítať nové knihy“; Claude sa opýta a spracuje ďalšie 2 z rebríčka.
- **České knihy ostávajú po česky** (celý preklad chránenej knihy nerobíme – agenti to odmietli).
- Rebríček 37 kníh: vault `C:\Users\MIchalPC\Desktop\Claude_vault\10 Projekty\Knihy – rebríček.md` (stĺpec stavu treba udržiavať). Zdroj kníh: OneDrive pracovného účtu `Knihy` (= `Knihy (1)`), `Materiály`.
- Formát dát je už v **`SCHEMA.md`**: `knihy.json` (píše len Claude, app len číta) a `knihy-stav.json` (píše app: `precitane`, `oblubene`).

Spracované knihy (JSON jednej knihy = prvok poľa `knihy` v `knihy.json`) – v `.knihy-praca/` v koreni projektu (v `.gitignore`):
1. `kniha-milovat-a-ctit.json` – 37 úryvkov (agent z textovej vrstvy PDF), skontrolované.
2. `kniha-5-jazykov-lasky.json` – 113 úryvkov, česky, OCR strán v `.knihy-praca/ocr-5-jazykov-lasky/` (strana PDF 1 = s. 6, kniha začína 1. kapitolou).
   **Treba opraviť ručne:** na začiatku 10 kapitol OCR stratilo ozdobnú iniciálu (úryvky 001, 007, 012, 023, 038, 059, 073, 087, 101, 108 – napr. „ark Twain“ → „Mark Twain“, „okud“ → „Pokud“, 007 začína „X*vo áska“). Pozri obrázok prvej strany kapitoly (PyMuPDF render) a doplň; v 023 je na začiatku zlepený nadpis kapitoly – odstrániť. 001 a 073 začínajú v strede vety – overiť, či niečo nechýba.
3. `kniha-nasledovanie-krista.json` – 196 úryvkov (agent; vydanie SSV, `Knihy/Knižky od Valiky II/Tomáš Kempenský - Nasledovanie Krista.pdf`), odseky delené agentom, 43 úryvkov pod 200 slov.

Nástroje: `nastroje/knihy_ocr.py` (sken PDF → `strana-NNN.txt`, Tesseract `C:\Program Files\Tesseract-OCR`, jazyky ces/slk v `%LOCALAPPDATA%\tessdata`), `nastroje/knihy_uryvky.py` (strany → úryvky podľa živého záhlavia kapitoly). Textové PDF: PyMuPDF / MarkItDown (nainštalované v Pythone 3.12).

## Ďalšie kroky
1. Skontrolovať všetky tri JSON (čítateľnosť OCR, nadpisy, dĺžky), spojiť do `knihy.json` v poradí: Milovať a ctiť → Pět jazyků lásky → Nasledovanie Krista. **Pred zápisom do OneDrive `Pastoracia-app/data/` sa opýtať.**
2. Modul Knihy v aplikácii (`src/modules/knihy/`, záznam v `src/moduly.ts`, nahradiť „Pripravujeme“):
   - `model/knihy.ts` – parsovanie/serializácia oboch súborov podľa SCHEMA.md, `dnesnyUryvok(knihy, stav, dnes)`, `treba nacitat` (neprečítané má len 1 kniha), zlúčenie stavu (zjednotenie), testy.
   - `data.ts` – `DefiniciaSuboru` pre oba súbory (knihy.json: `zluc` vráti verziu z OneDrive, app nezapisuje).
   - UI: dnešný úryvok (nadpis, kniha, miesto, text), „Prečítané ✓“, ⭐ obľúbené, postup v knihe, banner na nové knihy; dlaždica s odznakom, ak dnešný úryvok nie je prečítaný. Doplniť do `src/app/ukazka.ts`.
3. Zapísať stav kníh do rebríčka (aktívne 1–3).
4. Michal: zvyšok testov (Intencie).
