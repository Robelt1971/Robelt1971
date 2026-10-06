// Modos de estudio: Identificar (ver → nombrar) y Localizar (nombre → señalar), con progreso local.
// Toda la política de cada modo (qué significa un clic, si se puede mostrar el tooltip, qué se
// pregunta) vive aquí, en la tabla MODOS; el cableado (main.js) solo pregunta.
import { t, idiomaNombres, nombreSistema, nombreIdioma } from './i18n.js';
import { nombreCompleto, nombreSustituido, sistemaDe } from './datos.js';

const CLAVE_PROGRESO = 'derr-anatomia-progreso-v1';

export class Progreso {
  constructor() {
    try { this.datos = JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || '{}') || {}; } catch { this.datos = {}; }
  }
  registrar(node, ok) {
    const d = this.datos[node] || { ok: 0, mal: 0 };
    if (ok) d.ok++; else d.mal++;
    d.t = Date.now(); this.datos[node] = d; this._guardar();
  }
  de(node) { return this.datos[node] || null; }
  resumen() {
    let ok = 0, mal = 0, n = 0;
    for (const d of Object.values(this.datos)) { n++; ok += d.ok; mal += d.mal; }
    return { n, ok, mal };
  }
  borrar() { this.datos = {}; this._guardar(); }
  _guardar() { try { localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(this.datos)); } catch { /* sin almacenamiento */ } }
}

function barajar(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Política por modo. Añadir un modo = añadir una entrada aquí (y su texto en i18n).
const MODOS = {
  explorar: {
    titulo: null, conPanel: false,
    // El clic selecciona y abre la ficha: no lo consume el estudio.
    clic: () => false,
    tooltip: () => true,
  },
  identificar: {
    titulo: 'modo_identificar', conPanel: true,
    clic: () => true, // en Identificar se responde con los botones; el clic en el modelo no hace nada
    tooltip: (est) => est.resuelto, // sin pistas hasta responder
    pregunta: () => t('pregunta_identificar'),
    preparar: (est) => est._prepararOpciones(),
  },
  localizar: {
    titulo: 'modo_localizar', conPanel: true,
    clic: (est, node) => { est._clicLocalizar(node); return true; },
    tooltip: (est) => est.resuelto,
    pregunta: (est) => t('pregunta_localizar', { nombre: nombreCompleto(est.actual) }),
    preparar: () => {},
  },
};

export class Estudio {
  // onFicha(node): abrir la ficha de la estructura al resolver. onRespuesta(): se registró una respuesta.
  constructor({ visor, manifiesto, contenedor, onFicha, onRespuesta }) {
    this.visor = visor; this.m = manifiesto; this.el = contenedor; this.onFicha = onFicha; this.onRespuesta = onRespuesta;
    this.progreso = new Progreso();
    this.modo = 'explorar';
    this.sesion = { ok: 0, n: 0, racha: 0 };
    this.actual = null; this.intentos = 0; this.priorizar = true; this.resuelto = false; this.mensaje = null;
    this.alcance = 'visibles';
    this._construirPanel();
  }
  get _politica() { return MODOS[this.modo]; }
  // Cambió el idioma (de interfaz o de nombres): repintar lo que esté en pantalla.
  refrescar() { this._pintarControles(); if (this._politica.conPanel && this.actual) this._render(); }

  setModo(modo) {
    this.modo = MODOS[modo] ? modo : 'explorar';
    this.visor.resaltar(null); this.actual = null; this.mensaje = null;
    this.el.hidden = !this._politica.conPanel;
    if (this._politica.conPanel) this.siguiente();
  }
  // Un clic en el modelo: devuelve true si el modo lo consumió (y por tanto no debe abrir la ficha).
  alClic(node) { return this._politica.clic(this, node); }
  // ¿Puede el visor mostrar el nombre al pasar el ratón sin dar pistas?
  permiteTooltip() { return this._politica.tooltip(this); }

  // Estructuras candidatas: visibles en el visor, no variantes, con nombre en el idioma elegido.
  _candidatas() {
    const lang = idiomaNombres();
    const sistemas = this.alcance === 'visibles' ? this.visor.sistemasVisibles() : [this.alcance];
    const out = [];
    for (const key of sistemas) {
      const s = sistemaDe(this.m, key); if (!s || !this.visor.tieneSistema(key)) continue;
      for (const e of s.structures) if (!e.optional && e[lang] && this.visor.estaVisible(e.node)) out.push(e);
    }
    return out;
  }
  _elegir(cands) {
    if (!cands.length) return null;
    if (!this.priorizar) return cands[Math.floor(Math.random() * cands.length)];
    // Peso: las falladas pesan más, las acertadas menos; las nunca vistas, peso medio-alto.
    const pesos = cands.map((e) => { const d = this.progreso.de(e.node); return d ? Math.max(0.2, 1 + 2 * d.mal - 0.6 * d.ok) : 1.2; });
    let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cands.length; i++) { r -= pesos[i]; if (r <= 0) return cands[i]; }
    return cands[cands.length - 1];
  }

  siguiente() {
    this.visor.resaltar(null); this.visor.seleccionar(null);
    this._cands = this._candidatas();
    this.actual = this._elegir(this._cands); this.intentos = 3; this.resuelto = false; this.mensaje = null;
    if (this.actual) this._politica.preparar(this);
    this._render();
  }
  // Identificar: 4 opciones, distractores primero del mismo grupo anatómico, luego del mismo alcance.
  _prepararOpciones() {
    const cands = this._cands;
    const clave = this.actual.group.join('/');
    const mismoGrupo = cands.filter((e) => e !== this.actual && e.group.join('/') === clave);
    const otros = cands.filter((e) => e !== this.actual && !mismoGrupo.includes(e));
    const pool = barajar(mismoGrupo).slice(0, 2).concat(barajar(otros));
    const vistos = new Set([nombreCompleto(this.actual)]); const ops = [this.actual];
    for (const e of pool) { const n = nombreCompleto(e); if (!vistos.has(n)) { vistos.add(n); ops.push(e); } if (ops.length === 4) break; }
    this.opciones = barajar(ops);
    this.visor.resaltar(this.actual.node); this.visor.enfocar(this.actual.node);
  }

  responderOpcion(e) {
    if (this.resuelto || !this.actual) return;
    this._cerrar(e === this.actual || nombreCompleto(e) === nombreCompleto(this.actual));
  }
  _clicLocalizar(node) {
    if (this.resuelto || !this.actual || !node) return;
    if (node === this.actual.node) { this._cerrar(true); return; }
    const e = this.m.porNodo.get(node);
    this.intentos--;
    if (this.intentos <= 0) { this._cerrar(false); return; }
    this.mensaje = { tipo: 'mal', texto: t('casi', { nombre: e ? nombreCompleto(e) : node, n: this.intentos }) };
    this._render();
  }
  mostrarRespuesta() { if (this.actual && !this.resuelto) this._cerrar(false); }
  _cerrar(ok) {
    this.resuelto = true;
    this.progreso.registrar(this.actual.node, ok);
    this.sesion.n++; if (ok) { this.sesion.ok++; this.sesion.racha++; } else this.sesion.racha = 0;
    this.mensaje = ok ? { tipo: 'ok', texto: t('correcto') } : { tipo: 'mal', texto: t('incorrecto', { nombre: nombreCompleto(this.actual) }) };
    this.visor.resaltar(this.actual.node); if (this.modo === 'localizar') this.visor.enfocar(this.actual.node);
    this.onFicha && this.onFicha(this.actual.node);
    this.onRespuesta && this.onRespuesta();
    this._render();
  }

  // El panel tiene una parte fija (título, alcance, priorizar, marcador) que se construye una vez,
  // y una parte por ronda (pregunta, opciones, resultado, acciones) que se repinta en cada respuesta.
  _construirPanel() {
    const el = this.el; el.innerHTML = '';
    this.ui = {};
    this.ui.titulo = document.createElement('h2'); el.appendChild(this.ui.titulo);
    const alc = document.createElement('div'); alc.className = 'alcance';
    this.ui.alcanceLbl = document.createElement('span'); alc.appendChild(this.ui.alcanceLbl);
    this.ui.alcance = document.createElement('select');
    this.ui.alcance.onchange = () => { this.alcance = this.ui.alcance.value; this.siguiente(); }; alc.appendChild(this.ui.alcance);
    const chk = document.createElement('label'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = this.priorizar;
    cb.onchange = () => { this.priorizar = cb.checked; }; this.ui.priorizarTxt = document.createTextNode(''); chk.append(cb, this.ui.priorizarTxt); alc.appendChild(chk);
    el.appendChild(alc);
    this.ui.marcador = document.createElement('div'); this.ui.marcador.className = 'marcador'; el.appendChild(this.ui.marcador);
    this.ui.ronda = document.createElement('div'); el.appendChild(this.ui.ronda);
  }
  _pintarControles() {
    const u = this.ui;
    u.titulo.textContent = this._politica.titulo ? t(this._politica.titulo) : '';
    u.alcanceLbl.textContent = t('alcance'); u.priorizarTxt.textContent = ' ' + t('repasar_debiles');
    u.alcance.replaceChildren(new Option(t('alcance_visibles'), 'visibles'));
    for (const s of this.m.systems) if (this.visor.tieneSistema(s.key)) u.alcance.appendChild(new Option(nombreSistema(s.key), s.key));
    u.alcance.value = this.visor.tieneSistema(this.alcance) || this.alcance === 'visibles' ? this.alcance : 'visibles';
    u.marcador.textContent = t('marcador', this.sesion);
  }
  _render() {
    this._pintarControles();
    const el = this.ui.ronda; el.innerHTML = '';
    if (!this.actual) { const p = document.createElement('p'); p.textContent = t('sin_estructuras'); el.appendChild(p); return; }
    const preg = document.createElement('p'); preg.className = 'pregunta'; preg.textContent = this._politica.pregunta(this); el.appendChild(preg);
    if ([this.actual, ...(this.opciones || [])].some((e) => nombreSustituido(e))) {
      // Algún nombre de la ronda está sin revisar y sale en latín: se avisa por ronda, no por opción (marcarlas delataría la respuesta).
      const av = document.createElement('p'); av.className = 'aviso'; av.textContent = '⚠ ' + t('nombre_pendiente', { idioma: nombreIdioma(idiomaNombres()) }); el.appendChild(av);
    }
    if (this.opciones && this.modo === 'identificar') {
      const ops = document.createElement('div'); ops.className = 'opciones';
      for (const e of this.opciones) {
        const b = document.createElement('button'); b.textContent = nombreCompleto(e);
        if (this.resuelto) { b.disabled = true; if (e === this.actual) b.classList.add('ok'); }
        b.onclick = () => { if (e !== this.actual) b.classList.add('mal'); this.responderOpcion(e); };
        ops.appendChild(b);
      }
      el.appendChild(ops);
    }
    if (this.mensaje) { const r = document.createElement('div'); r.className = 'resultado ' + this.mensaje.tipo; r.textContent = this.mensaje.texto; el.appendChild(r); }
    const acc = document.createElement('div'); acc.className = 'acciones';
    if (this.resuelto) { const b = document.createElement('button'); b.textContent = t('siguiente'); b.onclick = () => this.siguiente(); acc.appendChild(b); }
    else {
      const b1 = document.createElement('button'); b1.className = 'sec'; b1.textContent = t('mostrar_respuesta'); b1.onclick = () => this.mostrarRespuesta(); acc.appendChild(b1);
      const b2 = document.createElement('button'); b2.className = 'sec'; b2.textContent = t('saltar'); b2.onclick = () => this.siguiente(); acc.appendChild(b2);
    }
    el.appendChild(acc);
  }
}
