# OCR naskenovanej knihy: každá strana PDF -> strana-NNN.txt (Tesseract).
# python -X utf8 nastroje/knihy_ocr.py kniha.pdf vystup/ [ces|slk] [od] [do]

import subprocess
import sys
from pathlib import Path

import pymupdf

TESSERACT = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
TESSDATA = str(Path.home() / 'AppData' / 'Local' / 'tessdata')


def main() -> None:
    pdf, vystup = Path(sys.argv[1]), Path(sys.argv[2])
    jazyk = sys.argv[3] if len(sys.argv) > 3 else 'ces'
    dok = pymupdf.open(pdf)
    od = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    do = int(sys.argv[5]) if len(sys.argv) > 5 else dok.page_count
    vystup.mkdir(parents=True, exist_ok=True)
    for i in range(od - 1, do):
        ciel = vystup / f'strana-{i + 1:03}.txt'
        if ciel.exists():
            continue
        obrazok = vystup / 'strana.png'
        dok[i].get_pixmap(dpi=300).save(obrazok)
        subprocess.run(
            [TESSERACT, str(obrazok), str(ciel.with_suffix('')), '-l', jazyk, '--tessdata-dir', TESSDATA, '--psm', '3'],
            check=True,
            capture_output=True,
        )
        print(f'{i + 1}/{do}', flush=True)
    obrazok = vystup / 'strana.png'
    if obrazok.exists():
        obrazok.unlink()


if __name__ == '__main__':
    main()
