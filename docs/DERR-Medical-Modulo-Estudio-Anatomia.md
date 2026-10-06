# DERR Medical — Módulo de estudio de anatomía 3D (base Z-Anatomy)

> Spec e historial de decisión del primer módulo de DERR Medical. **Sin PHI:**
> el módulo es material de estudio; no toca KIA/GNC ni `DERR-Protected-Data`.
> Fecha: 2026-10-06 · **Estado: v0.4 FUNCIONAL** — visor + tres modos de
> estudio, 8 sistemas, 2 984 estructuras (sin los modelos de origen no
> comercial o sin licencia declarada ni las curvas auxiliares sin geometría), nombres en 7 idiomas (nl y pap: solo se muestran los revisados o de Wikipedia; el resto sale en latín);
> código MIT, modelos y datos CC BY-SA 4.0; verificado con `tests/humo.mjs` en Chromium headless.
> Código en `derr-medical/estudio-anatomia/`. · Responsable: Ernesto (Albert Rodríguez Robelt)

---

## 1. Decisión: por qué Z-Anatomy y no BioDigital

Se evaluó `human.biodigital.com` como fuente de modelos (2026-10-05):

- Tiene plan gratuito (contenido básico, ~10 vistas al mes) y planes de pago
  (USD 9.99/mes; empresa por contacto comercial). Desde mayo de 2026 retiraron
  Personal Plus y las pruebas instantáneas de School/Business.
- Sus modelos son propiedad intelectual de BioDigital. Los términos prohíben
  descargar, copiar, hacer ingeniería inversa o redistribuir. Extraer mallas del
  navegador o "rehacerlas" copiando su geometría sería obra derivada no
  autorizada. **Descartado.**

Alternativa elegida: **Z-Anatomy**, atlas 3D libre (CC BY-SA 4.0) iniciado en
2021 por el ilustrador médico Gauthier Kervyn sobre BodyParts3D (DBCLS, Japón,
CC BY-SA 2.1 JP). Ventajas: licencia que permite uso, modificación y
redistribución; nomenclatura Terminologia Anatomica con traducción al español;
definiciones enlazadas; proyecto activo (export automático del 2026-10-04).
Coste: obligación de **atribuir y compartir igual** los modelos y datos
derivados (no el código). Detalle en `derr-medical/estudio-anatomia/LICENSES.md`.

Otras opciones consideradas y descartadas por ahora: BodyParts3D directo (misma
base pero sin traducciones ni organización por sistemas), Open Anatomy Project
(CC BY, atlas regionales, menos cobertura de cuerpo completo), packs comerciales
(Sketchfab/TurboSquid: coste y licencias por asiento).

---

## 2. Objetivo y alcance

**Objetivo:** que estudiantes y personal clínico de DERR puedan estudiar
anatomía en 3D en español, inglés y latín (TA), con ejercicios de
reconocimiento y localización y seguimiento del propio progreso.

**En alcance (v0.4):**
- Visor 3D por sistemas con selección, búsqueda multilingüe, ficha (nombres,
  grupo anatómico, definición), aislar/ocultar/enfocar.
- Modo **Identificar** (estructura resaltada → elegir nombre entre 4).
- Modo **Localizar** (nombre → clic en el modelo, 3 intentos).
- Progreso por estructura en el navegador, con repaso priorizado de fallos.
- Interfaz en español, inglés y neerlandés; nombres en es/en/la/nl/pap/fr/pt.
- Pipeline reproducible desde el `.blend` original.

**Fuera de alcance (explícito):**
- Cuentas de usuario, sincronización o cualquier dato personal. El progreso vive
  en `localStorage` y se puede borrar desde la interfaz.
- Validación lingüística: los nombres en neerlandés y papiamento son tabla
  propia y no están revisados por personal clínico (ver §6).
- Inserciones musculares, biomecánica (armature) y cortes transversales del
  atlas original.
- Edición de modelos. DERR no modifica la geometría; solo la recolorea en el
  visor.

---

## 3. Arquitectura

```
Z-Anatomy/The-blend (GitHub, CC BY-SA 4.0)
  └─ Z-Anatomy.zip → Startup.blend (300 MB, Blender 3.5)
        │  scripts/exportar_zanatomy.py  (bpy 4.5.14, headless)
        │  · 1 GLB por sistema (nodo = objeto; nombre = inglés + .l/.r)
        │  · estructuras.json (en/es/la/fr/pt, lado, grupo, materiales, def)
        │  · definiciones.json (resumen Wikipedia + URL)
        ▼
  scripts/comprimir.sh  (gltfpack -cc -kn -km -vpf)  129 MB → 29 MB
        ▼
derr-medical/estudio-anatomia/            ← estático, sin build, sin backend
  index.html + app/{main,visor,datos,estudio,i18n}.js + vendor/three (MIT)
```

Decisiones técnicas:

- **Estático y sin dependencias de red:** three.js y el decodificador meshopt
  van vendorizados; nada se descarga de CDN. Encaja con la regla DERR de no
  depender de terceros en tiempo de ejecución.
- **Un GLB por sistema, carga perezosa:** el esqueleto (2,2 MB) carga al abrir;
  el resto al activar la capa. Permite uso con conexiones modestas.
- **Identidad por nombre de nodo:** la app no depende de IDs internos de
  Blender. Cada nodo del GLB se llama como el objeto del atlas
  (`Humerus.r`), y el manifiesto usa esa misma clave. Si Z-Anatomy renombra
  una estructura, se regenera todo con el pipeline.
- **Paleta propia por familia de material:** los colores del atlas están
  pensados para su shader de Blender; el visor asigna una paleta clínica
  (hueso marfil, arterias rojo, venas azul, nervios amarillo, músculo rojo
  oscuro…) según el nombre del material. Este es el primer punto donde DERR
  aporta diseño propio sin tocar la geometría.
- **Compresión meshopt con posiciones en coma flotante:** la cuantización de
  14 bits daba hasta 24 % de error en estructuras milimétricas (huesecillos,
  vasos finos); `-vpf` lo evita a cambio de ~7 MB más.
- **Dónde viven los binarios (decisión 2026-10-06): repositorio propio, GLB
  como blobs normales, sin Git LFS.** Se descarta LFS porque GitHub Pages no
  sirve archivos LFS (entrega los punteros) y su cuota mensual de ancho de
  banda se agota con pocas descargas; se descarta el alojamiento externo
  porque rompería la propiedad, verificada en `tests/humo.mjs`, de que la app
  no hace ninguna petición fuera de su origen. El coste es que cada
  regeneración añade los GLB regenerados al historial (hoy 27 MB en total, 4 MB
  en la regeneración del 2026-10-06, que solo tocó `nervioso.glb`): se
  regenera poco y agrupando cambios, y el pipeline es reproducible byte a byte
  (`visceral.glb` salió idéntico al regenerarlo), así que un GLB solo cambia
  cuando cambian su fuente o sus exclusiones. El traslado desde este
  repositorio de perfil, conservando el historial del módulo, lo hace
  `scripts/migrar_repo.sh` una vez exista el repositorio destino (requiere
  crearlo a mano en GitHub: la integración de esta sesión no puede crear
  repositorios).
- **Separación de responsabilidades en la app:** `i18n.js` es el único dueño
  del idioma de interfaz y del de nombres (y de su persistencia) y de las
  etiquetas de sistema; `estudio.js` tiene toda la política de los modos en
  una tabla (`MODOS`) y avisa por callbacks; `visor.js` es el único que toca
  visibilidad y selección 3D; `main.js` solo cablea. Añadir un modo o un
  idioma de interfaz es una entrada nueva en una tabla, no ramas repartidas.

---

## 4. Datos (cifras de la exportación del 2026-10-06)

| Sistema | Estructuras | GLB |
|---|---|---|
| Esquelético | 277 | 2,2 MB |
| Articulaciones | 413 | 1,2 MB |
| Muscular | 683 | 6,2 MB |
| Cardiovascular | 673 | 10,3 MB |
| Órganos linfoides | 163 | 0,5 MB |
| Nervioso y órganos de los sentidos | 404 | 4,0 MB |
| Visceral | 115 | 2,9 MB |
| Regiones del cuerpo | 256 | 0,7 MB |
| **Total** | **2 984** | **27 MB** |

- Nombres únicos (sin lado), traducciones y definiciones: las cifras actuales
  las imprime `scripts/verificar_datos.py`; la tabla de arriba es la de la
  exportación indicada y se actualiza con cada regeneración.
- Se excluyen del export: etiquetas 3D (FONT), grupos `.g`/`.j`, inserciones
  (`.i`, `.ol/.or/.el/.er`), objetos con `?` en el nombre, la "Bonus
  collection" (duplicados por región) y las 182 estructuras de
  `scripts/exclusiones.json`: 8 de origen no comercial (vestíbulo, cóclea,
  riñón y pelvis renal, ambos lados) y 174 de licencia no declarada (corteza
  parcelada, sustancia blanca y tractos de la Universidad de Washington). La
  misma configuración omite la definición de `Intermediate bronchus`
  (Radiopaedia, CC BY-NC-SA). Se omiten también del manifiesto los objetos que salen
  del export como nodos sin malla (6 curvas auxiliares del ojo: ejes,
  meridianos, ecuador, cuerpo ciliar): el visor no puede seleccionarlos y en
  los ejercicios serían preguntas sin respuesta posible. El manifiesto los
  lista en `sin_geometria`; `scripts/verificar_datos.py` lo comprueba.
- Las estructuras entre paréntesis en el atlas son variantes anatómicas; se
  exportan, se marcan como `optional` y **no entran en los ejercicios**.

---

## 5. Verificación

`derr-medical/estudio-anatomia/tests/humo.mjs` (Playwright, Chromium headless
con WebGL por SwiftShader) comprueba en cada cambio: carga sin errores ni
peticiones externas; los 8 GLB se decodifican y cada sistema mapea tantas
estructuras como declara el manifiesto; dos cargas simultáneas del mismo
sistema comparten una promesa; el selector avisa de los idiomas pendientes;
Identificar ofrece 4 opciones y avisa con nombres en papiamento; el buscador
marca los nombres generados. `scripts/verificar_datos.py` comprueba la
coherencia de los datos sin navegador. Cómo ejecutarlos: README del módulo.

Pendiente de probar en hardware real: rendimiento con todos los sistemas
activos (~3,6 M de triángulos) en portátiles sin GPU dedicada.

---

## 6. Pendientes y siguientes pasos

1. **Licencia NC: HECHO (v0.3, 2026-10-05).** El oído interno (Univ. de
   Dundee, CC BY-NC-SA) y el riñón (Lissie Cowley, CC BY-NC) dentro de
   Z-Anatomy son no comerciales. Se identificaron en el `.blend` (colección
   "Internal ear": `Vestibule` y `Cochlea`; colección "Urinary system":
   `Kidney` y `Renal pelvis`) y el export los omite mediante
   `scripts/exclusiones.json`; el manifiesto registra los 8 objetos omitidos.
   Queda como hueco didáctico: el visor no muestra oído interno ni riñones.
   Opción futura: sustituirlos por mallas CC BY-SA de BodyParts3D (que sí
   incluye riñón y laberinto óseo) con el mismo pipeline.
   **UW: HECHO (v0.4, 2026-10-06).** Los 103 objetos cerebrales de la UW
   ("Brainder", "White matter"; material `Brain`, `Brain-Inner`, `White
   matter`) no declaran licencia en el atlas y se excluyen con el mismo
   mecanismo (`scripts/listar_uw.py` mantiene la lista). Hueco didáctico:
   sin corteza parcelada ni tractos. **Pendiente de la respuesta de
   Z-Anatomy** a la consulta de `docs/consulta-licencia-UW.md` (en el módulo);
   si la licencia es compatible, se retiran de la lista y se regenera.
   **Licencia del código: HECHO (v0.4).** MIT, archivo `LICENSE`; modelos y
   datos siguen bajo CC BY-SA 4.0 (`LICENSES.md`).
2. **Papiamento y neerlandés en nombres: HECHO (v0.2, 2026-10-05); política
   de muestra cambiada en v0.4.** Tabla `data/nombres-nl-pap.json` indexada
   por nombre inglés, con fuente por entrada: neerlandeses verificados contra
   el título del artículo de la Wikipedia en neerlandés (solo cuando el
   artículo trata exactamente esa estructura; los artículos genéricos como
   "middenhandsbeen" para "tercer metacarpiano" se descartaron) y el resto del
   neerlandés y todo el papiamento generados por modelo de lenguaje con
   ortografía etimológica de Aruba. **Decisión v0.4:** un nombre generado no
   se muestra, ni con aviso, porque un estudiante memoriza lo que lee; en su
   lugar la app enseña el latín y lo dice (`datos.js`, `nombre()`). Los
   nombres aparecen conforme un revisor clínico los aprueba por oleadas
   (`scripts/oleada_revision.py` → Excel → `scripts/aplicar_revision.py`);
   la primera oleada propuesta es esquelético y muscular. Cuántos quedan:
   `oleada_revision.py --listar`. Falta: la revisión en sí (una persona de
   DERR con papiamento nativo y formación sanitaria) y el envío de la tabla a
   Z-Anatomy.
3. **Unidades didácticas:** listas curadas de estructuras (p. ej. "Hueso
   temporal", "Plexo braquial") para que el alcance de los ejercicios no sea
   solo por sistema.
4. **Inserciones musculares** como capa opcional (ya están en el `.blend`).
5. **Cortes y transparencia** por sistema (el atlas tiene planos de corte).
6. **Validación clínica:** revisión por un médico de los nombres en español
   que caen al inglés y de las definiciones (Wikipedia no es fuente final).
7. **Rendimiento:** LOD con `-si` de gltfpack para el muscular y el
   cardiovascular si hace falta en equipos modestos.
8. Revisar cada actualización de Z-Anatomy (export automático semanal en su
   repo) y regenerar con el pipeline; anotar commit de origen en `LICENSES.md`.
