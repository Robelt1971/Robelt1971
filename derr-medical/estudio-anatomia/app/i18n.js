// Textos de la interfaz. Los nombres anatómicos vienen de los datos (Z-Anatomy), no de aquí.
export const TEXTOS = {
  es: {
    titulo: 'Estudio de anatomía 3D',
    modo_explorar: 'Explorar', modo_identificar: 'Identificar', modo_localizar: 'Localizar',
    idioma_ui: 'Interfaz', idioma_nombres: 'Nombres',
    capas: 'Sistemas', mostrar_todo: 'Mostrar todo', reset_vista: 'Centrar vista', solo: 'solo',
    buscar: 'Buscar estructura', buscar_ph: 'Ej. húmero, nervio ciático…', sin_resultados: 'Sin resultados',
    ayuda: 'Arrastra para girar · rueda para acercar · clic para seleccionar · doble clic para enfocar',
    ficha_vacia: 'Selecciona una estructura en el modelo o búscala por nombre.',
    cargando: 'Cargando', lado_l: 'izquierdo', lado_r: 'derecho', opcional: 'variante',
    sistema: 'Sistema', latin: 'Latín (TA)', ingles: 'Inglés', frances: 'Francés', portugues: 'Portugués', espanol: 'Español', neerlandes: 'Neerlandés', papiamento: 'Papiamento',
    sin_revisar: 'traducción automática, pendiente de revisión clínica', fuente_wiki_nl: 'Wikipedia (nl)',
    definicion: 'Definición', fuente_wiki: 'Fuente: Wikipedia (en), CC BY-SA', fuente_otra: 'Fuente: {host}', sin_definicion: 'Sin definición disponible en los datos de origen.',
    ocultar: 'Ocultar', aislar: 'Aislar', enfocar: 'Enfocar',
    progreso: 'Progreso', borrar_progreso: 'Borrar progreso local', progreso_resumen: '{n} estructuras practicadas · {ok} aciertos · {mal} fallos',
    progreso_vacio: 'Aún no has practicado. Usa los modos Identificar o Localizar.',
    alcance: 'Alcance:', alcance_visibles: 'sistemas visibles', repasar_debiles: 'Priorizar las que fallo',
    marcador: 'Sesión: {ok}/{n} aciertos · racha {racha}',
    pregunta_identificar: '¿Qué estructura está resaltada?',
    pregunta_localizar: 'Haz clic en el modelo sobre: {nombre}',
    correcto: 'Correcto.', incorrecto: 'Incorrecto. Era: {nombre}', casi: 'Esa es {nombre}. Inténtalo de nuevo ({n} intentos restantes).',
    siguiente: 'Siguiente', mostrar_respuesta: 'Mostrar respuesta', saltar: 'Saltar',
    sin_estructuras: 'No hay estructuras visibles para practicar. Activa algún sistema.',
    borrar_confirmar: '¿Borrar el progreso guardado en este navegador?',
    cargando_sistema: 'Cargando {nombre}…',
  },
  en: {
    titulo: '3D anatomy study',
    modo_explorar: 'Explore', modo_identificar: 'Identify', modo_localizar: 'Locate',
    idioma_ui: 'Interface', idioma_nombres: 'Names',
    capas: 'Systems', mostrar_todo: 'Show all', reset_vista: 'Reset view', solo: 'only',
    buscar: 'Find a structure', buscar_ph: 'e.g. humerus, sciatic nerve…', sin_resultados: 'No results',
    ayuda: 'Drag to rotate · wheel to zoom · click to select · double-click to focus',
    ficha_vacia: 'Select a structure in the model or search it by name.',
    cargando: 'Loading', lado_l: 'left', lado_r: 'right', opcional: 'variant',
    sistema: 'System', latin: 'Latin (TA)', ingles: 'English', frances: 'French', portugues: 'Portuguese', espanol: 'Spanish', neerlandes: 'Dutch', papiamento: 'Papiamento',
    sin_revisar: 'machine translation, pending clinical review', fuente_wiki_nl: 'Wikipedia (nl)',
    definicion: 'Definition', fuente_wiki: 'Source: Wikipedia (en), CC BY-SA', fuente_otra: 'Source: {host}', sin_definicion: 'No definition available in the source data.',
    ocultar: 'Hide', aislar: 'Isolate', enfocar: 'Focus',
    progreso: 'Progress', borrar_progreso: 'Clear local progress', progreso_resumen: '{n} structures practised · {ok} correct · {mal} wrong',
    progreso_vacio: 'Nothing practised yet. Use the Identify or Locate modes.',
    alcance: 'Scope:', alcance_visibles: 'visible systems', repasar_debiles: 'Prioritise the ones I miss',
    marcador: 'Session: {ok}/{n} correct · streak {racha}',
    pregunta_identificar: 'Which structure is highlighted?',
    pregunta_localizar: 'Click on the model on: {nombre}',
    correcto: 'Correct.', incorrecto: 'Incorrect. It was: {nombre}', casi: 'That is {nombre}. Try again ({n} attempts left).',
    siguiente: 'Next', mostrar_respuesta: 'Show answer', saltar: 'Skip',
    sin_estructuras: 'No visible structures to practise. Enable a system.',
    borrar_confirmar: 'Clear the progress saved in this browser?',
    cargando_sistema: 'Loading {nombre}…',
  },
  nl: {
    titulo: '3D-anatomie studeren',
    modo_explorar: 'Verkennen', modo_identificar: 'Herkennen', modo_localizar: 'Aanwijzen',
    idioma_ui: 'Interface', idioma_nombres: 'Namen',
    capas: 'Stelsels', mostrar_todo: 'Alles tonen', reset_vista: 'Beeld centreren', solo: 'alleen',
    buscar: 'Structuur zoeken', buscar_ph: 'bv. humerus, nervus ischiadicus…', sin_resultados: 'Geen resultaten',
    ayuda: 'Slepen om te draaien · scrollen om te zoomen · klik om te selecteren · dubbelklik om te focussen',
    ficha_vacia: 'Selecteer een structuur in het model of zoek op naam.',
    cargando: 'Laden', lado_l: 'links', lado_r: 'rechts', opcional: 'variant',
    sistema: 'Stelsel', latin: 'Latijn (TA)', ingles: 'Engels', frances: 'Frans', portugues: 'Portugees', espanol: 'Spaans', neerlandes: 'Nederlands', papiamento: 'Papiaments',
    sin_revisar: 'automatische vertaling, klinische controle nog niet gedaan', fuente_wiki_nl: 'Wikipedia (nl)',
    definicion: 'Definitie', fuente_wiki: 'Bron: Wikipedia (en), CC BY-SA', fuente_otra: 'Bron: {host}', sin_definicion: 'Geen definitie beschikbaar in de brongegevens.',
    ocultar: 'Verbergen', aislar: 'Isoleren', enfocar: 'Focus',
    progreso: 'Voortgang', borrar_progreso: 'Lokale voortgang wissen', progreso_resumen: '{n} structuren geoefend · {ok} goed · {mal} fout',
    progreso_vacio: 'Nog niets geoefend. Gebruik Herkennen of Aanwijzen.',
    alcance: 'Bereik:', alcance_visibles: 'zichtbare stelsels', repasar_debiles: 'Voorrang aan wat ik fout doe',
    marcador: 'Sessie: {ok}/{n} goed · reeks {racha}',
    pregunta_identificar: 'Welke structuur is gemarkeerd?',
    pregunta_localizar: 'Klik in het model op: {nombre}',
    correcto: 'Goed.', incorrecto: 'Fout. Het was: {nombre}', casi: 'Dat is {nombre}. Probeer opnieuw ({n} pogingen over).',
    siguiente: 'Volgende', mostrar_respuesta: 'Antwoord tonen', saltar: 'Overslaan',
    sin_estructuras: 'Geen zichtbare structuren om te oefenen. Zet een stelsel aan.',
    borrar_confirmar: 'De in deze browser opgeslagen voortgang wissen?',
    cargando_sistema: '{nombre} laden…',
  },
};

let actual = 'es';
export function setIdioma(code) { actual = TEXTOS[code] ? code : 'es'; }
export function idioma() { return actual; }
export function t(clave, vars = {}) {
  const s = (TEXTOS[actual] && TEXTOS[actual][clave]) ?? TEXTOS.es[clave] ?? clave;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
// Aplica los textos a los elementos marcados con data-i18n / data-i18n-ph.
export function aplicar(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (k.endsWith('_html')) return; // el HTML de los créditos no se traduce (atribución legal fija)
    el.textContent = t(k);
  });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}
