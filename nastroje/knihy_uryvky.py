# Z OCR strán (strana-NNN.txt) urobí knihu pre knihy.json: úryvky ~2 min čítania (SCHEMA.md).
# Kapitola = živé záhlavie strany („— Názov —“, okrem názvu knihy) alebo riadok po „KAPITOLA …“.
# Posledný riadok strany (päta s číslom) sa zahodí; číslo strany = strana PDF + posun.
# python -X utf8 nastroje/knihy_uryvky.py ocr/ vystup.json id "Názov" "Autor" "zdroj" [od] [do] [posun] ["záhlavie knihy"]

import difflib
import json
import re
import sys
from pathlib import Path

MIN_SLOV, MAX_SLOV = 220, 320
ZAHLAVIE = re.compile(r'^[—–-]+\s*(.+?)\s*[—–-]+$')
DOCASNY = '§'
KONIEC_VETY = re.compile(r'[.!?…“”"»)]$')


def slov(t: str) -> int:
    return len(t.split())


def odseky_strany(text: str, hlavicka_knihy: str) -> tuple[str | None, list[str]]:
    riadky = [r.rstrip() for r in text.splitlines()]
    while riadky and not riadky[0].strip():
        riadky.pop(0)
    while riadky and not riadky[-1].strip():
        riadky.pop()
    kapitola = None
    if riadky and (m := ZAHLAVIE.match(riadky[0].strip().replace('—>', '—'))):
        if difflib.SequenceMatcher(None, m.group(1).lower(), hlavicka_knihy.lower()).ratio() < 0.75:
            kapitola = m.group(1)
        riadky.pop(0)
    elif riadky and riadky[0].strip().upper().startswith('KAPITOLA'):
        riadky.pop(0)
        nazov = []
        while riadky and not riadky[0].strip():
            riadky.pop(0)
        while riadky and riadky[0].strip():
            nazov.append(riadky.pop(0).strip())
        # ozdobný nadpis OCR číta zle – premenuje ho záhlavie ďalšej strany
        kapitola = DOCASNY + ' '.join(nazov)
    if riadky and len(riadky[-1].strip()) <= 8:
        riadky.pop()
    odseky, aktualny = [], []
    for r in riadky + ['']:
        s = r.strip()
        if s == '' or (len(s) <= 2 and not s.isalpha()):
            if aktualny:
                odseky.append(aktualny)
            aktualny = []
            continue
        aktualny.append(s)
    # OCR okolo iniciály trhá odseky – spoj, ak veta pokračuje malým písmenom
    spojene: list[list[str]] = []
    for o in odseky:
        if spojene and not KONIEC_VETY.search(spojene[-1][-1]) and o[0][:1].islower():
            spojene[-1].extend(o)
        else:
            spojene.append(o)
    vysledok = []
    for o in spojene:
        t = ''
        for r in o:
            if t.endswith('-') and r[:1].islower():
                t = t[:-1] + r
            else:
                t = f'{t} {r}' if t else r
        vysledok.append(t)
    return kapitola, vysledok


def rozdel_dlhy(odsek: str) -> list[str]:
    vety = re.split(r'(?<=[.!?…])\s+', odsek)
    casti, aktualna = [], ''
    for v in vety:
        if aktualna and slov(aktualna) + slov(v) > MAX_SLOV:
            casti.append(aktualna)
            aktualna = v
        else:
            aktualna = f'{aktualna} {v}' if aktualna else v
    if aktualna:
        casti.append(aktualna)
    return casti


def main() -> None:
    priecinok, vystup, id_knihy, nazov, autor, zdroj = sys.argv[1:7]
    strany = sorted(Path(priecinok).glob('strana-*.txt'))
    od = int(sys.argv[7]) if len(sys.argv) > 7 else 1
    do = int(sys.argv[8]) if len(sys.argv) > 8 else len(strany)
    posun = int(sys.argv[9]) if len(sys.argv) > 9 else 0
    hlavicka = sys.argv[10] if len(sys.argv) > 10 else nazov

    # (kapitola, miesto, odsek)
    polozky: list[list[str]] = []
    kapitola = ''
    for subor in strany[od - 1 : do]:
        k, odseky = odseky_strany(subor.read_text(encoding='utf-8'), hlavicka)
        if k and not k.startswith(DOCASNY) and kapitola.startswith(DOCASNY):
            for p in polozky:
                if p[0] == kapitola:
                    p[0] = k
        kapitola = k or kapitola
        miesto = f's. {int(subor.stem[-3:]) + posun}'
        for i, o in enumerate(odseky):
            # pokračovanie odseku z predošlej strany
            if i == 0 and polozky and polozky[-1][0] == kapitola and not KONIEC_VETY.search(polozky[-1][2]) and o[:1].islower():
                p = polozky[-1][2]
                polozky[-1][2] = p[:-1] + o if p.endswith('-') else f'{p} {o}'
                continue
            polozky.append([kapitola, miesto, o])

    # úryvky po kapitolách
    uryvky: list[dict] = []
    def pridaj(kap: str, miesto: str, odseky: list[str]) -> None:
        uryvky.append({'kapitola': kap, 'miesto': miesto, 'text': '\n\n'.join(odseky)})

    aktualne: list[str] = []
    zaciatok = ''
    for i, (kap, miesto, o) in enumerate(polozky):
        nova_kapitola = i > 0 and kap != polozky[i - 1][0]
        if aktualne and (nova_kapitola or (slov('\n'.join(aktualne)) >= MIN_SLOV * 0.8 and slov('\n'.join(aktualne)) + slov(o) > MAX_SLOV)):
            pridaj(polozky[i - 1][0], zaciatok, aktualne)
            aktualne = []
        for cast in rozdel_dlhy(o) if slov(o) > MAX_SLOV else [o]:
            if not aktualne:
                zaciatok = miesto
            elif slov('\n'.join(aktualne)) + slov(cast) > MAX_SLOV:
                pridaj(kap, zaciatok, aktualne)
                aktualne, zaciatok = [], miesto
            aktualne.append(cast)
    if aktualne:
        pridaj(polozky[-1][0], zaciatok, aktualne)

    # krátky koniec kapitoly pripoj k predošlému úryvku
    zlucene: list[dict] = []
    for u in uryvky:
        if zlucene and zlucene[-1]['kapitola'] == u['kapitola'] and slov(u['text']) < 120:
            zlucene[-1]['text'] += '\n\n' + u['text']
        else:
            zlucene.append(u)

    pocty: dict[str, int] = {}
    for u in zlucene:
        pocty[u['kapitola']] = pocty.get(u['kapitola'], 0) + 1
    poradie: dict[str, int] = {}
    kniha = {'id': id_knihy, 'nazov': nazov, 'autor': autor, 'zdroj': zdroj, 'uryvky': []}
    for n, u in enumerate(zlucene, 1):
        kap = u['kapitola'].lstrip(DOCASNY) or nazov
        poradie[kap] = poradie.get(kap, 0) + 1
        nadpis = f'{kap} ({poradie[kap]})' if pocty[u['kapitola']] > 1 else kap
        kniha['uryvky'].append({'id': f'{id_knihy}-{n:03}', 'nadpis': nadpis, 'miesto': u['miesto'], 'text': u['text']})

    Path(vystup).write_text(json.dumps(kniha, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    dlzky = [slov(u['text']) for u in kniha['uryvky']]
    print(f'{len(dlzky)} úryvkov, priemer {sum(dlzky) // len(dlzky)}, min {min(dlzky)}, max {max(dlzky)}')


if __name__ == '__main__':
    main()
