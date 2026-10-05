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
  entre los informes de esa fila en `docs/skillspector/` (ver "Escanear").
- **Estado:** `Provisional` (sin SkillSpector; uso limitado al "Uso previsto"),
  `Aprobada` (SkillSpector conforme a la guía §3.4), `Rechazada` (solo la
  fila, sin sección), `Retirada` (estuvo instalada; se conserva la fila).

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
- **Revisión manual (2026-10-05):** en lo vendorizado, solo Markdown. Sin
  scripts, sin hooks, sin URLs. Línea `tools:` de los dos subagentes tras (2):
  `Read, Grep, Glob, Skill`. Ambos declaran un contrato de solo lectura. El
  orquestador tiene `disable-model-invocation: true` (solo lo lanza el
  usuario).
- **Hallazgos:**
  - *Resuelto (2026-10-05):* los subagentes tenían `Bash` (y el de revisión
    profunda `WebFetch`) y reciben el diff, que en un PR ajeno es contenido no
    confiable. Se quitaron; las herramientas de lectura bastan para revisar.
    Coste: el cuerpo del agente de revisión profunda (sin más cambios que (1))
    sigue hablando de `gh`/`glab` y de ejecutar tests, y la rúbrica que carga,
    de `gh`/`glab`; esas partes quedan inoperantes y nada garantiza que lo avise.
  - *Aceptado (2026-10-05):* el riesgo vive en el orquestador, que es la sesión
    principal de Claude Code con todas sus herramientas y red. Una inyección en
    un diff ajeno puede sesgar el veredicto, hacer que un subagente copie en su
    informe cualquier archivo del disco (sus herramientas de lectura no se
    limitan al repo) y pedir al orquestador que actúe. El control real son los avisos de permisos del
    orquestador en las herramientas que actúan (`Bash`, `WebFetch`,
    `Write`/`Edit`, MCP); las de lectura no avisan. Se acepta porque es el
    mismo tipo de riesgo que abrir ese diff en cualquier sesión de Claude Code,
    automatizado.
- **Uso previsto:** revisión de ramas en los repos de código propios (MS, Dental,
  Q-Engine); en este repo de perfil tiene poco que revisar. Para usarlo allí,
  copiar la carpeta `.claude/` o instalarlo a nivel de usuario. Reglas del
  operador:
  - lanzarlo solo en el modo de permisos por defecto (ni omitidos ni
    aceptación automática de ediciones);
  - ninguna herramienta con red (`Bash`, `WebFetch`, `WebSearch`, MCP) en
    listas de permitidos ni en hooks que aprueben solos, del repo, de usuario
    ni de plugins;
  - antes de lanzarlo en otro repo, comprobar en sus settings (incluido
    `settings.local.json`) el modo por defecto y las listas, y que sus skills
    no ejecuten comandos al cargarse;
  - no responder "no volver a preguntar" durante una ejecución;
  - en PRs de terceros, leer el diff a mano antes, o no lanzarlo;
  - su veredicto no sustituye la revisión humana.

---

## Cómo añadir la próxima

1. Clonar el origen en una carpeta temporal y leer todos los archivos a mano.
   Buscar: scripts, hooks, URLs, `curl`/`wget`, `eval`, `exec`, `base64`, rutas
   `~/` o `$HOME`, variables de entorno, tokens, herramientas con red en
   agentes.
2. En el clon: borrar lo que no se va a instalar (conservar `LICENSE` para el
   paso 6) y hacer las modificaciones locales (espacios de nombres,
   herramientas que sobran). Por cada archivo modificado, guardar su hash de
   origen: `git show HEAD:<archivo> | sha256sum`, con `<archivo>` relativo a la
   raíz del clon; copiar solo el hash.
3. Escanear el clon (ver "Escanear"). Si la guía (§3.4) no permite instalar:
   borrar el clon y añadir una fila `Rechazada`. Fin.
4. Copiar tal cual a `.claude/skills/` (una carpeta por skill) y, si trae
   agentes, a `.claude/agents/`. Lo escaneado y lo instalado son los mismos
   bytes.
5. Desde dentro de `.claude/`: añadir a `SHA256SUMS` un marcador
   `# --- <nombre> @ <owner/repo> <commit> (<fecha>) <subruta>` (`<subruta>`:
   carpeta del origen de la que se copió; se omite si es la raíz), debajo la
   salida de `sha256sum <archivos>`, y por cada archivo modificado una línea de
   comentario `(origen)` con el hash del paso 2. Comprobar (comando en la
   cabecera de `SHA256SUMS`).
6. Pegar el texto de la licencia en `THIRD-PARTY-LICENSES.md` bajo `## <nombre>`.
7. Añadir aquí una fila al resumen y una sección `## <nombre>` con estas
   viñetas, en este orden y con esta propiedad: *qué hace* (función y uso);
   *excluido del origen*; *modificaciones locales* (solo qué cambió respecto al
   origen, o "ninguna"); *revisión manual* con fecha (solo qué se inspeccionó);
   *hallazgos* (resueltos o aceptados, con fecha: riesgo, decisión y coste, o
   "ninguno"); *uso previsto* (dónde se usa y reglas del operador).

### Escanear

SkillSpector trata un directorio como una sola skill: un informe por carpeta
que se vaya a instalar. Ejecutar desde la raíz de **este** repo, con `<ruta>`
en absoluto hacia la carpeta del clon, para que el informe quede aquí y no en
el clon, sin barra final. `<carpeta>` es el último componente de `<ruta>`.

```bash
skillspector scan <ruta> --no-llm --format markdown \
  --output docs/skillspector/<nombre>-<carpeta>-$(date +%F).md
```
