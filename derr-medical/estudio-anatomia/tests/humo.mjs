// Prueba de humo del módulo en Chromium sin cabeza (Playwright). Uso, desde esta carpeta:
//   python3 -m http.server 8080 &   node tests/humo.mjs [http://127.0.0.1:8080/]
// Comprueba: la página carga sin errores ni peticiones externas; los 8 GLB se decodifican y cada
// sistema mapea tantas estructuras como declara el manifiesto; dos cargas simultáneas del mismo
// sistema comparten una promesa; el selector avisa de los idiomas pendientes; con nombres en papiamento
// un nombre sin revisar sale en latín (y uno revisado, en papiamento) en buscador y ficha; Identificar
// avisa cuando la ronda lleva algún nombre sustituido. Sale con 1 si algo falla.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const url = process.argv[2] || 'http://127.0.0.1:8080/';
const fallos = [];
const ok = (cond, msg) => { if (!cond) fallos.push(msg); console.log(`${cond ? 'OK ' : 'FALLO'} ${msg}`); };

const browser = await chromium.launch();
const page = await browser.newPage();
const errores = [], externas = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
page.on('request', (r) => { if (!r.url().startsWith(new URL(url).origin)) externas.push(r.url()); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
ok(await page.$('canvas') !== null, 'hay canvas');

const sistemas = await page.evaluate(async () => {
  const { visor, manifiesto } = window.__derr; const out = {};
  for (const s of manifiesto.systems) {
    const url = `./modelos/${s.file}`;
    const p1 = visor.cargarSistema(s.key, url, s.structures), p2 = visor.cargarSistema(s.key, url, s.structures);
    const [sis, sis2] = await Promise.all([p1, p2]);
    // Un sistema ya cargado devuelve promesas distintas pero el mismo objeto; uno en carga, la misma promesa.
    out[s.key] = { mapeadas: sis.estructuras.size, declaradas: s.count, mismaCarga: sis === sis2 && visor.scene.children.filter((o) => o.name === s.key).length === 1 };
  }
  return out;
});
for (const [k, v] of Object.entries(sistemas)) {
  ok(v.mapeadas === v.declaradas, `${k}: ${v.mapeadas}/${v.declaradas} estructuras mapeadas`);
  ok(v.mismaCarga, `${k}: la doble carga no duplica el sistema`);
}
const opciones = await page.$$eval('#idioma-nombres option', (os) => os.filter((o) => ['nl', 'pap'].includes(o.value)).map((o) => o.textContent));
ok(opciones.every((t) => t.endsWith('⚠')), 'el selector marca nl y pap como pendientes');
await page.$eval('#idioma-nombres', (sel) => { sel.value = 'pap'; sel.dispatchEvent(new Event('change')); });
// Con los 8 sistemas cargados y WebGL por software, Playwright no ve el botón "estable": se pulsa por JS.
const pulsarModo = (modo) => page.$eval(`button.modo[data-modo="${modo}"]`, (b) => b.click());
await pulsarModo('identificar');
await page.waitForTimeout(500);
ok((await page.$$('#estudio .opciones button')).length === 4, 'Identificar ofrece 4 opciones');
ok(await page.$('#estudio .aviso') !== null, 'Identificar avisa cuando la ronda lleva nombres sustituidos');
await pulsarModo('explorar');
const buscar = async (q) => { await page.$eval('#buscador', (i, v) => { i.value = v; i.dispatchEvent(new Event('input')); }, q); await page.waitForTimeout(400); return page.$eval('#resultados li', (li) => li.firstChild.textContent); };
// El fémur tiene papiamento generado ('ia'): el buscador y la ficha deben enseñar el latín, sin el nombre generado.
const femur = await page.evaluate(() => { const e = window.__derr.manifiesto.porNodo.get('Femur.r'); return { la: e.la, pap: e.pap, fuente: e.pap_fuente }; });
ok(femur.fuente === 'ia' && femur.la, `dato de prueba: Femur.r tiene papiamento generado y latín (${femur.la})`);
let primero = await buscar('femur');
ok(primero.startsWith(femur.la) && !primero.includes('⚠'), `un nombre sin revisar sale en latín (${primero})`);
await page.$eval('#resultados li', (li) => li.click()); await page.waitForTimeout(300);
const ficha = await page.evaluate(() => ({ titulo: document.querySelector('#ficha h3').firstChild.textContent, etiqueta: document.querySelector('#ficha h3 .etiqueta')?.textContent || '', cuerpo: document.querySelector('#ficha dl').textContent }));
ok(ficha.titulo.startsWith(femur.la) && ficha.etiqueta.includes('⚠') && !ficha.cuerpo.includes(femur.pap), `la ficha explica la sustitución y no muestra el nombre generado (${ficha.etiqueta})`);
// Un nombre revisado sí se muestra: se simula la revisión de ese dato en memoria.
await page.evaluate(() => { window.__derr.manifiesto.porNodo.get('Femur.r').pap_fuente = 'revisado'; });
primero = await buscar('femur');
ok(primero.startsWith(femur.pap), `un nombre revisado sale en papiamento (${primero})`);
ok(externas.length === 0, `sin peticiones externas (${externas.length})`);
ok(errores.length === 0, `sin errores de JavaScript (${errores.slice(0, 2).join(' | ')})`);
await browser.close();
console.log(fallos.length ? `\n${fallos.length} fallos` : '\nTodo OK');
process.exit(fallos.length ? 1 : 0);
