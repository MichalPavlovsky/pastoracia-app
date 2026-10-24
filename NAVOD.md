# Návod – Pastorácia

Aplikácia: **https://michalpavlovsky.github.io/pastoracia-app/**
Dáta: `C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\Pastoracia-app\data\` (formát v `SCHEMA.md`)

## 1. Spustenie na PC (vývoj)

Prvýkrát:

1. Nainštaluj knižnice: `npm install`
2. Skopíruj `.env.example` ako `.env.local` a doplň Client ID a povolené adresy (`.env.local` sa nikdy necommituje).

Potom vždy:

```
npm run dev
```

Otvor **http://localhost:5174/** (port 5173 používa aplikácia Prípravy). Zmeny v kóde sa ukážu samé.

Testy: `npm test` · kontrola a build: `npm run build`

## 2. Nasadenie na GitHub Pages

### Raz na začiatku

1. **Repozitár:** github.com → **+** → **New repository** → názov `pastoracia-app`, **Public** (GitHub Pages zadarmo funguje len pre verejné repozitáre), nič nezaškrtávaj (bez README) → **Create repository**.
2. **Premenné pre build:** v repozitári **Settings → Secrets and variables → Actions → záložka Variables → New repository variable**:
   - `VITE_MSAL_CLIENT_ID` = Client ID z Azure
   - `VITE_POVOLENE_ADRESY` = `michal.pavlovsky@grkatpo.sk` (viac adries oddeľ čiarkou)
3. **Pages:** **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Azure:** v App registration „Pastorácia“ → **Authentication → Single-page application** musí byť adresa `https://michalpavlovsky.github.io/pastoracia-app/` (s lomkou na konci).
5. Prepojenie a prvé odoslanie (z priečinka projektu):

```
git remote add origin https://github.com/MichalPavlovsky/pastoracia-app.git
git push -u origin main
```

### Každá ďalšia verzia

`git push` – GitHub sám spustí testy, zostaví aplikáciu a o 1–2 minúty je nová verzia online (priebeh: záložka **Actions** v repozitári). Aplikácia v telefóne sa aktualizuje pri ďalšom otvorení.

Pozn.: Client ID a povolené adresy sú vo výslednej stránke čitateľné (tak to pri webových aplikáciách funguje). Nie sú to heslá – prístup k dátam má len ten, kto sa prihlási svojím účtom a je v zozname.

## 3. Pridanie na plochu

**iPhone (Safari):** otvor adresu aplikácie → tlačidlo **Zdieľať** (štvorček so šípkou) → **Pridať na plochu** → **Pridať**. Spúšťaj ju potom z ikony na ploche a prihlás sa v nej raz.

**Android (Chrome):** otvor adresu → ponuka **⋮** → **Pridať na plochu / Inštalovať aplikáciu**. Potom sa „Pastorácia“ objaví aj v ponuke **Zdieľať** – odkaz pôjde rovno do Farského listu.

**PC (Chrome/Edge):** v adresnom riadku ikona **Inštalovať**.

## 4. iPhone: Skratka „Do Pastorácie“ (zdieľanie odkazu do Farského listu)

iPhone nedovolí webovej aplikácii objaviť sa v ponuke Zdieľať. Pomôže Skratka:

1. Otvor aplikáciu **Skratky** → **+** (nová skratka) → hore pomenuj **Do Pastorácie**.
2. Ťukni na **ⓘ** (alebo šípku pri názve) → zapni **Zobraziť v hárku Zdieľať** → **Hotovo**.
3. Pri „Prijímať … z hárku Zdieľať“ nechaj **URL** a **Text** (ostatné môžeš vypnúť).
4. Pridaj akciu **Kódovať URL** (Encode URL) – vstup: **Vstup skratky**.
5. Pridaj akciu **Text** a napíš do nej
   `https://michalpavlovsky.github.io/pastoracia-app/#/farsky-list/pridat?url=`
   a hneď za to (bez medzery) vlož premennú **Kódovaný text** (ťukni nad klávesnicou na „Kódované URL“).
6. Pridaj akciu **Otvoriť URL** – vstup: **Text** z predchádzajúceho kroku.
7. Hotovo. V Safari: **Zdieľať → Do Pastorácie** → otvorí sa nová téma s vyplneným odkazom; doplň názov a ulož.

Skratka otvára aplikáciu v Safari (nie ikonu z plochy) – prvýkrát sa v Safari prihlás. Dáta sú v OneDrive, takže všade vidíš to isté.

Bez skratky: skopíruj odkaz a v aplikácii **Farský list → Vložiť odkaz**.

## 5. Keď niečo nejde

| Príznak | Riešenie |
|---|---|
| Červená bodka v hornej lište | Ťukni na ňu → Nastavenia ukážu presnú chybu. |
| „Treba sa znova prihlásiť“ | Tlačidlo **Prihlásiť sa znova** v Nastaveniach. |
| Oranžová bodka | Zmena je v telefóne, odošle sa po pripojení k internetu. |
| „Treba potvrdiť zlúčenie“ | To isté sa zmenilo aj na inom zariadení – v Nastaveniach vyber **Potvrdiť zlúčenie** alebo **Ponechať verziu z iného zariadenia**. |
| AADSTS50011 pri prihlásení | V Azure chýba presná adresa (bod 2.4). |
| Na GitHub Pages biela stránka / chyba konfigurácie | Chýbajú premenné z bodu 2.2 → doplň ich a v **Actions** spusti nasadenie znova (**Run workflow**). |
