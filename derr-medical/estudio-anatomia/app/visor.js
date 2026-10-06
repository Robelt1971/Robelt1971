// Visor 3D: carga los GLB por sistema, aplica la paleta DERR, selección por clic y utilidades de cámara.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/three/meshopt_decoder.module.js';

// Paleta por familia de material (los nombres de material vienen del atlas de origen).
const PALETA = [
  [/^(Bone|Dentine|Enamel|Tooth|Teeth)/i, 0xe9dfc8],
  [/^Suture/i, 0xd6c8ab],
  [/Cartilage/i, 0xcdd7df],
  [/^(Ligament|Articular capsule|Bursa|Tendon|Meniscus|Disc|Labrum|Membrane)/i, 0xf1ece0],
  [/^(Pulmonary artery)/i, 0x5b7cd6],
  [/^(Pulmonary vein)/i, 0xc94c4c],
  [/^(Artery|Aorta|Arteries|Arterial)/i, 0xc0392b],
  [/^(Vein|Venous|Sinus)/i, 0x3b5fc0],
  [/^(Heart|Myocard|Atrium|Ventricle)/i, 0xb33a3a],
  [/^(Lymph)/i, 0x6fbf73],
  [/^(Nerve|Plexus|Ganglion|Spinal)/i, 0xf2d16b],
  [/^(Brain|Cerebellum|Cortex|Gyrus|White matter|Grey matter|Gray matter|Brainstem|Thalamus)/i, 0xd9a2a0],
  [/^(Brain-Inner|Ventricles?)/i, 0xa7c4e0],
  [/^(Abductor|Adductor|Flexor|Extensor|Biarticular|Rotator|Pronator|Supinator|Muscle|Muscular|Sphincter|Diaphragm|Levator|Depressor|Tensor|Constrictor|Dilator|Opponens|Erector)/i, 0xa23b3b],
  [/^(Skin|Dermis|Epidermis)/i, 0xd9a37e],
  [/^(Fat|Adipose)/i, 0xf3e09c],
  [/^(Fascia|Aponeurosis|Retinaculum|Septum)/i, 0xe8e2d0],
  [/^(Liver|Hepat)/i, 0x8b3a3a],
  [/^(Gallbladder|Biliary|Bile)/i, 0x6b8e3a],
  [/^(Lung|Pleura|Alveol)/i, 0xe3a0a8],
  [/^(Bronch|Trachea|Larynx|Airway)/i, 0xd9c7a0],
  [/^(Kidney|Renal|Ureter)/i, 0x8c4a3c],
  [/^(Bladder|Urethra)/i, 0xe6c27a],
  [/^(Stomach|Intestine|Colon|Duoden|Jejun|Ileum|Rectum|Oesophag|Esophag|Mucosa|Caecum|Appendix)/i, 0xd99a8c],
  [/^(Pancreas)/i, 0xe8c9a0],
  [/^(Spleen)/i, 0x7b2d3c],
  [/^(Thyroid|Parathyroid|Adrenal|Suprarenal|Pituitary|Hypophysis|Pineal|Thymus|Gland)/i, 0xc27a63],
  [/^(Eye|Cornea|Sclera|Lens|Retina|Iris)/i, 0xeef2f5],
  [/^(Uterus|Ovary|Vagina|Testis|Prostate|Penis|Scrotum|Mammary|Breast)/i, 0xd8a0b0],
  [/^(Region|Regions|Body|Surface|Trunk|Limb|Head)/i, 0xcfb9a0],
  [/^(Planes?|Lines?|Axis|Axes|Reference)/i, 0x7fb3d5],
  [/^(Black)/i, 0x202020],
];
const COLOR_DEFECTO = 0xb8a89a;
// Color representativo de cada sistema para la lista de capas (misma familia que la paleta de materiales).
const COLOR_SISTEMA = { esqueletico: '#e9dfc8', articulaciones: '#cdd7df', muscular: '#a23b3b', cardiovascular: '#c0392b', linfoide: '#6fbf73', nervioso: '#f2d16b', visceral: '#d99a8c', regiones: '#cfb9a0' };
export function colorSistema(key) { return COLOR_SISTEMA[key] || '#999'; }
const SELECCION = new THREE.Color(0x3fa7d6);
const RESALTE = new THREE.Color(0xf2c14e);

function colorPara(nombreMaterial, colorGltf) {
  for (const [re, hex] of PALETA) if (re.test(nombreMaterial)) return new THREE.Color(hex);
  if (colorGltf) {
    const c = colorGltf.clone();
    const hsl = {}; c.getHSL(hsl);
    // Colores razonables del origen se conservan; los demasiado oscuros o saturados se atenúan.
    if (hsl.l > 0.15 && hsl.l < 0.9 && hsl.s < 0.85) return c;
  }
  return new THREE.Color(COLOR_DEFECTO);
}

export class Visor {
  constructor(canvas, { onSelect, onHover, onDoubleClick } = {}) {
    this.canvas = canvas;
    this.onSelect = onSelect; this.onHover = onHover; this.onDoubleClick = onDoubleClick;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1419);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 50);
    this.camera.position.set(0, 1.0, 3.2);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0.95, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 0.03; this.controls.maxDistance = 12;

    // Luz cálida y suave: los tonos de hueso y tejido se leen mejor que con luz blanca fría.
    this.scene.add(new THREE.HemisphereLight(0xfff3e4, 0x4a3f36, 0.9));
    const luz = new THREE.DirectionalLight(0xfff1dc, 1.4); luz.position.set(2, 4, 3); this.scene.add(luz);
    const luz2 = new THREE.DirectionalLight(0xd8e4f0, 0.5); luz2.position.set(-3, 1, -2); this.scene.add(luz2);

    this.loader = new GLTFLoader();
    this.loader.setMeshoptDecoder(MeshoptDecoder);

    this.sistemas = new Map();   // key -> { grupo: THREE.Group, estructuras: Map(node -> {partes:[Mesh], entry}), visible }
    this._cargas = new Map();    // key -> Promise de una carga en curso (evita cargar dos veces el mismo sistema)
    this.partes = [];            // todas las mallas (para raycast)
    this.seleccionado = null;    // node
    this.resaltado = null;       // node (modo estudio)
    this.ocultos = new Set();    // nodos ocultos manualmente
    this.aislado = null;         // node aislado o null
    this.raycaster = new THREE.Raycaster();
    this.puntero = new THREE.Vector2();
    this._hoverNode = null;
    this._visibles = [];         // mallas visibles, recalculadas al cambiar visibilidad (evita filtrar miles por hover)

    this._bindEventos();
    this._redimensionar();
    new ResizeObserver(() => this._redimensionar()).observe(canvas.parentElement);
    this.renderer.setAnimationLoop(() => { this.controls.update(); this.renderer.render(this.scene, this.camera); });
  }

  _redimensionar() {
    const el = this.canvas.parentElement; const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  _bindEventos() {
    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      const esClic = Math.hypot(dx, dy) < 5 && performance.now() - down.t < 500;
      down = null;
      if (!esClic || e.detail > 1) return; // el segundo clic de un doble clic no cuenta como selección
      const node = this._pick(e);
      this.onSelect && this.onSelect(node, e);
    });
    this.canvas.addEventListener('dblclick', (e) => {
      const node = this._pick(e);
      if (node) { this.enfocar(node); this.onDoubleClick && this.onDoubleClick(node); }
    });
    let ultimoHover = 0;
    this.canvas.addEventListener('pointermove', (e) => {
      const ahora = performance.now();
      if (ahora - ultimoHover < 40) return; ultimoHover = ahora;
      const node = this._pick(e);
      if (node !== this._hoverNode) { this._hoverNode = node; this.onHover && this.onHover(node, e); }
      else if (node) this.onHover && this.onHover(node, e, true);
    });
    this.canvas.addEventListener('pointerleave', () => { this._hoverNode = null; this.onHover && this.onHover(null); });
  }

  _pick(e) {
    const r = this.canvas.getBoundingClientRect();
    this.puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.puntero, this.camera);
    const hits = this.raycaster.intersectObjects(this._visibles, false);
    return hits.length ? hits[0].object.userData.node : null;
  }
  _visibleEnJerarquia(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }

  // Carga un sistema; `estructuras` es la lista del manifiesto para ese sistema.
  // Si ya está cargado devuelve el existente; si está cargándose, devuelve esa misma promesa.
  cargarSistema(key, url, estructuras, onProgress) {
    if (this.sistemas.has(key)) return Promise.resolve(this.sistemas.get(key));
    if (this._cargas.has(key)) return this._cargas.get(key);
    const p = this._cargarSistema(key, url, estructuras, onProgress).finally(() => this._cargas.delete(key));
    this._cargas.set(key, p);
    return p;
  }
  async _cargarSistema(key, url, estructuras, onProgress) {
    const gltf = await new Promise((res, rej) => this.loader.load(url, res, (ev) => onProgress && onProgress(ev), rej));
    const grupo = gltf.scene; grupo.name = key;
    const porNodo = new Map(estructuras.map((e) => [e.node, e]));
    const mapa = new Map();
    // GLTFLoader "sanea" los nombres (quita puntos, cambia espacios por "_"), así que el nombre
    // original del nodo se recupera del JSON del glTF a través de parser.associations.
    const json = gltf.parser.json, assoc = gltf.parser.associations;
    const nombreOriginal = (o) => { const a = assoc.get(o); return a && a.nodes !== undefined ? json.nodes[a.nodes].name : undefined; };
    grupo.traverse((o) => {
      if (!o.isMesh) return;
      // El nodo de la estructura es el propio Mesh o su Group padre (mallas con varios materiales).
      let node;
      for (let n = o; n && n !== grupo; n = n.parent) { const nm = nombreOriginal(n); if (nm && porNodo.has(nm)) { node = nm; break; } }
      const entry = node && porNodo.get(node);
      if (!entry) { o.visible = false; return; }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map((m) => {
        const nm = new THREE.MeshStandardMaterial({
          color: colorPara(m.name || '', m.color), roughness: 0.75, metalness: 0.0,
          transparent: false, side: THREE.FrontSide,
        });
        nm.name = m.name; nm.userData.base = nm.color.clone();
        return nm;
      });
      if (o.material.length === 1) o.material = o.material[0];
      o.userData.node = node;
      o.frustumCulled = true;
      if (!mapa.has(node)) mapa.set(node, { partes: [], entry });
      mapa.get(node).partes.push(o);
      this.partes.push(o);
    });
    this.scene.add(grupo);
    const sis = { grupo, estructuras: mapa, visible: true };
    this.sistemas.set(key, sis);
    if (this.sistemas.size === 1) this.resetVista();
    this._aplicarVisibilidad();
    return sis;
  }

  setVisibleSistema(key, v) {
    const s = this.sistemas.get(key); if (!s) return;
    s.visible = v; s.grupo.visible = v; this._aplicarVisibilidad();
  }
  sistemasVisibles() { return [...this.sistemas.entries()].filter(([, s]) => s.visible).map(([k]) => k); }
  tieneSistema(key) { return this.sistemas.has(key); }

  _info(node) { for (const s of this.sistemas.values()) { const i = s.estructuras.get(node); if (i) return i; } return null; }
  _aplicarVisibilidad() {
    for (const s of this.sistemas.values()) {
      for (const [node, info] of s.estructuras) {
        const vis = !this.ocultos.has(node) && (this.aislado === null || this.aislado === node);
        for (const p of info.partes) p.visible = vis;
      }
    }
    this._visibles = this.partes.filter((m) => m.visible && this._visibleEnJerarquia(m));
  }
  estaVisible(node) {
    const info = this._info(node); if (!info) return false;
    return info.partes.some((p) => p.visible && this._visibleEnJerarquia(p));
  }

  ocultar(node) { this.ocultos.add(node); if (this.seleccionado === node) this.seleccionar(null); this._aplicarVisibilidad(); }
  aislar(node) { this.aislado = node; this._aplicarVisibilidad(); this.enfocar(node); }
  // Deshace un ocultar/aislar que tape a esta estructura (p. ej. al elegirla desde el buscador).
  revelar(node) { this.ocultos.delete(node); if (this.aislado !== null && this.aislado !== node) this.aislado = null; this._aplicarVisibilidad(); }
  mostrarTodo() { this.ocultos.clear(); this.aislado = null; this._aplicarVisibilidad(); }

  _pintar(node, color) {
    const info = this._info(node); if (!info) return;
    for (const p of info.partes) for (const m of (Array.isArray(p.material) ? p.material : [p.material])) {
      if (color) { m.emissive.copy(color).multiplyScalar(0.55); m.color.copy(m.userData.base).lerp(color, 0.35); }
      else { m.emissive.setHex(0); m.color.copy(m.userData.base); }
    }
  }
  seleccionar(node) {
    if (this.seleccionado && this.seleccionado !== this.resaltado) this._pintar(this.seleccionado, null);
    this.seleccionado = node;
    if (node) this._pintar(node, SELECCION);
  }
  resaltar(node) {
    if (this.resaltado) this._pintar(this.resaltado, null);
    this.resaltado = node;
    if (node) this._pintar(node, RESALTE);
  }

  // Caja envolvente de una estructura (o de todo lo visible).
  _caja(node) {
    const caja = new THREE.Box3();
    if (node) { const info = this._info(node); if (info) for (const p of info.partes) caja.expandByObject(p); }
    else for (const s of this.sistemas.values()) if (s.visible) for (const [, info] of s.estructuras) for (const p of info.partes) if (p.visible) caja.expandByObject(p);
    return caja;
  }
  enfocar(node) {
    const caja = this._caja(node); if (caja.isEmpty()) return;
    const centro = caja.getCenter(new THREE.Vector3()); const tam = caja.getSize(new THREE.Vector3()).length();
    const dist = Math.max(tam * 1.6, 0.05);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this._animarCamara(centro.clone().add(dir.multiplyScalar(dist)), centro);
  }
  resetVista() {
    const caja = this._caja(null); if (caja.isEmpty()) return;
    const centro = caja.getCenter(new THREE.Vector3()); const alto = caja.getSize(new THREE.Vector3()).y || 1.8;
    this._animarCamara(new THREE.Vector3(centro.x, centro.y, centro.z + alto * 1.7), centro);
  }
  _animarCamara(pos, target) {
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone(); const t1 = performance.now(); const dur = 450;
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - t1) / dur); const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(p0, pos, e); this.controls.target.lerpVectors(t0, target, e);
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
}
