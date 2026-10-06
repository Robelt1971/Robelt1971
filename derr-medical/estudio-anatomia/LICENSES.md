# Licencias del módulo de estudio de anatomía

Este módulo mezcla contenido con varios regímenes. Léelo antes de redistribuir
cualquier parte.

## 1. Modelos 3D y datos anatómicos: CC BY-SA 4.0, con excepciones por archivo

Las carpetas `modelos/` y `data/` son **obras derivadas** del atlas libre
Z-Anatomy, publicado bajo Creative Commons Atribución-CompartirIgual 4.0
Internacional (CC BY-SA 4.0). Esa licencia obliga a **atribuir** a los autores
originales y a **compartir igual**: todo derivado de los modelos o de los datos
(los GLB comprimidos, `estructuras.json`, las definiciones) se distribuye bajo
CC BY-SA 4.0 y no se puede cerrar.

Z-Anatomy incorpora además modelos de terceros con otras licencias. Los dos no
comerciales y los dos sin licencia declarada (Universidad de Washington) están
**excluidos** del módulo (abajo). La declaración se mantiene **por archivo**:

| Archivo | Licencia efectiva | Motivo |
|---|---|---|
| `modelos/esqueletico.glb`, `articulaciones.glb`, `muscular.glb`, `cardiovascular.glb`, `linfoide.glb`, `visceral.glb`, `regiones.glb` | CC BY-SA 4.0 | Solo contenido Z-Anatomy / BodyParts3D. El riñón no comercial está excluido de `visceral.glb`. |
| `modelos/nervioso.glb` | CC BY-SA 4.0 | El oído interno no comercial y los 103 objetos (174 con lado) de "Brainder" y "White matter" (University of Washington, sin licencia declarada) están excluidos desde el 2026-10-06. Hasta esa fecha el archivo los contenía; las versiones anteriores del repositorio no deben redistribuirse. |
| `data/estructuras.json`, `data/definiciones.json` | CC BY-SA 4.0 | Derivados de Z-Anatomy. Las definiciones son texto de Wikipedia en inglés (CC BY-SA 3.0 o 4.0 según la fecha de extracción por Z-Anatomy), salvo una (`Apical axillary nodes`) tomada del visor TA2 de Open Anatomy; la ficha indica la fuente de cada una por su dominio. La definición de `Intermediate bronchus`, copiada de Radiopaedia (CC BY-NC-SA, incompatible), se omite en el export (clave `definiciones` de `scripts/exclusiones.json`). |
| `data/nombres-nl-pap.json`, `data/revision-nombres-nl-pap.csv` | CC BY-SA 4.0 | Tabla propia de DERR (ver abajo). |

Consecuencias prácticas:

- Uso interno de estudio en DERR: permitido con todos los archivos.
- Redistribución fuera de DERR: los ocho GLB y los datos son CC BY-SA 4.0 sin
  reservas, con la atribución de abajo.

### Código de la aplicación (`app/`, `index.html`, `scripts/`, `tests/`): MIT

Obra de DERR Group, publicada bajo la licencia MIT (archivo `LICENSE`, desde el
2026-10-06). La licencia del código no alcanza a `modelos/` ni a `data/`, que
siguen bajo CC BY-SA 4.0: quien reutilice el visor con estos modelos o datos
mantiene la atribución visible y publica bajo CC BY-SA 4.0 cualquier
modificación de los modelos o de los datos. Las bibliotecas de `vendor/` tienen
su propia licencia (sección 2).

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

**Los dos modelos de la Universidad de Washington ("Brainder", "White matter")
están excluidos desde el 2026-10-06.** El atlas los atribuye pero no declara
su licencia, y lo que no se puede licenciar no se redistribuye. Son los 103
nombres (174 objetos con lado) de corteza cerebral (giros y surcos con
nomenclatura del atlas de Destrieux), sustancia blanca, comisuras y tractos
listados en `scripts/exclusiones.json` con origen "Brainder / White matter".
Se identificaron por el material del objeto (`Brain`, `Brain-Inner`, `White
matter`), único rastro de procedencia que deja el `.blend`
(`scripts/listar_uw.py` reproduce la lista); el criterio es deliberadamente
conservador y puede arrastrar algún objeto propio del atlas que comparta
material (puente, bulbo raquídeo, hipotálamo, astas de la médula). Mientras
no se aclare, el visor no muestra la corteza parcelada ni los tractos. La
consulta a Z-Anatomy está redactada en `docs/consulta-licencia-UW.md`; si
responden con una licencia compatible, basta con retirar esas entradas de la
lista y regenerar.

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
