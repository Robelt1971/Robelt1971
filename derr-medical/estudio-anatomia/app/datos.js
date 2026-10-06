// Carga y consulta del manifiesto de estructuras generado por scripts/exportar_zanatomy.py.
import { t, idiomaNombres } from './i18n.js';

export async function cargarManifiesto(base) {
  const r = await fetch(`${base}data/estructuras.json`);
  if (!r.ok) throw new Error(`No se pudo cargar data/estructuras.json (${r.status})`);
  const m = await r.json();
  // Tabla propia de DERR con neerlandés y papiamento (Z-Anatomy no los trae), indexada por nombre inglés.
  const rn = await fetch(`${base}data/nombres-nl-pap.json`).catch(() => null);
  const extra = rn && rn.ok ? await rn.json() : {};
  // Índices
  m.porNodo = new Map();
  m.lista = [];
  for (const s of m.systems) {
    for (const e of s.structures) {
      e.sistema = s.key;
      // La tabla trae <idioma> y <idioma>_fuente; se copian tal cual para no fijar aquí qué idiomas existen.
      if (extra[e.en]) Object.assign(e, extra[e.en]);
      m.porNodo.set(e.node, e);
      m.lista.push(e);
    }
  }
  return m;
}

let defs = null;
export async function cargarDefiniciones(base) {
  if (defs) return defs;
  const r = await fetch(`${base}data/definiciones.json`);
  defs = r.ok ? await r.json() : {};
  return defs;
}
export function definicion(e) { return defs && e.def ? defs[e.def] : null; }

// Nombre de la estructura en el idioma de nombres elegido. Cae al inglés si no hay traducción.
// Un nombre generado automáticamente (fuente 'ia') no se muestra nunca: un estudiante memoriza lo que
// lee, con aviso o sin él. En su lugar sale el latín (Terminologia Anatomica), que es además la
// nomenclatura que usa la práctica clínica en neerlandés; sin latín, el inglés.
export function nombre(e, lang = idiomaNombres()) {
  if (!e[lang]) return e.en;
  if (fuenteNombre(e, lang) === 'ia') return e.la || e.en;
  return e[lang];
}
// true si lo que muestra nombre() en ese idioma es el sustituto, porque el propio está sin revisar.
export function nombreSustituido(e, lang = idiomaNombres()) { return !!e[lang] && fuenteNombre(e, lang) === 'ia'; }
// Procedencia del nombre en un idioma ('wikipedia-nl', 'ia', 'revisado'…) o null si el dato viene del atlas.
export function fuenteNombre(e, lang = idiomaNombres()) { return e[`${lang}_fuente`] || null; }
// Nombre con lado: "Húmero (derecho)".
export function nombreCompleto(e) {
  const n = nombre(e);
  if (e.side === 'l') return `${n} (${t('lado_l')})`;
  if (e.side === 'r') return `${n} (${t('lado_r')})`;
  return n;
}
export function sistemaDe(m, key) { return m.systems.find((s) => s.key === key); }

function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
// Búsqueda por subcadena en todos los idiomas. Orden: coincidencia exacta, empieza por la
// consulta en el idioma mostrado, empieza por ella en otro idioma, contiene.
export function buscar(m, consulta, max = 30) {
  const q = normalizar(consulta.trim());
  if (q.length < 2) return [];
  const out = [];
  for (const e of m.lista) {
    const propio = normalizar(nombre(e));
    let rango = -1;
    if (propio === q) rango = 0;
    else if (propio.startsWith(q)) rango = 1;
    else if (campos0(e).some((c) => normalizar(c).startsWith(q))) rango = 2;
    else if (campos0(e).some((c) => normalizar(c).includes(q))) rango = 3;
    if (rango >= 0) out.push([rango, e]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1].en.length - b[1].en.length || a[1].en.localeCompare(b[1].en));
  return out.slice(0, max).map((x) => x[1]);
}
// Campos en los que se busca: los del atlas y los de la tabla propia que ya se muestran (no los generados).
function campos0(e) {
  return [e.es, e.en, e.la, e.fr, e.pt, ...['nl', 'pap'].map((l) => (fuenteNombre(e, l) === 'ia' ? null : e[l]))].filter(Boolean);
}
