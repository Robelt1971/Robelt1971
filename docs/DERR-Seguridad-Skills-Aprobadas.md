# DERR — Registro de skills y plugins externos aprobados

> Registro exigido por `DERR-Seguridad-Skills-SkillSpector.md` (§3.4).
> Propiedad de cada dato: `.claude/SHA256SUMS` tiene archivos, commit de origen
> y hashes; `.claude/THIRD-PARTY-LICENSES.md` tiene el texto legal; este
> registro tiene el estado de revisión y el único procedimiento de alta. Las
> tres cosas comparten la clave `<nombre>`.
> Fecha: 2026-10-04 · Actualizado: 2026-10-05 · Responsable: Ernesto (Albert Rodríguez Robelt)

---

## Resumen

| Sección | Origen | Revisión manual | SkillSpector | Estado |
|---|---|---|---|---|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | 2026-10-04 | pendiente | **Provisional** |
| `thermos` | [theocarranza/thermos-claude](https://github.com/theocarranza/thermos-claude) | 2026-10-05 | pendiente | **Provisional** |

- **SkillSpector:** `pendiente`, o `<puntuación máxima> <su veredicto> (<fecha>)`
  entre los informes de la sección (paso 6).
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
  `.claude/skills/` desaparece ese espacio de nombres; (2) en los dos agentes
  se quitó `Bash` de la línea `tools:`, y en `thermo-nuclear-review-subagent.md`
  también `WebFetch` (2026-10-05, ver hallazgos). El cuerpo de los agentes
  sigue siendo el del origen, así que sus menciones a `gh`/`glab` y a ejecutar
  tests quedan inoperantes; el agente debe decirlo en su informe si le afecta.
- **Revisión manual (2026-10-05):** solo Markdown y JSON. Sin scripts, sin
  hooks. Sin URLs salvo las del `plugin.json` (no instalado). Ambos agentes
  declaran un contrato de solo lectura. El orquestador tiene
  `disable-model-invocation: true` (solo lo lanza el usuario) y es quien
  recoge el diff y se lo pasa a los subagentes.
- **Hallazgos:**
  - *Resuelto (2026-10-05):* los dos subagentes venían con `Bash` (red sin
    restricciones) y el de revisión profunda además con `WebFetch`. Como ambos
    reciben en su prompt el diff y los archivos cambiados, contenido que en un
    PR ajeno es no confiable, una inyección en el diff podía ordenarles sacar
    datos. Se quitaron ambas herramientas. El orquestador ya aporta el diff, y
    `Read`, `Grep` y `Glob` bastan para leer el código circundante. Coste: sin
    `git log`/`git blame`, sin leer comentarios del PR y sin ejecutar tests
    durante la revisión.
  - *Aceptado (2026-10-05):* una inyección en el diff aún puede sesgar el
    veredicto (ocultar hallazgos, inventarlos). Sin canal de salida, el daño se
    limita a la calidad de la revisión. Por eso el veredicto de Thermos es una
    opinión más, no un control.
- **Uso previsto:** revisión de ramas en los repos de código propios (MS, Dental,
  Q-Engine); en este repo de perfil tiene poco que revisar. Para usarlo allí,
  copiar la carpeta `.claude/` o instalarlo a nivel de usuario. Nunca lanzarlo
  sobre diffs que contengan datos de pacientes: el diff entra en el contexto
  del modelo. Su veredicto no sustituye la revisión humana.

---

## Cómo añadir la próxima

Nada de lo que sigue se mezcla en `main` hasta el paso 7. Si el paso 6 da
`DO NOT INSTALL`, se borran las carpetas y se añade una fila `Rechazada`.

1. Clonar el origen en una carpeta temporal y leer todos los archivos a mano.
   Buscar: scripts, hooks, URLs, `curl`/`wget`, `eval`, `exec`, `base64`, rutas
   `~/` o `$HOME`, variables de entorno, tokens, herramientas con red en
   agentes (`Bash`, `WebFetch`).
2. Copiar solo lo necesario a `.claude/skills/<nombre>/` (y `.claude/agents/`
   si trae agentes).
3. Hacer las modificaciones locales que hagan falta (espacios de nombres,
   herramientas que sobran). Anotarlas en la sección del paso 7.
4. Desde dentro de `.claude/`: añadir a `SHA256SUMS` un marcador
   `# --- <nombre> @ <owner/repo> <commit> (<fecha>) [<subruta>]` y debajo la
   salida de `sha256sum <archivos>`. Por cada archivo modificado en el paso 3,
   añadir su hash de origen en una línea de comentario `(origen)`. Comprobar
   con `sha256sum -c SHA256SUMS`.
5. Pegar el texto de la licencia en `THIRD-PARTY-LICENSES.md` bajo `## <nombre>`.
6. Escanear **lo instalado**, es decir, exactamente lo que acaba de recibir
   hash. SkillSpector trata un directorio como una sola skill: un informe por
   carpeta, desde la raíz del repo. Para una sección con agentes, escanear
   también `.claude/agents/`.

   ```bash
   skillspector scan .claude/skills/<carpeta>/ --no-llm --format markdown \
     --output docs/skillspector/<nombre>-<carpeta>-$(date +%F).md
   ```

7. Añadir aquí una fila al resumen y una sección `## <nombre>` con: qué hace,
   excluido del origen, modificaciones locales (o "ninguna"), revisión manual
   con fecha, hallazgos (resueltos o aceptados, con fecha, o "ninguno") y uso
   previsto.
