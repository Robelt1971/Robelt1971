// Arranque del módulo: cableado entre datos, visor, estudio e interfaz. La política de cada
// modo vive en estudio.js; el estado de idioma, en i18n.js; la visibilidad 3D, en visor.js.
import { Visor, colorSistema } from './visor.js';
import { Estudio } from './estudio.js';
import { cargarManifiesto, cargarDefiniciones, definicion, nombre, nombreCompleto, nombreSustituido, fuenteNombre, buscar, sistemaDe } from './datos.js';
import { t, aplicar, cargarPreferencias, idioma, setIdioma, idiomaNombres, setIdiomaNombres, nombreSistema, nombreIdioma, IDIOMAS_PENDIENTES } from './i18n.js';

const BASE = './';
const SISTEMAS_INICIALES = ['esqueletico'];

const $ = (s) => document.querySelector(s);
const ui = {
  capas: $('#capas'), buscador: $('#buscador'), resultados: $('#resultados'), ficha: $('#ficha'), estudio: $('#estudio'),
  tooltip: $('#tooltip'), carga: $('#carga'), cargaProgreso: $('#carga-progreso'), cargaTexto: $('#carga-texto'),
  idiomaUI: $('#idioma-ui'), idiomaNombres: $('#idioma-nombres'), progreso: $('#progreso-resumen'),
};
let manifiesto, visor, estudio;

async function iniciar() {
  cargarPreferencias();
  ui.idiomaUI.value = idioma(); ui.idiomaNombres.value = idiomaNombres();
  pintarTextos();

  manifiesto = await cargarManifiesto(BASE);
  cargarDefiniciones(BASE);
  visor = new Visor($('#lienzo'), { onSelect: alSeleccionar, onHover: alPasar });
  estudio = new Estudio({ visor, manifiesto, contenedor: ui.estudio, onFicha: mostrarFicha, onRespuesta: pintarProgreso });

  construirCapas();
  window.__derr = { visor, manifiesto, estudio }; // acceso para depuración y pruebas automatizadas (tests/humo.mjs)
  for (const key of SISTEMAS_INICIALES) await cargarSistema(key);
  pintarProgreso();

  // Eventos de interfaz
  ui.idiomaUI.onchange = () => { setIdioma(ui.idiomaUI.value); pintarTextos(); construirCapas(); refrescarFicha(); estudio.refrescar(); pintarProgreso(); };
  ui.idiomaNombres.onchange = () => { setIdiomaNombres(ui.idiomaNombres.value); refrescarFicha(); estudio.refrescar(); alBuscar(); };
  ui.buscador.oninput = alBuscar;
  $('#btn-mostrar-todo').onclick = () => visor.mostrarTodo();
  $('#btn-reset-vista').onclick = () => visor.resetVista();
  $('#btn-borrar-progreso').onclick = () => { if (confirm(t('borrar_confirmar'))) { estudio.progreso.borrar(); pintarProgreso(); } };
  document.querySelectorAll('.modo').forEach((b) => b.onclick = () => cambiarModo(b.dataset.modo));
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'h' && visor.seleccionado) visor.ocultar(visor.seleccionado);
    if (e.key === 'a' && visor.seleccionado) visor.aislar(visor.seleccionado);
    if (e.key === 'r') visor.resetVista();
    if (e.key === 'Escape') visor.mostrarTodo();
  });
}

// ---------- Textos ----------
function pintarTextos() {
  aplicar();
  // Los nombres en neerlandés y papiamento son tabla propia pendiente de revisión clínica: se avisa en el propio selector.
  for (const op of ui.idiomaNombres.options) {
    const pendiente = IDIOMAS_PENDIENTES.includes(op.value);
    op.textContent = op.textContent.replace(/ ⚠$/, '') + (pendiente ? ' ⚠' : '');
    op.title = pendiente ? t('nombre_pendiente', { idioma: nombreIdioma(op.value) }) : '';
  }
}

// ---------- Capas (sistemas) ----------
function construirCapas() {
  ui.capas.innerHTML = '';
  for (const s of manifiesto.systems) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.key = s.key;
    cb.checked = visor && visor.tieneSistema(s.key) && visor.sistemasVisibles().includes(s.key);
    cb.onchange = () => alternarSistema(s.key, cb.checked);
    const muestra = document.createElement('span'); muestra.className = 'muestra'; muestra.style.background = colorSistema(s.key);
    const txt = document.createElement('span'); txt.textContent = nombreSistema(s.key);
    const n = document.createElement('span'); n.className = 'n'; n.textContent = `(${s.count})`;
    label.append(cb, muestra, txt, n);
    const solo = document.createElement('button'); solo.className = 'sec solo'; solo.textContent = t('solo');
    solo.onclick = async () => { for (const o of manifiesto.systems) if (o.key !== s.key && visor.tieneSistema(o.key)) alternarSistema(o.key, false); await alternarSistema(s.key, true); visor.resetVista(); };
    li.append(label, solo); ui.capas.appendChild(li);
  }
}
// Activa (cargando si hace falta) o desactiva un sistema; deja la casilla acorde al estado real.
async function alternarSistema(key, activo) {
  if (activo && !visor.tieneSistema(key)) await cargarSistema(key);
  visor.setVisibleSistema(key, activo);
  const cb = ui.capas.querySelector(`input[data-key="${key}"]`); if (cb) cb.checked = activo && visor.tieneSistema(key);
  if (!activo && visor.seleccionado && manifiesto.porNodo.get(visor.seleccionado)?.sistema === key) { visor.seleccionar(null); mostrarFicha(null); }
}
async function cargarSistema(key) {
  const s = sistemaDe(manifiesto, key);
  ui.carga.hidden = false; ui.cargaProgreso.style.width = '0%';
  ui.cargaTexto.textContent = t('cargando_sistema', { nombre: nombreSistema(key) });
  try {
    await visor.cargarSistema(key, `${BASE}modelos/${s.file}`, s.structures, (ev) => {
      if (ev.lengthComputable) ui.cargaProgreso.style.width = `${Math.round((ev.loaded / ev.total) * 100)}%`;
    });
  } catch (err) {
    console.error(err); ui.cargaTexto.textContent = `Error: ${err.message || err}`;
    await new Promise((r) => setTimeout(r, 2500));
  } finally { ui.carga.hidden = true; }
}

// ---------- Selección, tooltip, ficha ----------
function alSeleccionar(node) {
  if (estudio.alClic(node)) return; // el modo de estudio decidió qué hacer con el clic
  visor.seleccionar(node); mostrarFicha(node);
}
function alPasar(node, e) {
  if (!node || !estudio.permiteTooltip()) { ui.tooltip.hidden = true; return; }
  const entry = manifiesto.porNodo.get(node); if (!entry) return;
  ui.tooltip.textContent = nombreCompleto(entry);
  const r = $('.escena').getBoundingClientRect();
  ui.tooltip.style.left = `${e.clientX - r.left}px`; ui.tooltip.style.top = `${e.clientY - r.top}px`; ui.tooltip.hidden = false;
}
let nodoFicha = null;
function refrescarFicha() { mostrarFicha(nodoFicha); }
function mostrarFicha(node) {
  nodoFicha = node; const f = ui.ficha; f.innerHTML = '';
  const entry = node && manifiesto.porNodo.get(node);
  if (!entry) { const p = document.createElement('p'); p.className = 'vacio'; p.textContent = t('ficha_vacia'); f.appendChild(p); return; }
  const lang = idiomaNombres();
  const h = document.createElement('h3'); h.textContent = nombreCompleto(entry);
  if (entry.optional) { const et = document.createElement('span'); et.className = 'etiqueta'; et.textContent = t('opcional'); h.appendChild(et); }
  f.appendChild(h);
  const ruta = document.createElement('div'); ruta.className = 'ruta';
  ruta.textContent = [nombreSistema(entry.sistema), ...entry.group].join(' › '); f.appendChild(ruta);
  const dl = document.createElement('dl');
  const filas = [['espanol', 'es'], ['ingles', 'en'], ['latin', 'la'], ['neerlandes', 'nl'], ['papiamento', 'pap'], ['frances', 'fr'], ['portugues', 'pt']];
  // Etiqueta de procedencia de un nombre de la tabla propia; un nombre sin revisar no se muestra (datos.js), se dice que falta.
  const marcaFuente = (l) => {
    const fu = fuenteNombre(entry, l); if (!fu) return null;
    const et = document.createElement('span'); et.className = 'etiqueta';
    et.textContent = fu === 'wikipedia-nl' ? t('fuente_wiki_nl') : fu === 'revisado' ? t('fuente_revisado') : '⚠ ' + t('nombre_pendiente', { idioma: nombreIdioma(l) });
    et.title = et.textContent; return et;
  };
  const etActual = marcaFuente(lang); if (etActual) h.appendChild(etActual);
  for (const [k, l] of filas) {
    if (l === lang || !entry[l] || nombreSustituido(entry, l)) continue;
    const dt = document.createElement('dt'); dt.textContent = t(k); const dd = document.createElement('dd'); dd.textContent = entry[l];
    const et = marcaFuente(l); if (et) dd.appendChild(et);
    dl.append(dt, dd);
  }
  f.appendChild(dl);
  const def = definicion(entry);
  const dh = document.createElement('h2'); dh.textContent = t('definicion'); f.appendChild(dh);
  const dp = document.createElement('p'); dp.className = 'def';
  if (def) {
    dp.textContent = def.summary + ' ';
    if (def.url) {
      // La etiqueta de fuente y licencia depende del dominio real; no todas las definiciones son de Wikipedia.
      let host = ''; try { host = new URL(def.url).hostname; } catch { host = ''; }
      const a = document.createElement('a'); a.href = def.url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = host === 'en.wikipedia.org' ? t('fuente_wiki') : t('fuente_otra', { host });
      dp.appendChild(a);
    }
  } else dp.textContent = t('sin_definicion');
  f.appendChild(dp);
  const acc = document.createElement('div'); acc.className = 'fila-botones';
  for (const [k, fn] of [['enfocar', () => visor.enfocar(node)], ['aislar', () => visor.aislar(node)], ['ocultar', () => { visor.ocultar(node); mostrarFicha(null); }]]) {
    const b = document.createElement('button'); b.className = 'sec'; b.textContent = t(k); b.onclick = fn; acc.appendChild(b);
  }
  f.appendChild(acc);
  const pr = estudio.progreso.de(node);
  if (pr) { const p = document.createElement('p'); p.className = 'ruta'; p.textContent = `✓ ${pr.ok} · ✗ ${pr.mal}`; f.appendChild(p); }
}

// ---------- Buscador ----------
function alBuscar() {
  const q = ui.buscador.value; ui.resultados.innerHTML = '';
  const res = buscar(manifiesto, q, 40);
  if (q.trim().length >= 2 && !res.length) { const li = document.createElement('li'); li.className = 'sub'; li.textContent = t('sin_resultados'); ui.resultados.appendChild(li); return; }
  for (const e of res) {
    const li = document.createElement('li');
    li.textContent = nombreCompleto(e);
    const sub = document.createElement('span'); sub.className = 'sub';
    sub.textContent = [nombreSistema(e.sistema), e.la && e.la !== nombre(e) ? e.la : null].filter(Boolean).join(' · ');
    li.appendChild(sub);
    li.onclick = async () => {
      await alternarSistema(e.sistema, true);
      visor.revelar(e.node);
      visor.seleccionar(e.node); visor.enfocar(e.node); mostrarFicha(e.node);
    };
    ui.resultados.appendChild(li);
  }
}

// ---------- Modos y progreso ----------
function cambiarModo(modo) {
  document.querySelectorAll('.modo').forEach((b) => { const activo = b.dataset.modo === modo; b.classList.toggle('activo', activo); b.setAttribute('aria-selected', String(activo)); });
  visor.seleccionar(null); mostrarFicha(null);
  estudio.setModo(modo);
  pintarProgreso();
}
function pintarProgreso() {
  const r = estudio.progreso.resumen();
  ui.progreso.textContent = r.n ? t('progreso_resumen', r) : t('progreso_vacio');
}

iniciar().catch((err) => { console.error(err); const p = document.createElement('p'); p.className = 'vacio'; p.textContent = `Error al iniciar: ${err.message || err}`; ui.ficha.replaceChildren(p); });
