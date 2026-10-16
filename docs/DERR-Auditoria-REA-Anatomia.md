# DERR — Auditoría de protección de código con REA: módulo de anatomía 3D

> Módulo auditado: [`Robelt1971/DERR-Medical-Anatomia`](https://github.com/Robelt1971/DERR-Medical-Anatomia),
> commit `5265f6f7c5f52122c73b6fdd901c063b10af756a` (v0.4).
> Herramienta: REA (Reverse Engineer Anything) `rea-agents` 6.5.0.
> Fecha: 2026-10-16 · Entorno: contenedor efímero en la nube, sin red durante el análisis.
> Estado: **sin hallazgos de severidad media o alta**.

---

## 0. Resumen (TL;DR)

- **Pregunta:** ¿qué puede sacar un tercero del código publicado del módulo, y
  hay algo en él (secretos, datos, fallos explotables) que no debería estar?
- **Respuesta:** nada que proteger. El módulo es MIT y estático. REA reconstruyó
  los 11 archivos JavaScript sin ofuscación, que es lo esperado. No hay secretos,
  datos de pacientes, peticiones a terceros ni rutas de XSS. Las bibliotecas
  vendorizadas coinciden byte a byte con la versión oficial de three.js.
- **Pendiente (severidad baja):** añadir una CSP, publicar en Pages solo lo que
  la app necesita y fijar las acciones de GitHub por SHA (§4).
- **Regla que se mantiene:** este frontend es público por diseño. Nunca debe
  llevar tokens, claves ni datos de pacientes. Lo que haya que proteger va en
  el servidor de DERR Medical System, no aquí.

---

## 1. Instalación de REA (solo fuentes oficiales)

Fuentes aceptadas: `npx rea-agents setup`, el repositorio `morluto/rea` o
`rea.tools`. El README oficial avisa de copias con nombres parecidos.

| Comprobación | Resultado |
|---|---|
| Paquete npm | `rea-agents@6.5.0`, mantenedor `morluto`, repositorio `github.com/morluto/rea` |
| Integridad del tarball | sha512 calculado = `dist.integrity` del registro (`C6BG7Lyr…veD+A==`) |
| Procedencia | Atestación SLSA v1 del registro npm: compilado por `.github/workflows/release.yml` de `morluto/rea`, rama `main` |
| Scripts de instalación | El paquete no declara `preinstall`/`install`/`postinstall` |
| Dependencias | 146 paquetes, `npm audit`: 0 vulnerabilidades |
| `npm audit signatures` | No se pudo completar (fallo de descarga a través del proxy del contenedor); suplido por las dos comprobaciones anteriores |

Aislamiento aplicado:

- Instalado en un prefijo propio dentro del *scratchpad* de la sesión, con
  `HOME` separado, `--ignore-scripts` y `--omit=optional` (se omite `frida`,
  innecesario para análisis estático).
- **No** se ejecutó `rea setup`: no se registró REA como servidor MCP ni se
  instaló su skill en Claude Code. Solo se usó la CLI, así que la regla
  SkillSpector (`DERR-Seguridad-Skills-SkillSpector.md`) no se activa. Si más
  adelante se quiere REA como MCP en una máquina DERR, antes hay que pasar su
  skill por SkillSpector y darla de alta en `DERR-Seguridad-Skills-Aprobadas.md`.
- El análisis corrió sobre una **copia de solo lectura** del módulo
  (`index.html`, `app/`, `vendor/`, `data/`; sin los GLB) y dentro de
  `unshare -n`, es decir, sin acceso a red.

Comando:

```bash
rea analyze-javascript-application <copia-solo-lectura> --json
```

REA solo lee los archivos como texto; no ejecuta el código analizado.

---

## 2. Lo que REA reconstruyó

| Dato | Valor |
|---|---|
| Archivos relevantes | 15 (11 JS analizados, 1 HTML, 3 JSON) |
| Nodos AST visitados | 215 096 |
| Fallos de análisis | 0 (`GLTFLoader.js` y `three.module.min.js` con análisis parcial, por tamaño) |
| Mapas de fuente (`sourceMappingURL`) | ninguno |
| Ofuscación | ninguna; el código propio está legible tal cual |

Superficie detectada:

| Tipo | Dónde | Valoración |
|---|---|---|
| Parámetros de URL `ui`, `nombres` | `app/i18n.js:116-120` | Se aceptan solo los valores de una lista cerrada (`TEXTOS`, `IDIOMAS_NOMBRES`). Correcto |
| `localStorage` | `app/i18n.js:99-100`, `app/estudio.js:11,25` | Solo idioma y progreso de estudio; lectura con `try/catch` y `JSON.parse` protegido. Sin datos personales |
| `fetch` | `app/datos.js:5,9,29` | Solo archivos propios en `data/`, rutas fijas |
| Worker / WASM | `vendor/three/meshopt_decoder.module.js` | WASM del decodificador meshopt (oficial). La app no activa sus workers |
| "Endpoints de red" restantes | `three.module.min.js` | Falsos positivos de REA: son nombres de extensiones WebGL leídos con `.get()` |

---

## 3. Comprobaciones complementarias (manuales)

Hechas sobre el código fuente para confirmar lo que REA marca como candidato.

- **XSS:** todo texto llega al DOM con `textContent`. `innerHTML` se usa solo
  para vaciar contenedores (`= ''`). Los enlaces de definiciones
  (`app/main.js:150`) toman `def.url` de `data/definiciones.json`, que es
  estático y del propio repositorio: 1 125 URL de `en.wikipedia.org`, 1 de
  `ta2viewer.openanatomy.org`, 247 vacías. Ninguna con esquema peligroso.
- **Secretos:** búsqueda de claves, tokens, contraseñas y prefijos típicos
  (`ghp_`, `sk-`, `AKIA`) fuera de `vendor/`: ninguno. La única coincidencia es
  `id-token: write` del flujo de Pages, que es un permiso de GitHub, no un secreto.
- **Cadena de suministro:** `three.module.min.js`, `three.core.min.js`,
  `OrbitControls.js`, `GLTFLoader.js`, `meshopt_decoder.module.js` y
  `BufferGeometryUtils.js` son **idénticos** a los de `three@0.182.0` en npm.
- **Peticiones externas:** ninguna en la carga. `tests/humo.mjs` ya lo verifica
  en cada prueba de humo.

---

## 4. Hallazgos

| # | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| 1 | Baja | `index.html` no declara Content-Security-Policy. Hoy no hay una ruta de inyección, pero una CSP limita el daño si un cambio futuro la introduce | Añadir en `<head>`: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-59vnMKVIJ9Jv7WUn1DfFSHnM1C6Y2uSxegfM0TZwXx8=' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">`. El hash corresponde al `importmap` actual y cambia si se edita. Validar con `tests/humo.mjs` antes de publicar |
| 2 | Baja | `pages.yml` publica todo el repositorio (`path: .`): `scripts/`, `docs/`, `tests/`, `.github/` | Publicar solo `index.html`, `app/`, `vendor/`, `data/`, `modelos/` y los archivos de licencia (`LICENSE`, `LICENSES.md`, que el pie enlaza) |
| 3 | Baja | Acciones de GitHub fijadas por etiqueta (`@v4`, `@v5`, `@v3`), no por SHA | Fijar por SHA de commit; el flujo tiene `id-token: write` y `pages: write` |
| 4 | Info | `a.href = def.url` sin filtro de esquema. Los datos son propios y hoy están limpios | Defensa en profundidad: aceptar solo `https:` (`new URL(def.url).protocol === 'https:'`) |
| 5 | Info | GitHub Pages no permite enviar `frame-ancestors`; cualquier sitio puede incrustar el módulo | Aceptable: no hay acciones sensibles (lo más grave es "Borrar progreso local") |

Ninguno de estos cambios se ha aplicado en `DERR-Medical-Anatomia`; esta
auditoría solo informa.

---

## 5. Reproducir

```bash
npm pack rea-agents@6.5.0
# comparar sha512 del .tgz con: npm view rea-agents@6.5.0 dist.integrity
npm install --prefix <dir-aislado> --ignore-scripts --omit=optional ./rea-agents-6.5.0.tgz
cp -r index.html app vendor data <copia> && chmod -R a-w <copia>
unshare -n <dir-aislado>/node_modules/.bin/rea analyze-javascript-application <copia> --json > informe.json
```

La salida completa (~129 MB de Evidence JSON) no se guarda en el repositorio;
se regenera con el comando anterior.
