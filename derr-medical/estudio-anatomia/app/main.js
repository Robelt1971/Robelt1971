// Arranque del módulo: datos, visor, capas, buscador, ficha y modos de estudio.
import { Visor } from './visor.js';
import { Estudio } from './estudio.js';
import { cargarManifiesto, cargarDefiniciones, definicion, nombre, nombreCompleto, buscar, sistemaDe } from './datos.js';
import { t, setIdioma, aplicar } from './i18n.js';

const BASE = './';
const COLORES_SISTEMA = { esqueletico: '#e9dfc8', articulaciones: '#cdd7df', muscular: '#a23b3b', cardiovascular: '#c0392b', linfoide: '#6fbf73', nervioso: '#f2d16b', visceral: '#d99a8c', regiones: '#cfb9a0' };
const SISTEMAS_INICIALES = ['esqueletico'];

const $ = (s) => document.querySelector(s);
const ui = {
  capas: $('#capas'), buscador: $('#buscador'), resultados: $('#resultados'), ficha: $('#ficha'), estudio: $('#estudio'),
  tooltip: $('#tooltip'), carga: $('#carga'), cargaProgreso: $('#carga-progreso'), cargaTexto: $('#carga-texto'),
  idiomaUI: $('#idioma-ui'), idiomaNombres: $('#idioma-nombres'), progreso: $('#progreso-resumen'),
};
let langNombres = 'es';
let manifiesto, visor, estudio;

function pref(clave, defecto) { try { return localStorage.getItem(clave) || defecto; } catch { return defecto; } }
function setPref(clave, v) { try { localStorage.setItem(clave, v); } catch { /* sin almacenamiento */ } }

async function iniciar() {
  setIdioma(pref('derr-anatomia-ui', navigator.language.startsWith('en') ? 'en' : navigator.language.startsWith('nl') ? 'nl' : 'es'));
  langNombres = pref('derr-anatomia-nombres', 'es');
  ui.idiomaUI.value = (await import('./i18n.js')).idioma(); ui.idiomaNombres.value = langNombres;
  aplicar();

  manifiesto = await cargarManifiesto(BASE);
  cargarDefiniciones(BASE);
  visor = new Visor($('#lienzo'), { onSelect: alSeleccionar, onHover: alPasar });
  estudio = new Estudio({ visor, manifiesto, contenedor: ui.estudio, langNombres, onFicha: mostrarFicha });

  construirCapas();
  window.__derr = { visor, manifiesto, estudio }; // acceso para depuración y pruebas automatizadas
  for (const key of SISTEMAS_INICIALES) await cargarSistema(key);
  pintarProgreso();

  // Eventos de interfaz
  ui.idiomaUI.onchange = () => { setIdioma(ui.idiomaUI.value); setPref('derr-anatomia-ui', ui.idiomaUI.value); aplicar(); construirCapas(); refrescarFicha(); estudio.setLang(langNombres); pintarProgreso(); };
  ui.idiomaNombres.onchange = () => { langNombres = ui.idiomaNombres.value; setPref('derr-anatomia-nombres', langNombres); refrescarFicha(); estudio.setLang(langNombres); alBuscar(); };
  ui.buscador.oninput = alBuscar;
  $('#btn-mostrar-todo').onclick = () => { visor.mostrarTodo(); };
  $('#btn-reset-vista').onclick = () => visor.resetVista();
  $('#btn-borrar-progreso').onclick = () => { if (confirm(t('borrar_confirmar'))) { estudio.progreso.borrar(); pintarProgreso(); } };
  document.querySelectorAll('.modo').forEach((b) => b.onclick = () => cambiarModo(b.dataset.modo));
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'h' && visor.seleccionado) visor.ocultar(visor.seleccionado);
    if (e.key === 'a' && visor.seleccionado) visor.aislar(visor.seleccionado);
    if (e.key === 'r') visor.resetVista();
    if (e.key === 'Escape') { visor.mostrarTodo(); }
  });
}

// ---------- Capas (sistemas) ----------
function construirCapas() {
  ui.capas.innerHTML = '';
  const lang = ui.idiomaUI.value === 'en' ? 'en' : 'es';
  for (const s of manifiesto.systems) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.key = s.key;
    cb.checked = visor && visor.tieneSistema(s.key) && visor.sistemasVisibles().includes(s.key);
    cb.onchange = () => alternarSistema(s.key, cb.checked);
    const muestra = document.createElement('span'); muestra.className = 'muestra'; muestra.style.background = COLORES_SISTEMA[s.key] || '#999';
    const txt = document.createElement('span'); txt.textContent = s[lang] || s.es;
    const n = document.createElement('span'); n.className = 'n'; n.textContent = `(${s.count})`;
    label.append(cb, muestra, txt, n);
    const solo = document.createElement('button'); solo.className = 'sec solo'; solo.textContent = t('solo');
    solo.onclick = async () => { for (const o of manifiesto.systems) if (o.key !== s.key && visor.tieneSistema(o.key)) alternarSistema(o.key, false); await alternarSistema(s.key, true); visor.resetVista(); };
    li.append(label, solo); ui.capas.appendChild(li);
  }
}
async function alternarSistema(key, activo) {
  const cb = ui.capas.querySelector(`input[data-key="${key}"]`);
  if (activo && !visor.tieneSistema(key)) { await cargarSistema(key); }
  visor.setVisibleSistema(key, activo);
  if (cb) cb.checked = activo;
  if (!activo && visor.seleccionado && manifiesto.porNodo.get(visor.seleccionado)?.sistema === key) { visor.seleccionar(null); mostrarFicha(null); }
}
async function cargarSistema(key) {
  const s = sistemaDe(manifiesto, key);
  ui.carga.hidden = false; ui.cargaProgreso.style.width = '0%';
  ui.cargaTexto.textContent = t('cargando_sistema', { nombre: s[ui.idiomaUI.value === 'en' ? 'en' : 'es'] });
  try {
    await visor.cargarSistema(key, `${BASE}modelos/${s.file}`, s.structures, (ev) => {
      if (ev.lengthComputable) ui.cargaProgreso.style.width = `${Math.round((ev.loaded / ev.total) * 100)}%`;
    });
  } catch (err) {
    console.error(err); ui.cargaTexto.textContent = `Error: ${err.message || err}`;
    await new Promise((r) => setTimeout(r, 2500));
  } finally { ui.carga.hidden = true; }
  const cb = ui.capas.querySelector(`input[data-key="${key}"]`); if (cb) cb.checked = true;
}

// ---------- Selección, tooltip, ficha ----------
function alSeleccionar(node) {
  if (estudio.modo === 'localizar') { estudio.clicEnModelo(node); return; }
  if (estudio.modo === 'identificar') return; // en Identificar se responde con los botones
  visor.seleccionar(node); mostrarFicha(node);
}
function alPasar(node, e) {
  if (!node) { ui.tooltip.hidden = true; return; }
  if (estudio.modo !== 'explorar' && !estudio.resuelto) { ui.tooltip.hidden = true; return; } // no dar pistas
  const entry = manifiesto.porNodo.get(node); if (!entry) return;
  ui.tooltip.textContent = nombreCompleto(entry, langNombres, t);
  const r = $('.escena').getBoundingClientRect();
  ui.tooltip.style.left = `${e.clientX - r.left}px`; ui.tooltip.style.top = `${e.clientY - r.top}px`; ui.tooltip.hidden = false;
}
let nodoFicha = null;
function refrescarFicha() { mostrarFicha(nodoFicha); }
function mostrarFicha(node) {
  nodoFicha = node; const f = ui.ficha; f.innerHTML = '';
  const entry = node && manifiesto.porNodo.get(node);
  if (!entry) { const p = document.createElement('p'); p.className = 'vacio'; p.textContent = t('ficha_vacia'); f.appendChild(p); return; }
  const s = sistemaDe(manifiesto, entry.sistema);
  const h = document.createElement('h3'); h.textContent = nombreCompleto(entry, langNombres, t);
  if (entry.optional) { const et = document.createElement('span'); et.className = 'etiqueta'; et.textContent = t('opcional'); h.appendChild(et); }
  f.appendChild(h);
  const ruta = document.createElement('div'); ruta.className = 'ruta';
  // El primer eslabón del grupo repite el nombre del sistema en el atlas; se omite.
  const grupo = entry.group.filter((g, i) => !(i === 0 && g.toLowerCase() === s.en.toLowerCase()));
  ruta.textContent = [s[ui.idiomaUI.value === 'en' ? 'en' : 'es'], ...grupo].join(' › '); f.appendChild(ruta);
  const dl = document.createElement('dl');
  const filas = [['espanol', 'es'], ['ingles', 'en'], ['latin', 'la'], ['frances', 'fr'], ['portugues', 'pt']];
  for (const [k, l] of filas) {
    if (l === langNombres || !entry[l]) continue;
    const dt = document.createElement('dt'); dt.textContent = t(k); const dd = document.createElement('dd'); dd.textContent = entry[l]; dl.append(dt, dd);
  }
  f.appendChild(dl);
  const def = definicion(entry);
  const dh = document.createElement('h2'); dh.textContent = t('definicion'); f.appendChild(dh);
  const dp = document.createElement('p'); dp.className = 'def';
  if (def) {
    dp.textContent = def.summary + ' ';
    if (def.url) { const a = document.createElement('a'); a.href = def.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t('fuente_wiki'); dp.appendChild(a); }
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
  const res = buscar(manifiesto, q, langNombres, 40);
  if (q.trim().length >= 2 && !res.length) { const li = document.createElement('li'); li.className = 'sub'; li.textContent = t('sin_resultados'); ui.resultados.appendChild(li); return; }
  for (const e of res) {
    const li = document.createElement('li');
    li.textContent = nombreCompleto(e, langNombres, t);
    const sub = document.createElement('span'); sub.className = 'sub';
    const s = sistemaDe(manifiesto, e.sistema);
    sub.textContent = [s.es, e.la && e.la !== nombre(e, langNombres) ? e.la : null].filter(Boolean).join(' · ');
    li.appendChild(sub);
    li.onclick = async () => {
      if (!visor.tieneSistema(e.sistema)) await alternarSistema(e.sistema, true);
      else if (!visor.sistemasVisibles().includes(e.sistema)) alternarSistema(e.sistema, true);
      visor.ocultos.delete(e.node); visor.aislado = null; visor._aplicarVisibilidad();
      visor.seleccionar(e.node); visor.enfocar(e.node); mostrarFicha(e.node);
    };
    ui.resultados.appendChild(li);
  }
}

// ---------- Modos y progreso ----------
function cambiarModo(modo) {
  document.querySelectorAll('.modo').forEach((b) => b.classList.toggle('activo', b.dataset.modo === modo));
  visor.seleccionar(null); mostrarFicha(null);
  estudio.setModo(modo);
  pintarProgreso();
}
function pintarProgreso() {
  const r = estudio.progreso.resumen();
  ui.progreso.innerHTML = '';
  ui.progreso.textContent = r.n ? t('progreso_resumen', r) : t('progreso_vacio');
}
// Refresca el resumen cada vez que se registra una respuesta.
const _registrar = Estudio.prototype._cerrar;
Estudio.prototype._cerrar = function (ok) { _registrar.call(this, ok); pintarProgreso(); };

iniciar().catch((err) => { console.error(err); const p = document.createElement('p'); p.className = 'vacio'; p.textContent = `Error al iniciar: ${err.message || err}`; ui.ficha.replaceChildren(p); });
