"""Exporta los sistemas de Z-Anatomy a GLB + manifiesto de estructuras (data/estructuras.json, data/definiciones.json).
Uso: python3 exportar_zanatomy.py <Startup.blend> <carpeta_salida>
Requiere: pip install bpy==4.5.14 (Blender como módulo de Python; Python 3.11).
Después: ./comprimir.sh <carpeta_salida> (gltfpack) copia los GLB a ../modelos y los JSON a ../data.
"""
import bpy, re, json, os, sys, time, collections
blend, out = sys.argv[-2], sys.argv[-1]
os.makedirs(os.path.join(out, 'glb'), exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend, load_ui=False)
sc = bpy.context.scene
vl = sc.view_layers[0]

HELPER = re.compile(r'\.(j|g|i|ol|or|el|er|o\d+[lr]?|e\d+[lr]?|t|st)$')
SYSTEMS = [  # (collection name, key, es, en)
    ('1: Skeletal system', 'esqueletico', 'Sistema esquelético', 'Skeletal system'),
    ('3: Joints', 'articulaciones', 'Articulaciones', 'Joints'),
    ('4: Muscular system', 'muscular', 'Sistema muscular', 'Muscular system'),
    ('5: Cardiovascular system', 'cardiovascular', 'Sistema cardiovascular', 'Cardiovascular system'),
    ('6: Lymphoid organs', 'linfoide', 'Órganos linfoides', 'Lymphoid organs'),
    ('7: Nervous system & Sense organs', 'nervioso', 'Sistema nervioso y órganos de los sentidos', 'Nervous system & sense organs'),
    ('8: Visceral systems', 'visceral', 'Sistemas viscerales', 'Visceral systems'),
    ('9: Regions of human body', 'regiones', 'Regiones del cuerpo', 'Regions of the human body'),
]
def clean(n):
    n = re.sub(r'\.\d{3}$', '', n)
    side = None
    m = re.search(r'\.(l|r)$', n)
    if m: side = m.group(1); n = n[:-2]
    return n.strip(), side
def base(n):  # lookup key for translations/definitions
    return n.strip().strip('*').strip('()').strip()

tx = bpy.data.texts['Translations'].as_string().splitlines()
hdr = tx[0].split(';'); TR = {}
for line in tx[1:]:
    p = line.split(';')
    if len(p) >= 2: TR[p[0].strip()] = dict(zip(hdr[1:], [x.strip() for x in p[1:]]))
LANG = {'Latin': 'la', 'Français': 'fr', 'Español': 'es', 'Portugues': 'pt'}

DEFS = {}
for t in bpy.data.texts:
    if t.name in ('Translations', 'Wiki Phrases') or t.name.endswith('.py'): continue
    s = t.as_string().strip(); lines = s.splitlines()
    url = lines[-1].strip() if lines and lines[-1].strip().startswith('http') else ''
    body = '\n'.join(lines[:-1] if url else lines).strip()
    paras = [p.strip() for p in re.split(r'\n\s*\n', body) if p.strip()]
    if paras and paras[0].isupper(): paras = paras[1:]
    cut = []
    for p in paras:
        if p.startswith('=='): break
        cut.append(p)
    summary = ' '.join(cut[:3]).strip()
    if len(summary) > 900: summary = summary[:897].rsplit(' ', 1)[0] + '…'
    if summary: DEFS[t.name.strip()] = {'summary': summary, 'url': url}

def group_chain(o):
    chain = []; p = o.parent
    while p is not None and len(chain) < 6:
        n, _ = clean(p.name)
        if re.search(r'\.(g|j)$', n): n = n[:-2]
        chain.append(n); p = p.parent
    return chain

manifest = {'generated': time.strftime('%Y-%m-%d'), 'source': 'Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D (CC BY-SA 2.1 JP)', 'systems': []}
defs_used = {}
top_lcs = {lc.name: lc for lc in vl.layer_collection.children}
for col_name, key, es, en in SYSTEMS:
    col = sc.collection.children[col_name]
    objs = [o for o in col.all_objects if o.type in ('MESH', 'CURVE') and not HELPER.search(o.name) and '?' not in o.name]
    # make only this system visible, unhide everything inside, select
    # Deselect EVERYTHING explicitly: the DESELECT operator skips objects hidden in the view layer,
    # so the previous system's selection would leak into this export.
    for n, lc in top_lcs.items(): lc.hide_viewport = False
    for o in bpy.data.objects: o.select_set(False)
    for n, lc in top_lcs.items(): lc.hide_viewport = (n != col_name)
    seen = set(); structures = []
    for o in objs:
        o.hide_viewport = False; o.hide_set(False, view_layer=vl); o.select_set(True)
        if not o.select_get(): print('  !! could not select', o.name)
        name, side = clean(o.name)
        if o.name in seen: continue
        seen.add(o.name)
        b = base(name)
        tr = TR.get(b) or TR.get(name) or {}
        d = DEFS.get(b) or DEFS.get(name)
        entry = {'node': o.name, 'en': name, 'side': side,
                 'optional': name.startswith('('),
                 'group': group_chain(o)[::-1],
                 'materials': [m.name for m in getattr(o.data, 'materials', []) if m][:2]}
        for k, v in LANG.items():
            if tr.get(k): entry[v] = tr[k]
        if d:
            entry['def'] = b; defs_used[b] = d
        structures.append(entry)
    t = time.time()
    path = os.path.join(out, 'glb', f'{key}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_materials='EXPORT', export_image_format='NONE', export_texcoords=False, export_normals=True,
        export_animations=False, export_skins=False, export_morph=False, export_cameras=False, export_lights=False,
        export_yup=True, export_extras=False, export_hierarchy_flatten_objs=True)
    size = os.path.getsize(path)
    print(f'## {key}: {len(structures)} structures, {len(objs)} objects, {size//1024} KB, {round(time.time()-t,1)} s', flush=True)
    manifest['systems'].append({'key': key, 'es': es, 'en': en, 'file': f'{key}.glb', 'count': len(structures), 'structures': structures})
json.dump(manifest, open(os.path.join(out, 'estructuras.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(defs_used, open(os.path.join(out, 'definiciones.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('## done; definitions used:', len(defs_used))
