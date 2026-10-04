# DERR — Registro de skills y plugins externos aprobados

> Registro exigido por `DERR-Seguridad-Skills-SkillSpector.md` (§3.4). Toda skill,
> plugin o agente de terceros instalado en este repo tiene una fila aquí. Los
> archivos están **vendorizados** (copiados, con hash fijo) en `.claude/skills/`
> y `.claude/agents/`, no instalados desde un marketplace, para que el contenido
> revisado sea exactamente el que se ejecuta. Una actualización implica repetir la
> revisión y actualizar esta tabla.

---

## Resumen

| Skill / agente | Origen | Commit origen | Fecha revisión | Veredicto | Revisó |
|---|---|---|---|---|---|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | `000650b` (2026-09-01) | 2026-10-04 | **APROBADA** (revisión manual) | Claude Code, por encargo de Ernesto |
| `thermos` + 2 rúbricas + 2 subagentes | [theocarranza/thermos-claude](https://github.com/theocarranza/thermos-claude) (adaptación del plugin Thermos de Cursor) | `ffe74b3` (2026-09-16) | 2026-10-04 | **APROBADA con nota** (revisión manual) | Claude Code, por encargo de Ernesto |

**Pendiente para ambas:** pasar `skillspector scan --no-llm` sobre
`.claude/skills/` y `.claude/agents/` desde la máquina local (la sesión remota no
pudo instalar el escáner por política del entorno) y anotar aquí la puntuación.

---

## 1. `no-ai-slop` (editor de prosa, 20+ patrones)

- **Qué hace:** edita un borrador para quitar patrones de escritura con olor a IA
  conservando la voz del autor, o solo los detecta sin reescribir. Uso:
  `/no-ai-slop (texto)` o `/no-ai-slop is this slop? (texto)`.
- **Archivos instalados:** `.claude/skills/no-ai-slop/SKILL.md`, `eval.md`, `LICENSE`.
- **Archivos del repo origen NO instalados:** `scripts/build_plugin.py` (empaqueta
  el plugin para ChatGPT/Codex), `.github/workflows/`, `.codex-plugin/`,
  `agents/openai.yaml`, imagen. Ninguno hace falta para Claude Code.
- **Licencia:** MIT, © 2026 Peter Yang. Copia incluida junto a la skill.
- **Hashes SHA-256 (idénticos al origen):**
  - `SKILL.md` `992b365f51a2f62cf4c1c5ed22049a9ee551dfea677550c1a72b371c0ceadd62`
  - `eval.md` `8ad8d83ed1abe7fc054ad74966bfca64fc182bc71f59d701b24b962c39d11ad7`
- **Revisión de seguridad (manual, 2026-10-04):**
  - Solo Markdown. Sin scripts, sin hooks, sin herramientas declaradas.
  - Sin URLs, sin llamadas de red, sin comandos de shell, sin referencias a
    credenciales, rutas del sistema o variables de entorno.
  - Las instrucciones se limitan a editar texto que el usuario pega. No pide
    leer archivos ni ejecutar nada.
  - Popularidad como señal secundaria: ~11,9 k estrellas, 813 forks.
- **Hallazgos aceptados:** ninguno.
- **Uso previsto en DERR:** documentación, correos, textos del plan ministerial.
  **No** pegar en ella texto con datos de pacientes: la skill no envía nada
  fuera, pero el texto entra en el contexto del modelo igual que cualquier prompt.

---

## 2. Thermos (revisión de código en dos pasadas paralelas)

- **Qué hace:** `/thermos` recoge el diff de la rama actual, lanza dos subagentes
  en paralelo (corrección + seguridad, y mantenibilidad estricta) y sintetiza un
  veredicto. Las rúbricas también se pueden usar solas:
  `/thermo-nuclear-review` y `/thermo-nuclear-code-quality-review`.
- **Archivos instalados:**
  - `.claude/skills/thermos/SKILL.md` (orquestador) y `LICENSE`
  - `.claude/skills/thermo-nuclear-review/SKILL.md` (rúbrica bugs/seguridad)
  - `.claude/skills/thermo-nuclear-code-quality-review/SKILL.md` (rúbrica calidad)
  - `.claude/agents/thermo-nuclear-review-subagent.md`
  - `.claude/agents/thermo-nuclear-code-quality-review-subagent.md`
- **Archivos del repo origen NO instalados:** `plugin.json`, `marketplace.json`,
  `assets/logo.png`, `README.md`. Metadatos de empaquetado; no hacen falta.
- **Modificación local (única):** en los dos agentes, la referencia a la skill
  cambia de `thermos:thermo-nuclear-review` a `thermo-nuclear-review` (y la
  equivalente de calidad) porque al vendorizar en `.claude/skills/` desaparece
  el espacio de nombres `thermos:` del plugin. Nada más se tocó; las tres
  skills son byte a byte iguales al origen.
- **Licencia:** MIT, © 2026 Cursor (las rúbricas son del plugin Thermos de
  Cursor; la adaptación a Claude Code es de Théo Carranza). Copia incluida.
- **Hashes SHA-256 de lo instalado:**
  - `thermos/SKILL.md` `6e96b6b799ebc0db90fde3843601009d35453f8e8a19f6f4a5dca294c7360e51`
  - `thermo-nuclear-review/SKILL.md` `f1b16c7db62e2af3cbed1c7fe13595706bd61da4a98f9ab6aa072d9700c6e31d`
  - `thermo-nuclear-code-quality-review/SKILL.md` `3fe9fb20c10a3aeffc059c4c9e0624e2cc5972b02811ded56334daedec4186b2`
  - `agents/thermo-nuclear-review-subagent.md` `b91c5ee9a202a9b55fb58d1366e49c02b62926e46fa9183621c06aae2cb5d121`
  - `agents/thermo-nuclear-code-quality-review-subagent.md` `1a858e270422dc9c98704674b62f3c7bc0c2ae6d3b96de866ccae109c2845868`
- **Revisión de seguridad (manual, 2026-10-04):**
  - Solo Markdown y JSON. Sin scripts, sin hooks.
  - Sin URLs salvo las del `plugin.json` (homepage/repositorio de Cursor), que no
    se instala.
  - Ambos agentes declaran un contrato de **solo lectura**: no editar, no
    commitear, no mutar estado, no llamar APIs de pago. El orquestador tiene
    `disable-model-invocation: true` (solo lo lanza el usuario).
  - Herramientas de los agentes: `Read, Grep, Glob, Bash, Skill` y, en el de
    revisión profunda, también `WebFetch`.
- **Hallazgos aceptados (con nota):**
  1. **Superficie de inyección de prompts.** El subagente de revisión profunda
     lee la discusión del PR con `gh`/`glab` tras terminar su auditoría. Los
     comentarios de un PR son contenido de terceros. Riesgo bajo: el agente es
     de solo lectura y la instrucción es de incorporar hallazgos, no ejecutar
     órdenes. Aceptado. Mitigación: usarlo en repos propios; no en PRs de
     desconocidos sin leer antes los comentarios.
  2. **`Bash` y `WebFetch` disponibles.** Necesarios para `git diff` y para
     consultar documentación. Acotados por el contrato de solo lectura del
     propio agente, que es instrucción al modelo, no un control técnico.
     Aceptado para repos sin PHI.
- **Uso previsto en DERR:** revisión de ramas en los repos de código (MS,
  Dental, Q-Engine). En este repo de perfil tiene poco que revisar. Para
  usarlo allí, copiar la carpeta `.claude/` o instalarlo a nivel de usuario.
  **Nunca** lanzarlo sobre diffs que contengan datos de pacientes: el diff
  entra en el contexto del modelo.

---

## Cómo añadir la próxima

1. Escanear con SkillSpector (§3 de la guía). Guardar el informe.
2. Leer todos los archivos a mano. Buscar: scripts, hooks, URLs, `curl`/`wget`,
   `eval`, `exec`, `base64`, rutas `~/` o `$HOME`, variables de entorno, tokens.
3. Vendorizar solo lo necesario en `.claude/skills/<nombre>/` (y
   `.claude/agents/` si trae agentes), con su `LICENSE`.
4. Calcular `sha256sum` de cada archivo instalado.
5. Añadir fila al resumen y una sección con: origen + commit, archivos
   instalados y excluidos, licencia, hashes, revisión, hallazgos aceptados y
   uso previsto.
