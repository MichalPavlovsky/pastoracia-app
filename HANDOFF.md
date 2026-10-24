# Odovzdanie â€“ stav k 24. 10. 2026 (veÄŤer)

## HotovĂ© a nasadenĂ©
- FĂˇza 1, PastorĂˇcia, Ä˝udia, FarskĂ˝ list, ukĂˇĹľkovĂ˝ reĹľim `?ukazka`, đź“… `.ics` do kalendĂˇra (Outlook cez Graph vypnutĂ˝).
- FarskĂ˝ list: tĂ©ma sa dĂˇ ĹĄahaĹĄ aj do inĂ©ho tĂ˝ĹľdĹa (jeden `DndContext` vo `FarskyList.tsx`, `presunTemuNa` v `model/temy.ts`) â€“ pushnutĂ©.
- OverenĂ© Michalom na iPhone: prihlĂˇsenie, skratky Do PastorĂˇcie a Do Ä˝udĂ­, ĹˇtĂ­tky, đź“… z ikony na ploche, offline, odznak na dlaĹľdici Ä˝udia (rĂˇta len dnes + zmeĹˇkanĂ© â€“ tak je to sprĂˇvne).

## Modul Knihy (zamyslenie dĹa) â€“ nasadenĂ˝, knihy.json v OneDrive
- KĂłd: `src/modules/knihy/` (`model/knihy.ts` + testy, `data.ts`, `Knihy.tsx`, `Odznak.tsx`, `knihy.css`), ukĂˇĹľkovĂ© knihy v `src/app/ukazka.ts`. OverenĂ© v `?ukazka` na 320 px.
- Rozhodnutia: Ăşryvky ~2 min, jedna kniha naraz, aktĂ­vne 3 knihy; ÄŤeskĂ© ostĂˇvajĂş po ÄŤesky. RebrĂ­ÄŤek + aktuĂˇlny stav: vault `10 Projekty/Knihy â€“ rebrĂ­ÄŤek.md`.
- DĂˇta: `.knihy-praca/knihy.json` (346 Ăşryvkov: MilovaĹĄ a ctiĹĄ 37 â†’ PÄ›t jazykĹŻ lĂˇsky 113 â†’ Nasledovanie Krista 196), OCR iniciĂˇly a Ĺˇum v 5 jazykoch opravenĂ©. PDF 5 jazykov je neĂşplnĂ© (konÄŤĂ­ s. 102 uprostred poslednej kapitoly) â€“ poslednĂ˝ Ăşryvok skrĂˇtenĂ˝ na celĂş vetu.
- NĂˇstroje: `nastroje/knihy_ocr.py`, `nastroje/knihy_uryvky.py` (Tesseract, PyMuPDF v Pythone 3.12).

## NovĂ© (25. 10. 2026)
- **Farby:** Nastavenia â†’ 6 liturgickĂ˝ch farieb (`data-farba` na `<html>`, `src/ui/tema.ts`, CSS v `zaklad.css`), uloĹľenĂ© v zariadenĂ­.
- **PDF vo Farskom liste:** `prilohy` pri tĂ©me aj tĂ˝Ĺľdni (SCHEMA.md), nahrĂˇvanie `onedrive.nahrajPrilohu` do `/Pastoracia-app/prilohy/<pondelok>/`, UI `temy/PrilohyPdf.tsx`. Skill fl (vault `AIOS/Skills/farsky-list.md`) z nich vytiahne text.
- **Zamyslenia z webu:** `zamyslenia-web.json` (pĂ­Ĺˇe len Claude), karta â€žDnes v liturgiiâ€ś v KnihĂˇch (`ZamyslenieWeb.tsx`, `model/zamyslenia.ts`). Postup: vault `AIOS/Skills/zamyslenia-web.md`; naplĂˇnovanĂˇ Ăşloha `zamyslenia-web` (nedeÄľa 19:00, beĹľĂ­ len pri otvorenej aplikĂˇcii Claude). Zdroje: casoslov.sk (byzantskĂ© ÄŤĂ­tania) + opusdei.org/sk-sk/gospel (komentĂˇr). MyĹˇlienky vlastnĂ˝mi slovami, nie kopĂ­rovanĂ©.

## ÄŽalĹˇie kroky
1. ~~Test na iPhone (Knihy, farby, PDF, Dnes v liturgii) a ruÄŤnĂ˝ beh `zamyslenia-web`~~ â€“ overenĂ© Michalom 24. 10.
2. Pri â€žTreba naÄŤĂ­taĹĄ novĂ© knihyâ€ś: spracovaĹĄ ÄŹalĹˇie 2 z rebrĂ­ÄŤka.
3. ~~â€žCannot update a component while renderingâ€ś pri `StavBodka`~~ â€“ opravenĂ© (`Uloziste.subor` oznamuje stav cez `queueMicrotask`), commit lokĂˇlne, ÄŤakĂˇ na push.
