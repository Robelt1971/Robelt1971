# Licencias del módulo de estudio de anatomía

Este módulo mezcla contenido con varios regímenes. Léelo antes de redistribuir
cualquier parte: dos de los ocho modelos contienen material no comercial.

## 1. Modelos 3D y datos anatómicos: CC BY-SA 4.0, con excepciones por archivo

Las carpetas `modelos/` y `data/` son **obras derivadas** del atlas libre
Z-Anatomy, publicado bajo Creative Commons Atribución-CompartirIgual 4.0
Internacional (CC BY-SA 4.0). Esa licencia obliga a **atribuir** a los autores
originales y a **compartir igual**: todo derivado de los modelos o de los datos
(los GLB comprimidos, `estructuras.json`, las definiciones) se distribuye bajo
CC BY-SA 4.0 y no se puede cerrar.

Z-Anatomy incorpora además modelos de terceros con otras licencias, y esas
piezas están dentro de nuestros GLB. Por eso la declaración es **por archivo**:

| Archivo | Licencia efectiva | Motivo |
|---|---|---|
| `modelos/esqueletico.glb`, `articulaciones.glb`, `muscular.glb`, `cardiovascular.glb`, `linfoide.glb`, `regiones.glb` | CC BY-SA 4.0 | Solo contenido Z-Anatomy / BodyParts3D. |
| `modelos/nervioso.glb` | **No apto para uso comercial** mientras contenga el oído interno | Incluye "Anatomy of the Inner Ear" (University of Dundee School of Medicine, **CC BY-NC-SA 4.0**): estructuras `Cochlea` y `Vestibule` (grupo *Internal ear*). Incluye también los 103 objetos de corteza, sustancia blanca y tractos de "Brainder" y "White matter" (University of Washington), **sin licencia declarada** en el atlas de origen: su redistribución está pendiente de aclarar con Z-Anatomy. |
| `modelos/visceral.glb` | **No apto para uso comercial** mientras contenga el riñón | Incluye "Kidney" (Lissie Cowley, **CC BY-NC 4.0**): estructuras `Kidney` y `Renal pelvis`. |
| `data/estructuras.json`, `data/definiciones.json` | CC BY-SA 4.0 | Derivados de Z-Anatomy. Las definiciones son texto de Wikipedia en inglés (CC BY-SA 3.0 o 4.0 según la fecha de extracción por Z-Anatomy), salvo una (`Apical axillary nodes`) tomada del visor TA2 de Open Anatomy; la ficha indica la fuente de cada una por su dominio. Se eliminó una definición copiada de Radiopaedia (CC BY-NC-SA, incompatible). |
| `data/nombres-nl-pap.json`, `data/revision-nombres-nl-pap.csv` | CC BY-SA 4.0 | Tabla propia de DERR (ver abajo). |

Consecuencias prácticas:

- Uso interno de estudio en DERR: permitido con todos los archivos.
- Cualquier uso comercial o redistribución fuera de DERR: antes hay que excluir
  `Cochlea`, `Vestibule`, `Kidney` y `Renal pelvis` en el export (o sustituir
  esos modelos) y resolver la licencia de los objetos de la UW. Está anotado en
  la spec (§6.1) como tarea pendiente, y hasta entonces **no se debe afirmar
  que `nervioso.glb` ni `visceral.glb` son CC BY-SA 4.0 en bloque**.

### Código de la aplicación (`app/`, `index.html`, `scripts/`)

Es obra propia de DERR Group y **no tiene licencia asignada todavía**: en un
repositorio público sin archivo de licencia rigen todos los derechos reservados.
No reutilizar fuera de DERR hasta que se elija una licencia (recomendación:
MIT, compatible con mantener los modelos y datos bajo CC BY-SA). Si el visor se
integra en otra aplicación de DERR, hay que mantener la atribución visible y
publicar bajo CC BY-SA 4.0 cualquier modificación de los modelos o datos.

### Atribución requerida (texto que debe acompañar a los modelos)

> Modelos y nomenclatura derivados de **"Z-Anatomy – The libre 3D atlas of
> anatomy – CC BY-SA 4.0"** (Gauthier Kervyn, Marcin Zielinski, Lluis Vinent y
> colaboradores; <https://github.com/Z-Anatomy/The-blend>), a su vez derivado de
> **"BodyParts3D – The Database Center for Life Science – CC BY-SA 2.1 Japan"**
> (<https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html>).
> **Modificaciones de DERR Group:** reexportación de cada sistema a GLB,
> compresión meshopt (gltfpack), recoloreado por familia de material en el
> visor; la geometría no se edita. Definiciones en inglés extraídas de
> **Wikipedia (CC BY-SA)**; cada definición enlaza a su artículo de origen.

Modelos de terceros adaptados dentro de Z-Anatomy, tal como los declara el
atlas: "Brainder" y "White matter" (University of Washington; sin licencia
declarada); "Cranial Nerves and Foramina" (University of Dundee, CAHID, CC BY
4.0); "Anatomy of the Inner Ear" (University of Dundee School of Medicine, CC
BY-NC-SA 4.0); "Kidney" (Lissie Cowley, CC BY-NC 4.0).

Traducciones de las estructuras (es/fr/pt/la) aportadas en Z-Anatomy por Carlos
Torres Villar (español), Ana Teresa Bigio (portugués) y colaboradores.

- Origen exacto usado: `Z-Anatomy/The-blend`, commit `ded1a55` (2026-10-05),
  archivo `Z-Anatomy.zip/Z-Anatomy/Startup.blend`, exportado con
  `scripts/exportar_zanatomy.py` y comprimido con `scripts/comprimir.sh`.
- Textos de las licencias: <https://creativecommons.org/licenses/by-sa/4.0/legalcode.es>,
  <https://creativecommons.org/licenses/by-sa/2.1/jp/>,
  <https://creativecommons.org/licenses/by-nc-sa/4.0/>,
  <https://creativecommons.org/licenses/by-nc/4.0/>.

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
