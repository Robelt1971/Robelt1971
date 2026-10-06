#!/usr/bin/env python3
"""Comprueba que los datos del módulo son coherentes entre sí. Sin dependencias.
Uso: python3 scripts/verificar_datos.py   (desde cualquier carpeta; sale con 1 si hay fallos)
Comprueba: cada estructura del manifiesto existe como nodo en su GLB y el GLB no trae nodos
nombrados que falten en el manifiesto; `count` coincide; cada `def` existe en definiciones.json;
y qué nombres ingleses no tienen fila en nombres-nl-pap.json (informativo).
"""
import json, os, struct, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
MODULO = os.path.dirname(AQUI)

def nodos_glb(path):
    """Nombres de los nodos del GLB que tienen geometría (malla propia o en algún descendiente).
    Lee solo el chunk JSON de la cabecera. Un nodo sin malla (curvas auxiliares, ejes) no se puede
    seleccionar en el visor, así que no cuenta como estructura."""
    with open(path, 'rb') as f:
        magic, _version, _length = struct.unpack('<4sII', f.read(12))
        if magic != b'glTF': raise ValueError(f'{path}: no es un GLB')
        chunk_len, chunk_type = struct.unpack('<II', f.read(8))
        if chunk_type != 0x4E4F534A: raise ValueError(f'{path}: el primer chunk no es JSON')
        j = json.loads(f.read(chunk_len))
    nodes = j.get('nodes', [])
    con_malla = set()
    def tiene(i):
        if i in con_malla: return True
        n = nodes[i]
        ok = 'mesh' in n or any(tiene(c) for c in n.get('children', []))
        if ok: con_malla.add(i)
        return ok
    for i in range(len(nodes)): tiene(i)
    return {nodes[i]['name'] for i in con_malla if nodes[i].get('name')}

def main():
    fallos = []
    m = json.load(open(os.path.join(MODULO, 'data', 'estructuras.json'), encoding='utf-8'))
    defs = json.load(open(os.path.join(MODULO, 'data', 'definiciones.json'), encoding='utf-8'))
    extra = json.load(open(os.path.join(MODULO, 'data', 'nombres-nl-pap.json'), encoding='utf-8'))
    total = 0
    for s in m['systems']:
        nodos = {e['node'] for e in s['structures']}
        total += len(nodos)
        if s['count'] != len(s['structures']):
            fallos.append(f"{s['key']}: count={s['count']} pero hay {len(s['structures'])} estructuras")
        glb = os.path.join(MODULO, 'modelos', s['file'])
        en_glb = nodos_glb(glb)
        sin_malla = sorted(nodos - en_glb)
        if sin_malla: fallos.append(f"{s['key']}: {len(sin_malla)} estructuras del manifiesto sin nodo en {s['file']}: {sin_malla[:8]}")
        sin_fila = sorted(n for n in en_glb - nodos if not n.endswith('_bevel'))
        if sin_fila: print(f"  aviso {s['key']}: {len(sin_fila)} nodos del GLB sin fila en el manifiesto (quedan ocultos): {sin_fila[:5]}")
        for e in s['structures']:
            if e.get('def') and e['def'] not in defs: fallos.append(f"{s['key']}/{e['node']}: def '{e['def']}' no existe en definiciones.json")
    ingles = {e['en'] for s in m['systems'] for e in s['structures']}
    sin_nl = sorted(ingles - set(extra)); sobran = sorted(set(extra) - ingles)
    print(f"estructuras: {total} · nombres ingleses únicos: {len(ingles)} · con fila nl/pap: {len(ingles & set(extra))}")
    if sin_nl: print(f"  aviso: {len(sin_nl)} nombres sin fila nl/pap (caen al inglés): {sin_nl[:6]}")
    if sobran: print(f"  aviso: {len(sobran)} filas nl/pap sin estructura: {sobran[:6]}")
    for f in fallos: print('FALLO:', f)
    print('OK' if not fallos else f'{len(fallos)} fallos')
    return 1 if fallos else 0

if __name__ == '__main__':
    sys.exit(main())
