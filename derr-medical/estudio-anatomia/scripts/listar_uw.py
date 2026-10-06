#!/usr/bin/env python3
"""Lista los objetos del sistema nervioso de Z-Anatomy que proceden de los modelos "Brainder" y
"White matter" (University of Washington), para mantener scripts/exclusiones.json.
Uso: python3 scripts/listar_uw.py <Startup.blend>        (requiere bpy, como exportar_zanatomy.py)
El atlas no guarda procedencia por objeto; el único rastro es el material: esos modelos entran con
los materiales Brain, Brain-Inner o White matter. La lista es por eso conservadora (puede arrastrar
algún objeto propio del atlas que comparta material). Imprime un nombre por línea, sin lado, y al
final cuáles faltan en exclusiones.json; no escribe nada.
"""
import bpy, json, os, re, sys

MATERIALES_UW = {'Brain', 'Brain-Inner', 'White matter'}
HELPER = re.compile(r'\.(j|g|i|ol|or|el|er|o\d+[lr]?|e\d+[lr]?|t|st)$')  # igual que exportar_zanatomy.py
AQUI = os.path.dirname(os.path.abspath(__file__))

def clean(n):
    n = re.sub(r'\.\d{3}$', '', n); n = re.sub(r'\.(l|r)$', '', n); return n.strip()

def main():
    blend = [a for a in sys.argv[1:] if a.endswith('.blend')][0]
    bpy.ops.wm.open_mainfile(filepath=blend, load_ui=False)
    col = bpy.context.scene.collection.children['7: Nervous system & Sense organs']
    nombres = {}
    for o in col.all_objects:
        if o.type not in ('MESH', 'CURVE') or HELPER.search(o.name): continue
        mats = {s.material.name for s in o.material_slots if s.material} & MATERIALES_UW
        if mats: nombres.setdefault(clean(o.name), set()).update(mats)
    for n in sorted(nombres): print(f"{n}\t{', '.join(sorted(nombres[n]))}")
    ex = json.load(open(os.path.join(AQUI, 'exclusiones.json'), encoding='utf-8'))
    ya = {e['en'] for e in ex['excluir']}
    faltan = sorted(set(nombres) - ya)
    print(f"## {len(nombres)} nombres por material UW; {len(faltan)} no están en exclusiones.json" + (f": {faltan}" if faltan else ''))
    return 1 if faltan else 0

if __name__ == '__main__':
    sys.exit(main())
