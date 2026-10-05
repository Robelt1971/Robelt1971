# DERR — Registro de skills y plugins externos aprobados

> Registro exigido por `DERR-Seguridad-Skills-SkillSpector.md` (§3.4). Una
> entrada por repositorio de origen. Es el **único** lugar donde se anota el
> estado de revisión de cada skill instalada.
> Fecha: 2026-10-04 · Responsable: Ernesto (Albert Rodríguez Robelt)

Los archivos están vendorizados (copiados con hash fijo) en `.claude/skills/` y
`.claude/agents/`. Hashes y commits de origen: `.claude/SHA256SUMS`
(verificar con `cd .claude && sha256sum -c SHA256SUMS`). Licencias:
`.claude/THIRD-PARTY-LICENSES.md`.

---

## Resumen

| Carpeta | Origen | Commit origen | Revisión | Estado |
|---|---|---|---|---|
| `skills/no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | `000650b` (2026-09-01) | manual, 2026-10-04 | **Aprobada** · escaneo SkillSpector pendiente |
| `skills/thermos` (+ 2 rúbricas, + 2 agentes) | [theocarranza/thermos-claude](https://github.com/theocarranza/thermos-claude) | `ffe74b3` (2026-09-16) | manual, 2026-10-04 | **Aprobada con nota** · escaneo SkillSpector pendiente |

Estados posibles: `Aprobada`, `Aprobada con nota`, `Rechazada`, `Retirada`. El
sufijo "escaneo SkillSpector pendiente" se quita, y se anota la puntuación,
cuando se ejecute `skillspector scan --no-llm .claude/` desde la máquina local.

---

## no-ai-slop

- **Qué hace:** edita un borrador para quitar patrones de escritura con olor a IA
  conservando la voz del autor, o solo los detecta sin reescribir. Uso:
  `/no-ai-slop (texto)` o `/no-ai-slop is this slop? (texto)`.
- **Instalado:** `.claude/skills/no-ai-slop/SKILL.md` y `eval.md`, idénticos al
  origen.
- **Excluido del origen:** `scripts/build_plugin.py` (empaqueta el plugin para
  ChatGPT/Codex), `.github/workflows/`, `.codex-plugin/`, `agents/openai.yaml`,
  imagen. Ninguno hace falta para Claude Code.
- **Revisión manual (2026-10-04):** solo Markdown. Sin scripts, sin hooks, sin
  herramientas declaradas, sin URLs, sin comandos de shell, sin referencias a
  credenciales, rutas del sistema ni variables de entorno. No lee archivos fuera
  de su propia carpeta (solo su `eval.md`). Señal secundaria: ~11,9 k estrellas,
  813 forks.
- **Hallazgos aceptados:** ninguno.
- **Uso previsto:** documentación, correos, textos del plan ministerial. No pegar
  texto con datos de pacientes: la skill no envía nada fuera, pero el texto entra
  en el contexto del modelo igual que cualquier prompt.

---

## Thermos

- **Qué hace:** `/thermos` recoge el diff de la rama actual, lanza dos
  subagentes en paralelo (corrección + seguridad, y mantenibilidad estricta) y
  sintetiza un veredicto. Las rúbricas también se pueden usar solas:
  `/thermo-nuclear-review` y `/thermo-nuclear-code-quality-review`.
- **Instalado:** `.claude/skills/thermos/`, `.claude/skills/thermo-nuclear-review/`,
  `.claude/skills/thermo-nuclear-code-quality-review/` (las tres idénticas al
  origen) y los dos agentes en `.claude/agents/`.
- **Modificación local (única):** en los dos agentes, la llamada a la rúbrica
  pierde el prefijo `thermos:` del plugin, porque al vendorizar en
  `.claude/skills/` desaparece ese espacio de nombres. Una línea por archivo.
  Los hashes del origen están como comentario en `.claude/SHA256SUMS`.
- **Excluido del origen:** `plugin.json`, `marketplace.json`, `assets/logo.png`,
  `README.md`. Metadatos de empaquetado.
- **Revisión manual (2026-10-04):** solo Markdown y JSON. Sin scripts, sin
  hooks. Sin URLs salvo las del `plugin.json` (no instalado). Ambos agentes
  declaran un contrato de solo lectura: no editar, no commitear, no mutar
  estado, no llamar APIs de pago. El orquestador tiene
  `disable-model-invocation: true` (solo lo lanza el usuario). Herramientas de
  los agentes: `Read, Grep, Glob, Bash, Skill` y, en el de revisión profunda,
  también `WebFetch`.
- **Hallazgo aceptado (con nota):** cadena de inyección y salida de datos en el
  subagente de revisión profunda. Tras su auditoría lee los comentarios del PR
  con `gh`/`glab`, que son contenido de terceros, y dispone de `WebFetch`. Un
  comentario malicioso podría instruirle a enviar el contenido del diff a una
  URL externa. El contrato de solo lectura es una instrucción al modelo, no un
  control técnico. Se acepta porque el uso previsto es en repos propios y
  nunca sobre diffs con PHI. Si se quiere cerrar la cadena, basta con quitar
  `WebFetch` de la línea `tools:` del agente (coste: no podrá consultar
  documentación externa durante la revisión).
- **Uso previsto:** revisión de ramas en los repos de código (MS, Dental,
  Q-Engine). En este repo de perfil tiene poco que revisar. Para usarlo allí,
  copiar la carpeta `.claude/` o instalarlo a nivel de usuario. Nunca lanzarlo
  sobre diffs que contengan datos de pacientes: el diff entra en el contexto
  del modelo.

---

## Cómo añadir la próxima

1. Escanear con SkillSpector (guía, §3). Guardar el informe.
2. Leer todos los archivos a mano. Buscar: scripts, hooks, URLs, `curl`/`wget`,
   `eval`, `exec`, `base64`, rutas `~/` o `$HOME`, variables de entorno, tokens.
3. Vendorizar solo lo necesario en `.claude/skills/<nombre>/` (y
   `.claude/agents/` si trae agentes). Añadir su licencia a
   `.claude/THIRD-PARTY-LICENSES.md`.
4. Añadir sus líneas a `.claude/SHA256SUMS` con `sha256sum <archivos>` y un
   comentario con origen y commit. Comprobar con `sha256sum -c SHA256SUMS`.
5. Añadir fila al resumen y una sección `## <nombre>` con: qué hace, instalado,
   excluido, revisión, hallazgos aceptados y uso previsto.
