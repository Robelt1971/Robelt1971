#!/usr/bin/env python3
"""Vuelca la revisión clínica de data/revision-nombres-nl-pap.csv en data/nombres-nl-pap.json.
Uso: python3 scripts/aplicar_revision.py [--csv ruta] [--seco]
Por cada fila: si ok_nl vale "si"/"sí"/"x"/"ok", o hay correccion_nl, el nombre neerlandés pasa a
`nl_fuente: "revisado"` (con la corrección si la hay). Igual para pap. Las filas sin marcar no cambian.
La ficha muestra "revisado clínicamente" para esa fuente y deja de avisar.
Después: regenerar el CSV desde el JSON no hace falta; el CSV sigue siendo la hoja de trabajo y el
JSON el dato que usa la app. Ejecutar luego scripts/verificar_datos.py.
"""
import argparse, csv, json, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(AQUI), 'data')
SI = {'si', 'sí', 'x', 'ok', 'yes', 'ja', '1', 'true'}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--csv', default=os.path.join(DATA, 'revision-nombres-nl-pap.csv'))
    ap.add_argument('--seco', action='store_true', help='solo informa, no escribe')
    a = ap.parse_args()
    tabla_path = os.path.join(DATA, 'nombres-nl-pap.json')
    tabla = json.load(open(tabla_path, encoding='utf-8'))
    cambios = {'nl': 0, 'pap': 0}; desconocidos = []
    with open(a.csv, encoding='utf-8', newline='') as f:
        for fila in csv.DictReader(f, delimiter=';'):
            en = (fila.get('ingles') or '').strip()
            if not en: continue
            if en not in tabla: desconocidos.append(en); continue
            for lang in ('nl', 'pap'):
                ok = (fila.get(f'ok_{lang}') or '').strip().lower() in SI
                corr = (fila.get(f'correccion_{lang}') or '').strip()
                if not ok and not corr: continue
                if corr: tabla[en][lang] = corr
                if tabla[en].get(f'{lang}_fuente') != 'revisado' or corr:
                    tabla[en][f'{lang}_fuente'] = 'revisado'; cambios[lang] += 1
    print(f"revisados: nl {cambios['nl']}, pap {cambios['pap']}" + (f" · {len(desconocidos)} nombres del CSV no están en la tabla: {desconocidos[:5]}" if desconocidos else ''))
    if a.seco: return 0
    json.dump(tabla, open(tabla_path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('escrito', os.path.relpath(tabla_path))
    return 0

if __name__ == '__main__':
    sys.exit(main())
