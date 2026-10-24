# Zamyslenia z webu: doplní zamyslenia-web.json na 14 dní dopredu (spúšťa Plánovač úloh cez zamyslenia-web.ps1).
#
# Python stiahne a spracuje stránky (casoslov.sk, catenaaurea.sk, opusdei.org, inky.sk), Claude iba napíše
# texty vlastnými slovami – Sonnet (myšlienka, otázka, Otcovia) a Haiku (komentár), bez nástrojov.
# Keď nič nechýba, Claude sa nevolá vôbec. Formát: SCHEMA.md, sekcia zamyslenia-web.json.
#
#   python zamyslenia_web.py            # doplní chýbajúce
#   python zamyslenia_web.py --bez-ai   # len časti bez AI (čítania, odkazy)
#   python zamyslenia_web.py --subor kopia.json   # skúška na inom súbore

import html
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

SUBOR = Path(r'C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\Pastoracia-app\data\zamyslenia-web.json')
CLAUDE = r'C:\Users\MIchalPC\.local\bin\claude.exe'
DNI_DOPREDU = 14
DNI_DOZADU = 7
# Opus Dei zverejňuje komentáre len pár dní dopredu – ďalej sa neoplatí skúšať
OPUS_DOPREDU = 4
MAX_VERSOV = 12
MAX_ZNAKOV = 7000
EVANJELISTI = ('Matúš', 'Marek', 'Lukáš', 'Ján')
KLUCE_DNA = ('datum', 'nazov', 'citania', 'svati', 'myslienka', 'otazka', 'zdroje', 'texty', 'dalsie')
KLUCE_DALSIEHO = ('druh', 'nazov', 'zdroj', 'text', 'url')

sys.stdout.reconfigure(encoding='utf-8')


def stiahni(url):
  """Vráti (stav, text). Pri chybe siete skúsi ešte dvakrát."""
  for pokus in range(3):
    try:
      poz = urllib.request.Request(url, headers={'User-Agent': 'pastoracia-app (osobne pouzitie)'})
      with urllib.request.urlopen(poz, timeout=30) as r:
        return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
      return e.code, ''
    except OSError:
      if pokus == 2:
        return 0, ''
      time.sleep(3)
  return 0, ''


def text_z_html(s):
  s = re.sub(r'<(script|style)\b.*?</\1>', '', s, flags=re.S)
  s = re.sub(r'<br\s*/?>|</p>|</div>|</h\d>|</li>|</tr>', '\n', s)
  s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
  riadky = [re.sub(r'\s+', ' ', r).strip() for r in s.split('\n')]
  return '\n'.join(r for r in riadky if r)


def jeden_riadok(s):
  return re.sub(r'\s+', ' ', text_z_html(s)).strip()


# ---------- casoslov.sk ----------

def casoslov_den(datum):
  stav, s = stiahni(f'https://casoslov.sk/?day={datum}')
  if stav != 200 or '<h4' not in s:
    return None
  h6 = re.search(r'<h6[^>]*>(.*?)</h6>', s, re.S)
  h4 = re.search(r'<h4[^>]*>(.*?)</h4>', s, re.S)
  h5 = re.search(r'<h5[^>]*>(.*?)</h5>', s, re.S)
  den = jeden_riadok(h6.group(1)).split(' ')[0] if h6 else ''
  hlavny = jeden_riadok(h4.group(1)) if h4 else ''
  svati = [] if not h5 else [jeden_riadok(c) for c in re.split(r'<br\s*/?>', h5.group(1))]
  svati = [x for x in svati if x and 'Stiahnite' not in x]
  nazov = hlavny if hlavny.startswith(den) or not den else f'{den} – {hlavny}'

  texty = []
  for zaciatok, odkaz, url in re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td><a href="([^"]+)"', s):
    zaciatok, odkaz = jeden_riadok(zaciatok), jeden_riadok(odkaz)
    if 'utierni' in zaciatok:
      continue
    druh = 'Evanjelium' if zaciatok.split(' ')[0] in EVANJELISTI else 'Apoštol'
    texty.append({'nazov': druh, 'odkaz': odkaz, 'url': 'https://casoslov.sk' + html.unescape(url)})
  return {
    'nazov': nazov,
    'citania': ' · '.join(t['odkaz'] for t in texty),
    'svati': '; '.join(svati),
    'texty': texty,
  }


def hlavne_evanjelium(den):
  return next((t for t in den['texty'] if t['nazov'] == 'Evanjelium'), None)


def text_citania(url):
  stav, s = stiahni(url)
  if stav != 200:
    return ''
  t = text_z_html(s)
  i = t.find('Čítanie zo svätého')
  return t[i:i + MAX_ZNAKOV] if i >= 0 else ''


# ---------- odkazy na Písmo ----------

def rozsah(odkaz):
  """'Lk 7, 1b-10' → ('Lk', 7, 1, 10). Pri prechode do ďalšej kapitoly berie zvyšok kapitoly (najviac MAX_VERSOV)."""
  m = re.match(r'^\s*(\d?\s?[A-Za-zÀ-ž]+)\s*(\d+)\s*,\s*(\d+)\w?(.*)$', odkaz)
  if not m:
    return None
  kniha, kap, od, zvysok = m.group(1).replace(' ', ''), int(m.group(2)), int(m.group(3)), m.group(4)
  if ',' in zvysok:
    do = od + MAX_VERSOV - 1
  else:
    cisla = [int(c) for c in re.findall(r'\d+', zvysok)]
    do = max(cisla + [od])
  return kniha, kap, od, min(do, od + MAX_VERSOV - 1)


# ---------- catenaaurea.sk ----------

def url_catena(kniha, kap, vers):
  return 'https://catenaaurea.sk/CommentedBibleTextsDirect.php?volba=' + urllib.parse.quote(f'{kniha} {kap},{vers}')


def catena(odkaz):
  """Komentáre Otcov k úryvku (verš po verši). Vráti (text, url) alebo (None, None)."""
  r = rozsah(odkaz)
  if not r:
    return None, None
  kniha, kap, od, do = r
  casti = []
  for vers in range(od, do + 1):
    stav, s = stiahni(url_catena(kniha, kap, vers))
    if stav != 200:
      continue
    riadky = text_z_html(s).split('\n')
    # 1. Catena aurea, 2. Kniha k, v, 3. text verša – zvyšok sú komentáre
    komentar = '\n'.join(riadky[3:]).strip()
    if komentar:
      casti.append(f'[{kniha} {kap},{vers}]\n{komentar}')
    if sum(len(c) for c in casti) > MAX_ZNAKOV:
      break
  if not casti:
    return None, None
  return '\n\n'.join(casti)[:MAX_ZNAKOV], url_catena(kniha, kap, od)


# ---------- opusdei.org ----------

def opus_dei(datum):
  """Vráti (odkaz evanjelia, text) alebo (None, None), ak komentár ešte nie je."""
  url = f'https://opusdei.org/sk-sk/gospel/{datum}/'
  stav, s = stiahni(url)
  m = re.search(r'<article[^>]*>(.*?)</article>', s, re.S) if stav == 200 else None
  if not m:
    return None, None
  t = text_z_html(m.group(1))
  ev = re.search(r'Evanjelium \(([^)]+)\)', t)
  i = t.find('Komentár\n')
  if i < 0:
    return None, None
  return (ev.group(1) if ev else ''), t[i + len('Komentár\n'):][:MAX_ZNAKOV]


# ---------- inky.sk ----------

_inky = None


def inky_zoznam():
  global _inky
  if _inky is None:
    _inky = []
    try:
      poz = urllib.request.Request('https://inky.sk/V-Bib-Nedelne.htm', headers={'User-Agent': 'pastoracia-app'})
      with urllib.request.urlopen(poz, timeout=30) as r:
        s = r.read().decode('windows-1250', 'replace')
    except OSError:
      return _inky
    for url, odkaz, nazov in re.findall(r'<a href="([^"#]+\.doc)"[^>]*>(.*?)</a>\s*:?\s*([^<]*)', s, re.S):
      odkaz, nazov = jeden_riadok(odkaz).rstrip(':'), jeden_riadok(nazov).strip(' :')
      r = rozsah(odkaz)
      if r:
        _inky.append({'rozsah': r, 'odkaz': odkaz, 'nazov': nazov, 'url': 'https://inky.sk/' + url.replace(' ', '%20')})
  return _inky


def inky(odkaz):
  r = rozsah(odkaz)
  if not r:
    return None
  for x in inky_zoznam():
    k, kap, od, do = x['rozsah']
    # spoločná aspoň polovica úryvku, aby to nebol len dotyk
    spolocne = min(do, r[3]) - max(od, r[2]) + 1
    if k == r[0] and kap == r[1] and spolocne * 2 >= r[3] - r[2] + 1:
      return x
  return None


# ---------- Claude ----------

def claude(model, system, vstup, schema):
  prikaz = [
    CLAUDE, '-p', '--model', model, '--system-prompt', system, '--tools', '',
    '--output-format', 'json', '--json-schema', json.dumps(schema),
    '--no-session-persistence', '--strict-mcp-config', '--setting-sources', '',
  ]
  r = subprocess.run(prikaz, input=vstup, capture_output=True, text=True, encoding='utf-8', timeout=900)
  try:
    o = json.loads(r.stdout)
  except json.JSONDecodeError:
    print(f'  Claude ({model}) zlyhal: {r.stderr[:300] or r.stdout[:300]}')
    return None
  print(f'  Claude {model}: {o.get("total_cost_usd", 0):.4f} USD (ekvivalent API)')
  if o.get('is_error'):
    print(f'  Claude ({model}) chyba: {str(o.get("result"))[:300]}')
    return None
  return o.get('structured_output')


SYSTEM_MYSLIENKY = (
  'Si pomocník gréckokatolíckeho kňaza. Ku každému dňu napíš po slovensky vlastnými slovami '
  '„myslienka“ (2–4 vety k evanjeliu dňa podľa byzantského poriadku, pre kňaza aj na kázeň) '
  'a „otazka“ (1 veta na osobné zamyslenie). Necituj dlhé pasáže, nevymýšľaj fakty.'
)

SYSTEM_ZHRNUTIA = (
  'Zhŕňaš texty po slovensky vlastnými slovami, 3–6 viet, odseky oddeľ prázdnym riadkom. '
  'Nekopíruj vety doslova. Pri druhu „otcovia“ uveď, ktorý Otec čo hovorí (napr. „Ján Zlatoústy pripomína…“). '
  'Pri druhu „komentar“ zachyť hlavnú myšlienku komentára. Nič nevymýšľaj nad rámec textu.'
)


def napis_myslienky(polozky):
  schema = {
    'type': 'object',
    'properties': {'dni': {'type': 'array', 'items': {
      'type': 'object',
      'properties': {'datum': {'type': 'string'}, 'myslienka': {'type': 'string'}, 'otazka': {'type': 'string'}},
      'required': ['datum', 'myslienka', 'otazka'],
    }}},
    'required': ['dni'],
  }
  vstup = '\n\n'.join(
    f'=== {p["datum"]} – {p["nazov"]}\nČítania: {p["citania"]}\n\n{p["evanjelium"]}' for p in polozky
  )
  o = claude('sonnet', SYSTEM_MYSLIENKY, vstup, schema)
  return {d['datum']: d for d in (o or {}).get('dni', [])}


def zhrn(polozky, model):
  schema = {
    'type': 'object',
    'properties': {'zhrnutia': {'type': 'array', 'items': {
      'type': 'object', 'properties': {'id': {'type': 'string'}, 'text': {'type': 'string'}}, 'required': ['id', 'text'],
    }}},
    'required': ['zhrnutia'],
  }
  vstup = '\n\n'.join(f'=== id: {p["id"]} | druh: {p["druh"]}\n{p["zdroj"]}' for p in polozky)
  o = claude(model, SYSTEM_ZHRNUTIA, vstup, schema)
  return {z['id']: z['text'] for z in (o or {}).get('zhrnutia', [])}


# ---------- hlavný postup ----------

def nacitaj():
  if not SUBOR.exists():
    return {'verzia': 1, 'dni': []}
  return json.loads(SUBOR.read_text(encoding='utf-8-sig'))


def zapis(data, dnes):
  hranica = (dnes - timedelta(days=DNI_DOZADU)).isoformat()
  dni = sorted((d for d in data['dni'] if d['datum'] >= hranica), key=lambda d: d['datum'])
  dni = [{k: d.get(k, [] if k in ('zdroje', 'texty', 'dalsie') else '') for k in KLUCE_DNA} for d in dni]
  for d in dni:
    d['dalsie'] = [{k: x.get(k, '') for k in KLUCE_DALSIEHO} for x in d['dalsie']]
  SUBOR.write_text(json.dumps({'verzia': 1, 'dni': dni}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def ma_druh(den, druh):
  return any(x.get('druh') == druh for x in den.get('dalsie', []))


def main():
  global SUBOR
  bez_ai = '--bez-ai' in sys.argv
  if '--subor' in sys.argv:
    SUBOR = Path(sys.argv[sys.argv.index('--subor') + 1])
  dnes = date.today()
  data = nacitaj()
  podla_datumu = {d['datum']: d for d in data['dni']}
  na_myslienku, na_zhrnutie = [], []

  for i in range(DNI_DOPREDU):
    datum = (dnes + timedelta(days=i)).isoformat()
    den = podla_datumu.get(datum)
    if den is None:
      den = {'datum': datum, 'zdroje': [], 'texty': [], 'dalsie': []}
      podla_datumu[datum] = den
      data['dni'].append(den)

    potrebuje_casoslov = not den.get('citania') or not den.get('texty')
    c = casoslov_den(datum) if potrebuje_casoslov else None
    if potrebuje_casoslov and not c:
      print(f'{datum}: casoslov.sk nedostupný – vynechávam')
      continue
    if c:
      for k in ('nazov', 'citania', 'svati'):
        if not den.get(k):
          den[k] = c[k]
      if not den.get('texty'):
        den['texty'] = c['texty']
      if not den.get('zdroje'):
        den['zdroje'] = [{'nazov': 'casoslov.sk', 'url': f'https://casoslov.sk/?day={datum}'}]

    ev = hlavne_evanjelium(den)
    if not ev:
      continue

    if not den.get('myslienka'):
      t = text_citania(ev['url'])
      if t:
        na_myslienku.append({'datum': datum, 'nazov': den['nazov'], 'citania': den['citania'], 'evanjelium': t})

    den.setdefault('dalsie', [])
    if not ma_druh(den, 'otcovia'):
      t, url = catena(ev['odkaz'])
      if t:
        na_zhrnutie.append({'id': f'{datum}|otcovia', 'druh': 'otcovia', 'zdroj': t, 'datum': datum,
                            'polozka': {'druh': 'otcovia', 'nazov': 'Otcovia k evanjeliu', 'zdroj': 'Catena Aurea', 'url': url}})

    if not ma_druh(den, 'komentar') and i < OPUS_DOPREDU:
      odkaz_r, t = opus_dei(datum)
      if t:
        nazov = 'Komentár k evanjeliu' + (f' (rímske poradie: {odkaz_r})' if odkaz_r else '')
        na_zhrnutie.append({'id': f'{datum}|komentar', 'druh': 'komentar', 'zdroj': t, 'datum': datum,
                            'polozka': {'druh': 'komentar', 'nazov': nazov, 'zdroj': 'Opus Dei',
                                        'url': f'https://opusdei.org/sk-sk/gospel/{datum}/'}})

    if not ma_druh(den, 'nedela'):
      x = inky(ev['odkaz'])
      if x:
        den['dalsie'].append({
          'druh': 'nedela', 'nazov': f'Poznámky k evanjeliu: {x["nazov"] or x["odkaz"]}', 'zdroj': 'inky.sk',
          'text': f'Materiál k úryvku {x["odkaz"]} (dokument Word, rímsky liturgický rok).', 'url': x['url'],
        })

  zapis(data, dnes)
  print(f'Bez AI hotové. Na myšlienku: {len(na_myslienku)} dní, na zhrnutie: {len(na_zhrnutie)} textov.')

  if bez_ai or (not na_myslienku and not na_zhrnutie):
    return

  if na_myslienku:
    for d, v in napis_myslienky(na_myslienku).items():
      if d in podla_datumu:
        podla_datumu[d]['myslienka'] = v['myslienka'].strip()
        podla_datumu[d]['otazka'] = v['otazka'].strip()
    zapis(data, dnes)

  if na_zhrnutie:
    # Otcov zhŕňa Sonnet (Haiku pri nich miestami otočil zmysel), komentár stačí Haiku
    otcovia = [p for p in na_zhrnutie if p['druh'] == 'otcovia']
    ostatne = [p for p in na_zhrnutie if p['druh'] != 'otcovia']
    texty = {**(zhrn(otcovia, 'sonnet') if otcovia else {}), **(zhrn(ostatne, 'haiku') if ostatne else {})}
    for p in na_zhrnutie:
      t = texty.get(p['id'], '').strip()
      if t:
        podla_datumu[p['datum']]['dalsie'].append({**p['polozka'], 'text': t})
    poradie = {'otcovia': 0, 'komentar': 1, 'nedela': 2}
    for d in podla_datumu.values():
      d.get('dalsie', []).sort(key=lambda x: poradie.get(x['druh'], 9))
    zapis(data, dnes)

  print('Hotovo.')


if __name__ == '__main__':
  main()
