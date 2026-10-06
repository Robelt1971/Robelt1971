# DERR Medical · Módulo de estudio de anatomía 3D

Visor interactivo del cuerpo humano con tres modos de estudio, construido sobre
el atlas libre [Z-Anatomy](https://github.com/Z-Anatomy/The-blend)
(CC BY-SA 4.0). Sin servidor propio, sin dependencias de compilación: HTML +
módulos ES + three.js vendorizado.

## Ejecutar

Los módulos ES y `fetch()` no funcionan abriendo el archivo directamente; hace
falta cualquier servidor estático:

```bash
cd derr-medical/estudio-anatomia
python3 -m http.server 8080
# abrir http://localhost:8080/
```

## Qué incluye

| Carpeta | Contenido |
|---|---|
| `index.html`, `app/` | La aplicación: visor (`visor.js`), datos (`datos.js`), modos de estudio y progreso (`estudio.js`), textos es/en/nl (`i18n.js`). |
| `modelos/` | 8 sistemas en GLB comprimido (meshopt), 29 MB en total: esquelético, articulaciones, muscular, cardiovascular, linfoide, nervioso y órganos de los sentidos, visceral, regiones. 3 158 estructuras (sin los 8 objetos de origen no comercial ni 6 curvas auxiliares del ojo sin geometría). |
| `data/estructuras.json` | Manifiesto: por estructura, nombre en inglés, español, latín (Terminologia Anatomica), francés y portugués; lado; grupo anatómico; materiales; clave de definición. Los nombres en neerlandés y papiamento se cargan aparte (abajo). |
| `data/definiciones.json` | 1 373 resúmenes en inglés (Wikipedia, CC BY-SA; una de Open Anatomy) con enlace a la fuente, que la ficha muestra por dominio. |
| `data/nombres-nl-pap.json` | Tabla propia de DERR: nombre en neerlandés y papiamento (Aruba) por nombre inglés, con la fuente de cada uno: `wikipedia-nl` (título coincidente en la Wikipedia en neerlandés) o `ia` (generado por modelo de lenguaje). **Toda la tabla está pendiente de revisión clínica**; la interfaz lo avisa en el selector de idioma, el buscador, el tooltip, la ficha y los ejercicios. |
| `data/revision-nombres-nl-pap.csv` | Hoja de revisión clínica (separador `;`): abre en Excel, marca `ok_nl`/`ok_pap` y escribe la corrección. |
| `scripts/` | Pipeline reproducible desde el `.blend` original (ver abajo), con `exclusiones.json` para las estructuras que no se exportan y `verificar_datos.py` para comprobar la coherencia manifiesto ↔ GLB ↔ tabla nl/pap. |
| `LICENSES.md` | Obligaciones CC BY-SA y atribuciones. Léelo antes de redistribuir. |

## Modos

- **Explorar:** activar sistemas, buscar por nombre en cualquiera de los siete idiomas, clic
  para ver la ficha (nombres, grupo, definición), doble clic para enfocar,
  aislar u ocultar estructuras (teclas `a`, `h`, `r` para centrar, `Esc` para
  mostrar todo).
- **Identificar:** se resalta una estructura y hay que elegir su nombre entre
  cuatro opciones (los distractores salen del mismo grupo anatómico cuando es
  posible).
- **Localizar:** se da un nombre y hay que hacer clic sobre la estructura en el
  modelo, con tres intentos.

El progreso (aciertos y fallos por estructura) se guarda solo en el navegador
(`localStorage`). "Priorizar las que fallo" hace que salgan más a menudo las
estructuras falladas. No hay cuentas ni datos de pacientes: **este módulo no
toca PHI.**

## Regenerar los modelos desde Z-Anatomy

```bash
# 1. Obtener el atlas (≈ 90 MB; dentro va Startup.blend, 300 MB)
git clone --depth 1 https://github.com/Z-Anatomy/The-blend
unzip The-blend/Z-Anatomy.zip -d /tmp/za

# 2. Exportar (Python 3.11 + Blender como módulo)
pip install bpy==4.5.14
python3 scripts/exportar_zanatomy.py /tmp/za/Z-Anatomy/Startup.blend /tmp/za-out

# 3. Comprimir y copiar al módulo
scripts/comprimir.sh /tmp/za-out
```

El export tarda unos dos minutos y necesita ~6 GB de RAM. Qué hace: por cada
colección de sistema del `.blend` selecciona las mallas y curvas reales
(descarta etiquetas, grupos `.g`/`.j`, inserciones musculares y objetos sin
nombre válido), exporta un GLB por sistema con los nombres de objeto como nodos,
y cruza cada nombre con el bloque `Translations` (5 idiomas) y con los textos de
definición del propio archivo.

## Límites conocidos

- Las curvas de vasos y nervios se exportan como tubos (bevel de Blender), por
  eso `cardiovascular.glb` es el más pesado (10 MB).
- Faltan traducciones en ~60 estructuras y definición en ~450; el visor cae al
  inglés o indica que no hay definición.
- **Neerlandés y papiamento son traducciones propias de DERR, no de Z-Anatomy.**
  332 nombres neerlandeses coinciden con el título del artículo correspondiente
  en la Wikipedia en neerlandés (etiqueta "Wikipedia (nl)" en la ficha; no es
  una revisión clínica); el resto del
  neerlandés y todo el papiamento se generaron con un modelo de lenguaje
  siguiendo la ortografía etimológica de Aruba y llevan la etiqueta "pendiente
  de revisión clínica". Revisar con `data/revision-nombres-nl-pap.csv` antes de
  usarlos en docencia formal.
- Las inserciones musculares (origen/inserción) y la capa de biomecánica del
  atlas no están incluidas todavía.
- El oído interno (vestíbulo y cóclea) y los riñones con su pelvis renal no
  están incluidos: sus modelos de origen son no comerciales. Lista en
  `scripts/exclusiones.json`; detalle en `LICENSES.md`.
- `nervioso.glb` contiene además 103 objetos cerebrales de la Universidad de
  Washington ("Brainder", "White matter") sin licencia declarada en el atlas;
  por eso no es CC BY-SA en bloque. Detalle por archivo en `LICENSES.md`.
