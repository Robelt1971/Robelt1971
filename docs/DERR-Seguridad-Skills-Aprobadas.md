# DERR — Registro de skills y plugins externos aprobados

> Registro exigido por `DERR-Seguridad-Skills-SkillSpector.md` (§3.4). Una
> sección por repositorio de origen, con la misma clave que su marcador en
> `.claude/SHA256SUMS` (archivos y commit) y su encabezado en
> `.claude/THIRD-PARTY-LICENSES.md` (licencia). Aquí vive el estado de revisión.
> Fecha: 2026-10-04 · Actualizado: 2026-10-05 · Responsable: Ernesto (Albert Rodríguez Robelt)

---

## Resumen

| Sección | Origen | Revisión manual | SkillSpector | Estado |
|---|---|---|---|---|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | 2026-10-04 | pendiente | **Provisional** |
| `thermos` | [theocarranza/thermos-claude](https://github.com/theocarranza/thermos-claude) | 2026-10-05 | pendiente | **Provisional** |

| Columna | Valores |
|---|---|
| SkillSpector | `pendiente`, o `<peor veredicto> <puntuación máxima> (<fecha>)` entre todas las carpetas de la sección, p. ej. `CAUTION 32 (2026-10-12)`. Los informes están en `docs/skillspector/`, uno por carpeta escaneada. `.claude/agents/` es una carpeta compartida: su informe cuenta para toda sección que tenga agentes en ella. |
| Estado | `Provisional` (solo revisión manual; SkillSpector pendiente; uso limitado al "Uso previsto" de la sección), `Aprobada` (SkillSpector `SAFE`, o `CAUTION` con cada hallazgo explicado en la sección), `Rechazada`, `Retirada` (estuvo instalada; se conserva la fila). Los hallazgos aceptados se leen en la sección, no en el estado. |

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
- **Uso previsto:** documentación, correos, textos del plan ministerial. No pegar
  texto con datos de pacientes: la skill no envía nada fuera, pero el texto entra
  en el contexto del modelo igual que cualquier prompt.

---

## thermos

- **Qué hace:** `/thermos` recoge el diff de la rama actual, lanza dos
  subagentes en paralelo (corrección + seguridad, y mantenibilidad estricta) y
  sintetiza un veredicto. Las rúbricas también se pueden usar solas:
  `/thermo-nuclear-review` y `/thermo-nuclear-code-quality-review`.
- **Excluido del origen:** `plugin.json`, `marketplace.json`, `assets/logo.png`,
  `README.md`. Metadatos de empaquetado.
- **Modificaciones locales:** (1) en los dos agentes, la llamada a la rúbrica
  pierde el prefijo `thermos:` del plugin, porque al vendorizar en
  `.claude/skills/` desaparece ese espacio de nombres; (2) en
  `thermo-nuclear-review-subagent.md` se quitó `WebFetch` de la línea `tools:`
  (2026-10-05, ver hallazgos).
- **Revisión manual (2026-10-05):** solo Markdown y JSON. Sin scripts, sin
  hooks. Sin URLs salvo las del `plugin.json` (no instalado). Ambos agentes
  declaran un contrato de solo lectura: no editar, no commitear, no mutar
  estado, no llamar APIs de pago. El orquestador tiene
  `disable-model-invocation: true` (solo lo lanza el usuario).
- **Hallazgos:**
  - *Resuelto (2026-10-05):* el origen daba `WebFetch` al subagente de revisión
    profunda. Se quitó. Esto elimina una herramienta de salida, no el canal.
  - *Aceptado (2026-10-05):* inyección de prompts con salida de datos por `Bash`.
    Entrada no confiable: el **diff** y los archivos cambiados, que el subagente
    recibe siempre en su prompt; y, solo si existe PR y hay hallazgos medios o
    altos, los comentarios del PR leídos con `gh`/`glab`. En un PR ajeno, el
    diff es el vector principal (inyección en comentarios de código, cadenas o
    Markdown). Salida: `Bash` tiene red sin restricciones (`curl`, `gh api`,
    `git push`); quitarlo dejaría al agente sin `git diff`. Control real: en
    este repo no hay `.claude/settings.json` con lista de permitidos, así que
    cada llamada a `Bash` del subagente pasa por el aviso de permisos de Claude
    Code. Ese aviso desaparece con permisos omitidos, en modo de aceptación
    automática, o si se añaden `curl`, `gh` o `git push` a la lista de
    permitidos. Reglas operativas que siguen de aquí: no lanzar `/thermos` en
    esos modos; en PRs de terceros, leer el diff y los comentarios a mano antes,
    o no lanzarlo; nunca sobre diffs con PHI.
- **Uso previsto:** revisión de ramas en los repos de código (MS, Dental,
  Q-Engine), en repos propios. En este repo de perfil tiene poco que revisar.
  Para usarlo allí, copiar la carpeta `.claude/` o instalarlo a nivel de
  usuario. Nunca lanzarlo sobre diffs que contengan datos de pacientes: el diff
  entra en el contexto del modelo.

---

## Cómo añadir la próxima

1. Clonar el origen en una carpeta temporal y leer todos los archivos a mano.
   Buscar: scripts, hooks, URLs, `curl`/`wget`, `eval`, `exec`, `base64`, rutas
   `~/` o `$HOME`, variables de entorno, tokens.
2. Escanear **antes de copiar** cada carpeta que se vaya a instalar, desde la
   raíz del repo. SkillSpector trata un directorio como una sola skill, así que
   una carpeta por informe:

   ```bash
   skillspector scan <ruta-en-el-clon> --no-llm --format markdown \
     --output docs/skillspector/<carpeta>-$(date +%F).md
   ```

3. Copiar solo lo necesario a `.claude/skills/<nombre>/` (y `.claude/agents/`
   si trae agentes).
4. Desde dentro de `.claude/`: añadir a `SHA256SUMS` un marcador
   `# --- <nombre> @ <owner/repo> <commit> (<fecha>) [<subruta>]` y debajo la
   salida de `sha256sum <archivos>`. Si se edita algún archivo respecto al
   origen, añadir su hash de origen en una línea de comentario `(origen)`.
   Comprobar con `sha256sum -c SHA256SUMS`.
5. Pegar el texto de la licencia en `THIRD-PARTY-LICENSES.md` bajo `## <nombre>`.
6. Añadir aquí una fila al resumen y una sección `## <nombre>` con: qué hace,
   excluido del origen, modificaciones locales (o "ninguna"), revisión manual
   con fecha, hallazgos (resueltos o aceptados, con fecha, o "ninguno") y uso
   previsto.
