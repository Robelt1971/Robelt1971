# DERR — Registro de skills y plugins externos aprobados

> Registro exigido por `DERR-Seguridad-Skills-SkillSpector.md` (§3.4).
> Propiedad de cada dato: `.claude/SHA256SUMS` tiene archivos, commit de origen
> y hashes; `.claude/THIRD-PARTY-LICENSES.md` tiene el texto legal; este
> registro tiene el estado de revisión y el único procedimiento de alta. Las
> tres cosas comparten la clave `<nombre>`.
> Fecha: 2026-10-04 · Responsable: Ernesto (Albert Rodríguez Robelt)

**Regla común a toda skill:** ninguna recibe datos de pacientes. Todo lo que se
le pasa (texto, diff, archivos) entra en el contexto del modelo.

---

## Resumen

| Sección | Origen | Revisión manual | SkillSpector | Estado |
|---|---|---|---|---|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | 2026-10-04 | pendiente | **Provisional** |
| `thermos` | [theocarranza/thermos-claude](https://github.com/theocarranza/thermos-claude) | 2026-10-05 | pendiente | **Provisional** |

- **SkillSpector:** `pendiente`, o `<puntuación máxima> <su veredicto> (<fecha>)`
  entre los informes de la sección (ver "Escanear").
- **Estado:** `Provisional` (sin SkillSpector; uso limitado al "Uso previsto"),
  `Aprobada` (SkillSpector conforme a la guía §3.4), `Rechazada`, `Retirada`
  (estuvo instalada; se conserva la fila).

---

## no-ai-slop

- **Qué hace:** edita un borrador para quitar patrones de escritura con olor a IA
  conservando la voz del autor, o solo los detecta sin reescribir. Uso:
  `/no-ai-slop (texto)` o `/no-ai-slop is this slop? (texto)`.
- **Excluido del origen:** `scripts/build_plugin.py` (empaqueta el plugin para
  ChatGPT/Codex), `.github/workflows/`, `.codex-plugin/`, `agents/openai.yaml`,
  imagen. Ninguno hace falta para Claude Code.
- **Modificaciones locales:** ninguna.
- **Revisión manual (2026-10-04):** solo Markdown. Sin scripts, sin hooks, sin
  herramientas declaradas, sin URLs, sin comandos de shell, sin referencias a
  credenciales, rutas del sistema ni variables de entorno. No lee archivos fuera
  de su propia carpeta (solo su `eval.md`). Señal secundaria: ~11,9 k estrellas,
  813 forks.
- **Hallazgos:** ninguno.
- **Uso previsto:** documentación, correos, textos del plan ministerial.

---

## thermos

- **Qué hace:** `/thermos` recoge el diff de la rama actual con `Bash`, lanza dos
  subagentes en paralelo (corrección + seguridad, y mantenibilidad estricta),
  les pasa el diff y sintetiza sus informes en un veredicto. Las rúbricas
  también se pueden usar solas en la sesión principal:
  `/thermo-nuclear-review` y `/thermo-nuclear-code-quality-review`.
- **Excluido del origen:** `plugin.json`, `marketplace.json`, `assets/logo.png`,
  `README.md`. Metadatos de empaquetado.
- **Modificaciones locales:** (1) en los dos agentes, la llamada a la rúbrica
  pierde el prefijo `thermos:` del plugin, porque al vendorizar en
  `.claude/skills/` desaparece ese espacio de nombres; (2) línea `tools:` de los
  dos agentes (hallazgo resuelto 2026-10-05).
- **Revisión manual (2026-10-05):** solo Markdown y JSON. Sin scripts, sin
  hooks. Sin URLs salvo las del `plugin.json` (no instalado). Herramientas de
  los subagentes tras (2): `Read`, `Grep`, `Glob` (alcanzan cualquier ruta del
  disco) y `Skill` (puede cargar cualquier skill de la máquina; no añade
  herramientas). Ambos declaran un contrato de solo lectura. El orquestador
  tiene `disable-model-invocation: true` (solo lo lanza el usuario).
- **Hallazgos:**
  - *Resuelto (2026-10-05):* los subagentes tenían `Bash` (y el de revisión
    profunda `WebFetch`) y reciben el diff, que en un PR ajeno es contenido no
    confiable. Se quitaron: `Read`, `Grep` y `Glob` bastan para revisar. Coste:
    los cuerpos de los agentes, sin cambios, siguen hablando de `gh`/`glab`, de
    tests y de `git log`; esas partes quedan inoperantes y nada garantiza que el
    agente lo avise.
  - *Aceptado (2026-10-05):* el riesgo vive en el orquestador, que es la sesión
    principal de Claude Code con todas sus herramientas, red incluida: recoge
    el diff con `Bash`, lo lee, y recibe los informes de los subagentes, sobre
    los que actúa. Una inyección en un diff ajeno puede sesgar el veredicto,
    hacer que un subagente copie archivos del disco en su informe, y pedir al
    orquestador que ejecute algo. El control real es el aviso de permisos de
    Claude Code en cada llamada a `Bash` del orquestador. Se acepta porque es el
    riesgo base de abrir ese diff en cualquier sesión de Claude Code, no uno
    que Thermos añada.
- **Uso previsto:** revisión de ramas en los repos de código propios (MS, Dental,
  Q-Engine); en este repo de perfil tiene poco que revisar. Para usarlo allí,
  copiar la carpeta `.claude/` o instalarlo a nivel de usuario. Reglas del
  operador: no lanzarlo con los permisos omitidos ni con comandos con red en
  una lista de permitidos (del repo o de usuario); en PRs de terceros, leer el
  diff a mano antes, o no lanzarlo; su veredicto no sustituye la revisión
  humana.

---

## Cómo añadir la próxima

Si tras el paso 6 la guía (§3.4) no permite instalar: deshacer los pasos 2 a 5
y dejar solo una fila `Rechazada`.

1. Clonar el origen en una carpeta temporal, leer todos los archivos a mano
   (buscar: scripts, hooks, URLs, `curl`/`wget`, `eval`, `exec`, `base64`,
   rutas `~/` o `$HOME`, variables de entorno, tokens, herramientas con red en
   agentes) y **escanear el clon** (ver "Escanear"). Esto cumple "antes de
   instalar": nada ha entrado aún en `.claude/`.
2. Copiar solo lo necesario a `.claude/skills/<nombre>/` (y `.claude/agents/`
   si trae agentes).
3. Hacer las modificaciones locales que hagan falta (espacios de nombres,
   herramientas que sobran).
4. Desde dentro de `.claude/`: añadir a `SHA256SUMS` un marcador
   `# --- <nombre> @ <owner/repo> <commit> (<fecha>) [<subruta>]` y debajo la
   salida de `sha256sum <archivos>`. Por cada archivo modificado en el paso 3,
   añadir su hash de origen en una línea de comentario `(origen)`. Comprobar
   (comando en la cabecera de `SHA256SUMS`).
5. Pegar el texto de la licencia en `THIRD-PARTY-LICENSES.md` bajo `## <nombre>`.
6. **Escanear lo instalado** (ver "Escanear"): exactamente los bytes que acaban
   de recibir hash, modificaciones locales incluidas.
7. Añadir aquí una fila al resumen y una sección `## <nombre>` con estas
   viñetas, en este orden y con esta propiedad: *qué hace* (función y uso);
   *excluido del origen*; *modificaciones locales* (solo qué cambió respecto al
   origen, o "ninguna"); *revisión manual* con fecha (solo qué se inspeccionó);
   *hallazgos* (resueltos o aceptados, con fecha: riesgo, decisión y coste, o
   "ninguno"); *uso previsto* (dónde se usa y reglas del operador).

### Escanear

SkillSpector trata un directorio como una sola skill, así que un informe por
carpeta, desde la raíz del repo. `<ruta>` es la carpeta del clon (paso 1) o la
instalada (paso 6); para los agentes, `.claude/agents/` con `<carpeta>` =
`agents`. Esa carpeta es compartida: su informe cuenta para toda sección que
tenga agentes en ella.

```bash
skillspector scan <ruta> --no-llm --format markdown \
  --output docs/skillspector/<nombre>-<carpeta>-$(date +%F).md
```
