# DERR — Registro de skills y plugins externos aprobados

> Registro exigido por `DERR-Seguridad-Skills-SkillSpector.md` (§3.4). Una
> entrada por repositorio de origen. Dueño único del **estado de revisión** de
> cada skill instalada. La lista de archivos, el commit de origen y los hashes
> viven en `.claude/SHA256SUMS`; el texto de las licencias, en
> `.claude/THIRD-PARTY-LICENSES.md`.
> Fecha: 2026-10-04 · Actualizado: 2026-10-05 · Responsable: Ernesto (Albert Rodríguez Robelt)

---

## Resumen

| Sección | Origen | Revisión manual | SkillSpector | Estado |
|---|---|---|---|---|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | 2026-10-04 | pendiente | **Provisional** |
| `thermos` | [theocarranza/thermos-claude](https://github.com/theocarranza/thermos-claude) | 2026-10-05 | pendiente | **Provisional, con nota** |

**Columna SkillSpector:** `pendiente`, o el veredicto y la puntuación
(`SAFE 7`, `CAUTION 32`). Se rellena escaneando **cada carpeta por separado**,
porque SkillSpector trata un directorio como una sola skill:

```bash
for d in .claude/skills/*/ .claude/agents/; do
  skillspector scan "$d" --no-llm --format markdown --output "docs/skillspector/$(basename "$d")-$(date +%F).md"
done
```

**Columna Estado:**

| Estado | Significado |
|---|---|
| `Provisional` | Solo revisión manual. SkillSpector pendiente. La política (guía §0) exige `SAFE` o `CAUTION` justificado; hasta entonces el uso queda limitado a lo que dice "Uso previsto". |
| `Provisional, con nota` | Igual, y además hay hallazgos aceptados. |
| `Aprobada` / `Aprobada con nota` | SkillSpector `SAFE`, o `CAUTION` con cada hallazgo explicado. |
| `Rechazada` | No instalar. |
| `Retirada` | Estuvo instalada y se quitó; se conserva la fila. |

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
  `disable-model-invocation: true` (solo lo lanza el usuario). Las herramientas
  de cada agente son las de su línea `tools:`; no se copian aquí para que no
  queden desactualizadas.
- **Hallazgos:**
  - *Resuelto (2026-10-05):* el origen daba `WebFetch` al subagente de revisión
    profunda. Se quitó. Esto elimina una herramienta de salida, no el canal.
  - *Aceptado:* cadena de inyección y salida de datos. Tras su auditoría, el
    subagente de revisión profunda lee los comentarios del PR con `gh`/`glab`,
    que son contenido de terceros, y conserva `Bash`, que tiene red sin
    restricciones (`curl`, `gh api`, `git push`). Un comentario malicioso puede
    instruirle a enviar el contenido del diff fuera. El único control es la
    instrucción de solo lectura al modelo, que no es un control técnico. Se
    acepta porque el uso previsto es en repos propios, sobre diffs sin PHI, y
    porque quitar `Bash` dejaría al agente sin `git diff`. Si algún día se
    ejecuta sobre PRs de terceros, revisar antes los comentarios a mano.
- **Uso previsto:** revisión de ramas en los repos de código (MS, Dental,
  Q-Engine). En este repo de perfil tiene poco que revisar. Para usarlo allí,
  copiar la carpeta `.claude/` o instalarlo a nivel de usuario. Nunca lanzarlo
  sobre diffs que contengan datos de pacientes: el diff entra en el contexto
  del modelo.

---

## Cómo añadir la próxima

Cada dato se escribe una sola vez: archivos y commit en `SHA256SUMS`, texto
legal en `THIRD-PARTY-LICENSES.md`, estado y revisión aquí.

1. Escanear con SkillSpector cada carpeta por separado (comando de arriba).
   El informe se guarda en `docs/skillspector/<carpeta>-<AAAA-MM-DD>.md`.
2. Leer todos los archivos a mano. Buscar: scripts, hooks, URLs, `curl`/`wget`,
   `eval`, `exec`, `base64`, rutas `~/` o `$HOME`, variables de entorno, tokens.
3. Copiar solo lo necesario a `.claude/skills/<nombre>/` (y `.claude/agents/`
   si trae agentes).
4. Desde dentro de `.claude/`: añadir a `SHA256SUMS` un marcador
   `# --- <nombre> @ <owner/repo> <commit> (<fecha>)` y debajo la salida de
   `sha256sum <archivos>`. Si se edita algún archivo respecto al origen, añadir
   su hash de origen en una línea de comentario `(origen)`. Comprobar con
   `sha256sum -c SHA256SUMS`.
5. Pegar el texto de la licencia en `THIRD-PARTY-LICENSES.md` bajo un
   encabezado `## <nombre>` igual al del marcador.
6. Añadir aquí una fila al resumen y una sección `## <nombre>` con: qué hace,
   excluido del origen, modificaciones locales (o "ninguna"), revisión manual
   con fecha, hallazgos (aceptados o resueltos, o "ninguno") y uso previsto.
