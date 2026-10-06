#!/usr/bin/env python3
"""Prepara la hoja de una oleada de revisión clínica: las filas de data/revision-nombres-nl-pap.csv
de los sistemas indicados, solo las que siguen sin revisar en algún idioma, con las columnas de
trabajo vacías. La hoja devuelta se rellena (ok_nl / ok_pap / correccion_nl / correccion_pap /
revisor) y se vuelca con scripts/aplicar_revision.py --csv <hoja>.
Uso: python3 scripts/oleada_revision.py --sistemas esqueletico muscular --salida oleada-1.csv
     python3 scripts/oleada_revision.py --listar          (cuántos nombres quedan por sistema)
"""
import argparse, csv, json, os, sys
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(AQUI), 'data')
TRABAJO = ('ok_nl', 'ok_pap', 'correccion_nl', 'correccion_pap', 'revisor')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sistemas', nargs='*', default=[], help='claves de sistema (esqueletico, muscular, …)')
    ap.add_argument('--salida', help='CSV de salida (separador ;)')
    ap.add_argument('--listar', action='store_true')
    a = ap.parse_args()
    tabla = json.load(open(os.path.join(DATA, 'nombres-nl-pap.json'), encoding='utf-8'))
    filas = list(csv.DictReader(open(os.path.join(DATA, 'revision-nombres-nl-pap.csv'), encoding='utf-8', newline=''), delimiter=';'))
    def pendiente(f):
        t = tabla.get(f['ingles']); return bool(t) and (t.get('nl_fuente') != 'revisado' or t.get('pap_fuente') != 'revisado')
    if a.listar or not a.salida:
        c = Counter(f['sistema'] for f in filas if pendiente(f))
        for s, n in sorted(c.items()): print(f'{s:16} {n} nombres por revisar')
        print(f'{"total":16} {sum(c.values())}')
        return 0
    sel = [f for f in filas if f['sistema'] in set(a.sistemas) and pendiente(f)]
    if not sel: print('ninguna fila para esos sistemas', file=sys.stderr); return 1
    campos = list(filas[0].keys())
    with open(a.salida, 'w', encoding='utf-8', newline='') as out:
        w = csv.DictWriter(out, fieldnames=campos, delimiter=';'); w.writeheader()
        for f in sel: w.writerow({k: ('' if k in TRABAJO else f[k]) for k in campos})
    print(f'{len(sel)} nombres de {", ".join(a.sistemas)} en {a.salida}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
