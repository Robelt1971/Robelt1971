# DERR Medical — Módulo de estudio de anatomía 3D (base Z-Anatomy)

> Spec e historial de decisión del primer módulo de DERR Medical. **Sin PHI:**
> el módulo es material de estudio; no toca KIA/GNC ni `DERR-Protected-Data`.
> Fecha: 2026-10-05 · **Estado: v0.2 FUNCIONAL** — visor + tres modos de
> estudio, 8 sistemas, 3 172 estructuras, nombres en 7 idiomas (nl y pap
> pendientes de revisión clínica); verificado en Chromium headless.
> Código en `derr-medical/estudio-anatomia/`.

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

**En alcance (v0.1):**
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

---

## 4. Datos (cifras de la exportación del 2026-10-05)

| Sistema | Estructuras | GLB |
|---|---|---|
| Esquelético | 277 | 2,2 MB |
| Articulaciones | 413 | 1,2 MB |
| Muscular | 683 | 6,2 MB |
| Cardiovascular | 673 | 10,3 MB |
| Órganos linfoides | 163 | 0,5 MB |
| Nervioso y órganos de los sentidos | 588 | 6,1 MB |
| Visceral | 119 | 2,9 MB |
| Regiones del cuerpo | 256 | 0,7 MB |
| **Total** | **3 172** | **29 MB** |

- 1 821 nombres únicos (sin lado); 1 760 con traducción es/fr/pt/la; 1 374 con
  definición.
- Se excluyen del export: etiquetas 3D (FONT), grupos `.g`/`.j`, inserciones
  (`.i`, `.ol/.or/.el/.er`), objetos con `?` en el nombre, y la "Bonus
  collection" (duplicados por región).
- Las estructuras entre paréntesis en el atlas son variantes anatómicas; se
  exportan, se marcan como `optional` y **no entran en los ejercicios**.

---

## 5. Verificación realizada

Prueba automatizada en Chromium headless (Playwright, WebGL por SwiftShader):
carga del esqueleto, selección por clic con ficha rellena, búsqueda "húmero" y
selección desde resultados, modo Identificar con 4 opciones y registro de
progreso, modo Localizar resuelto, carga del sistema cardiovascular, cambio de
idioma de la interfaz. Sin errores de consola. Capturas revisadas manualmente.

Pendiente de probar en hardware real: rendimiento con todos los sistemas
activos (~3,6 M de triángulos) en portátiles sin GPU dedicada.

---

## 6. Pendientes y siguientes pasos

1. **Licencia NC:** el oído interno (Univ. de Dundee, CC BY-NC-SA) y el riñón
   (Lissie Cowley, CC BY-NC) dentro de Z-Anatomy son no comerciales. Antes de
   cualquier uso comercial de DERR Medical: identificar esos objetos en el
   `.blend` y excluirlos en el export o sustituirlos.
2. **Papiamento y neerlandés en nombres: HECHO (v0.2, 2026-10-05), pendiente
   de revisión clínica.** Tabla `data/nombres-nl-pap.json` (1 819 nombres)
   indexada por nombre inglés, con fuente por entrada: 332 neerlandeses
   verificados contra el título del artículo de la Wikipedia en neerlandés
   (solo cuando el artículo trata exactamente esa estructura; los artículos
   genéricos como "middenhandsbeen" para "tercer metacarpiano" se descartaron),
   1 487 neerlandeses y los 1 819 papiamentos generados por modelo de lenguaje
   con ortografía etimológica de Aruba. La ficha marca cada nombre con su
   fuente. Falta: revisión por personal clínico con
   `data/revision-nombres-nl-pap.csv` y envío de la tabla a Z-Anatomy.
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
