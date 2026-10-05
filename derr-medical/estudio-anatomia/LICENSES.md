# Licencias del módulo de estudio de anatomía

Este módulo mezcla contenido con dos regímenes distintos. Léelo antes de
redistribuir cualquier parte.

## 1. Modelos 3D y datos anatómicos: CC BY-SA 4.0 (copyleft)

Las carpetas `modelos/` y `data/` son **obras derivadas** del atlas libre
Z-Anatomy. Z-Anatomy se publica bajo Creative Commons Atribución-CompartirIgual
4.0 Internacional (CC BY-SA 4.0), que obliga a:

- **Atribuir** a los autores originales en cualquier copia o derivado.
- **Compartir igual:** todo derivado de los modelos o de los datos (incluidos
  los GLB comprimidos, el manifiesto `estructuras.json` y las definiciones) se
  distribuye bajo la misma licencia CC BY-SA 4.0. No se pueden cerrar.

Por tanto, `modelos/` y `data/` de este módulo quedan bajo **CC BY-SA 4.0**.
Esto no afecta al resto de DERR Medical: el código de la aplicación (carpeta
`app/`, `index.html`, `scripts/`) es obra propia y se licencia con el resto del
repositorio. Si el visor se integra en otra aplicación, basta con mantener la
atribución visible y publicar cualquier modificación de los modelos o datos bajo
CC BY-SA 4.0.

### Atribución requerida (texto que debe acompañar a los modelos)

> Modelos y nomenclatura derivados de **"Z-Anatomy – The libre 3D atlas of
> anatomy – CC BY-SA 4.0"** (Gauthier Kervyn, Marcin Zielinski, Lluis Vinent y
> colaboradores; <https://github.com/Z-Anatomy/The-blend>), a su vez derivado de
> **"BodyParts3D – The Database Center for Life Science – CC BY-SA 2.1 Japan"**
> (<https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html>).
> Definiciones en inglés extraídas de **Wikipedia (CC BY-SA 3.0)**; cada
> definición enlaza a su artículo de origen.

Z-Anatomy incorpora además modelos de terceros adaptados: "Brainder" y "White
matter" (University of Washington); "Cranial Nerves and Foramina" (University
of Dundee, CAHID, CC BY 4.0); "Anatomy of the Inner Ear" (University of Dundee
School of Medicine, CC BY-NC-SA 4.0); "Kidney" (Lissie Cowley, CC BY-NC 4.0).

**Los dos modelos no comerciales están excluidos de este módulo** (desde el
2026-10-05). El export omite, en ambos lados, las estructuras listadas en
`scripts/exclusiones.json`: `Vestibule` y `Cochlea` (únicas mallas de la
colección "Internal ear" del atlas) y `Kidney` y `Renal pelvis` (la pelvis
renal comparte procedencia de edición con los riñones y forma parte del mismo
modelo de origen). Uréteres, vejiga, uretra y los vasos renales son curvas y
mallas propias del atlas y se conservan. El manifiesto `data/estructuras.json`
lista los objetos omitidos en la clave `excluded`. Nota: el `.blend` no lleva
metadatos de procedencia por objeto; la identificación se hizo por la
estructura de colecciones del atlas y las atribuciones de su README. Si
Z-Anatomy sustituye esos modelos por otros CC BY-SA, basta con vaciar la lista
y regenerar.

Traducciones de las estructuras (es/fr/pt/la) aportadas en Z-Anatomy por Carlos
Torres Villar (español), Ana Teresa Bigio (portugués) y colaboradores.

- Origen exacto usado: `Z-Anatomy/The-blend`, commit `ded1a55` (2026-10-05),
  archivo `Z-Anatomy.zip/Z-Anatomy/Startup.blend`, exportado con
  `scripts/exportar_zanatomy.py` y comprimido con `scripts/comprimir.sh`.
- Texto de la licencia: <https://creativecommons.org/licenses/by-sa/4.0/legalcode.es>

### Nombres en neerlandés y papiamento (`data/nombres-nl-pap.json`)

Tabla creada por DERR Group (2026-10-05), no incluida en Z-Anatomy. Parte de
los nombres neerlandeses procede de los títulos de la Wikipedia en neerlandés
(CC BY-SA 4.0; marcados `wikipedia-nl`); el resto fue generado automáticamente
y está pendiente de revisión clínica. DERR publica la tabla bajo **CC BY-SA
4.0** para poder contribuirla a Z-Anatomy, que acepta traducciones.

## 2. Bibliotecas vendorizadas en `vendor/`: MIT

| Archivo | Proyecto | Versión | Licencia |
|---|---|---|---|
| `vendor/three/three.module.min.js`, `three.core.min.js`, `OrbitControls.js`, `GLTFLoader.js`, `vendor/utils/BufferGeometryUtils.js` | [three.js](https://github.com/mrdoob/three.js) | 0.182.0 | MIT (texto en `vendor/three/LICENSE`) |
| `vendor/three/meshopt_decoder.module.js` | [meshoptimizer](https://github.com/zeux/meshoptimizer) (Arseny Kapoulkine) | distribuido con three.js 0.182.0 | MIT |

Herramientas usadas solo en el pipeline (no se distribuyen con el módulo):
Blender/bpy 4.5.14 (GPL-2.0-or-later, no afecta a los archivos exportados) y
gltfpack 0.24.0 (MIT).
