# DERR — Regla de seguridad: escanear toda skill externa con SkillSpector

> Política DERR para instalar *skills*, plugins y servidores MCP de terceros en
> Claude Code (y en Codex CLI / Gemini CLI si se usan). Complementa las
> "Buenas prácticas de seguridad" de `DERR-Apify-MCP-Server-Setup.md`.
> Fecha: 2026-10-04 · Responsable: Ernesto (Albert Rodríguez Robelt)
> Estado: **ACTIVA**

---

## 0. Resumen ejecutivo (TL;DR)

- **Regla:** ninguna skill, plugin o servidor MCP de origen externo se instala en
  un entorno DERR sin pasar antes por **NVIDIA SkillSpector** y obtener un
  veredicto `SAFE` (o `CAUTION` revisado a mano y justificado).
- **Excepción vigente:** las filas `Provisional` del registro, instaladas con
  revisión manual antes de tener SkillSpector en la máquina local, hasta que §6
  las cierre.
- **Por qué:** el estudio de NVIDIA sobre 31 132 skills públicas encontró que el
  26,1 % tenía vulnerabilidades y el 5,2 % mostraba intención maliciosa
  probable. Una skill maliciosa se ejecuta con los permisos del desarrollador:
  en DERR eso significa acceso potencial a `DERR-Protected-Data` y a tokens.
- **Qué NO es:** SkillSpector no es un antivirus ni protege contra hackeos en
  general. Solo vetea el código y las instrucciones de una skill *antes* de
  instalarla. La defensa real de DERR sigue siendo correr local, no enviar PHI
  a la nube y tratar los tokens como secretos.
- **Guardián opcional:** existe un hook comunitario (`skillspector-gate`) que
  **bloquea automáticamente** cualquier skill no escaneada y aprobada. Es la
  versión "a prueba de olvidos" de esta regla (§4).

---

## 1. Qué es SkillSpector

- Escáner de seguridad de código abierto (Apache 2.0) publicado por NVIDIA en
  `github.com/NVIDIA/SkillSpector`.
- Analiza una skill en dos etapas:
  1. **Estática** (regex, AST de Python, YARA): rápida, local, sin API key.
  2. **Semántica con LLM** (opcional): evalúa la *intención* del código y de
     las instrucciones. Envía el contenido de los archivos al proveedor
     configurado.
- 71 patrones en 17 categorías (a fecha de 2026-10-04): inyección de prompts,
  exfiltración de datos, escalada de privilegios, riesgo de cadena de suministro,
  ejecución de código peligroso, persistencia, ofuscación, etc.
- **Nunca ejecuta** la skill que analiza.
- Devuelve una **puntuación de riesgo 0–100** con veredicto:

| Puntuación | Severidad | Veredicto |
|---|---|---|
| 0–20 | LOW | `SAFE` |
| 21–50 | MEDIUM | `CAUTION` |
| 51–80 | HIGH | `DO NOT INSTALL` |
| 81–100 | CRITICAL | `DO NOT INSTALL` |

Pesos: CRITICAL +50, HIGH +25, MEDIUM +10, LOW +5. Los scripts ejecutables
multiplican ×1,3 (son ~2× más propensos a ser vulnerables que un `SKILL.md`
puro).

---

## 2. Instalación

Requisitos: Python **3.12 o superior** y `uv`.

```bash
# Solo CLI (recomendado para DERR)
uv tool install git+https://github.com/NVIDIA/skillspector.git

# Con soporte MCP (para exponer el escáner como herramienta al agente)
uv tool install 'skillspector[mcp] @ git+https://github.com/NVIDIA/skillspector.git'

# Desde el código fuente
git clone https://github.com/NVIDIA/skillspector.git
cd skillspector
uv venv .venv && source .venv/bin/activate
make install
```

> Los comandos provienen del README oficial de NVIDIA (ver Fuentes). No se
> pudieron ejecutar en la sesión remota que redactó esta guía (la política del
> entorno bloquea instalar código externo), así que **verifica en tu máquina
> local** la primera vez.

---

## 3. Uso: el flujo DERR paso a paso

### 3.1 Escanear antes de instalar

```bash
# Carpeta local de una skill
skillspector scan ./mi-skill/

# Un único SKILL.md
skillspector scan ./SKILL.md

# Repositorio Git (sin clonar a mano)
skillspector scan https://github.com/usuario/mi-skill

# Archivo zip
skillspector scan ./mi-skill.zip
```

### 3.2 Modo DERR por defecto: estático, sin LLM

El comando exacto está en el registro, apartado "Escanear".

- `--no-llm` evita enviar el contenido de la skill a ningún proveedor de LLM.
  Es el modo **obligatorio** si la skill pudiera contener rutas, nombres o
  cualquier dato relacionado con pacientes o con la infraestructura clínica.
- **Aviso de red:** incluso con `--no-llm`, el analizador de cadena de
  suministro (SC4) envía **nombres y versiones de dependencias** a
  `api.osv.dev` para buscar vulnerabilidades conocidas. No envía código ni
  datos, pero conviene saberlo.
- Formatos de salida: `terminal` (por defecto), `json`, `markdown`, `sarif`.

### 3.3 Segunda pasada con LLM (solo skills sin datos sensibles)

Para skills de propósito general (p. ej. utilidades de scraping, formato de
documentos) puedes añadir la capa semántica. Proveedores soportados y variable
de credencial (modelos por defecto a fecha de 2026-10-04; pueden cambiar):

| Proveedor | Variable | Modelo por defecto |
|---|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` | claude-opus-4-6 |
| `openai` | `OPENAI_API_KEY` | gpt-5.4 |
| `bedrock` | `AWS_PROFILE`, `AWS_REGION` | Sonnet 4.6 |
| `nv_build` | `NVIDIA_INFERENCE_KEY` | glm-5.2 |
| `ollama` | (ninguna, local) | llama3.1:8b |
| `azure_openai` | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` | gpt-4o |
| `openai_compatible` | `SKILLSPECTOR_COMPAT_API_KEY`, `SKILLSPECTOR_COMPAT_BASE_URL` | llama-3.1-70b-versatile |

> **Preferencia DERR:** `ollama` (modelo local, nada sale de la máquina). Si se
> usa un proveedor en la nube, la skill escaneada debe estar libre de cualquier
> referencia a PHI o a la infraestructura clínica.

### 3.4 Decisión

| Veredicto | Acción DERR |
|---|---|
| `SAFE` | Instalar. |
| `CAUTION` | Leer los hallazgos uno a uno. Las skills con mucha documentación generan falsos positivos. Instalar solo si cada hallazgo está explicado y anotado. |
| `DO NOT INSTALL` | No instalar. Sin excepciones. Buscar alternativa. |

Toda skill se anota en `DERR-Seguridad-Skills-Aprobadas.md`, que incluye el
procedimiento de alta.

---

## 4. El "guardián": `skillspector-gate` (bloqueo automático)

Hay un plugin comunitario, **`JPF1111/skillspector-gate`** (Apache 2.0), que
convierte esta regla en un control técnico en lugar de una buena intención:

**Qué hace**
- Instala un hook `PreToolUse` sobre la herramienta `Skill` de Claude Code.
- Cada vez que Claude intenta invocar una skill, el hook localiza su carpeta,
  calcula un **hash SHA-256 de todos sus archivos** y lo compara con un
  **libro de aprobaciones** (ledger).
- Si la skill no está aprobada, no tiene entrada en el ledger, o **su contenido
  cambió** desde la aprobación, **bloquea la ejecución**.
- Re-bloquea automáticamente al instante en que cambie un solo byte de la
  skill aprobada (defensa contra actualizaciones maliciosas "silenciosas").

**Instalación** (requiere SkillSpector ya instalado, §2):

```text
/plugin marketplace add JPF1111/skillspector-gate
/plugin install skillspector-gate
```

Luego reinicia Claude Code o ejecuta `/hooks` para activar el gate en la sesión.

**Aprobar una skill tras escanearla y revisarla**

```bash
python3 <plugin-dir>/scripts/approve.py "<carpeta-de-la-skill>" \
  --verdict APPROVE --note "qué se revisó y por qué se aprueba"
```

`--verdict` es obligatorio: `APPROVE`, `CAUTION` o `REJECT`. **Ojo:** en el
gate, `CAUTION` es una marca, no un bloqueo: la skill sigue pudiendo ejecutarse.
Si la política DERR exige revisión antes de usarla, registra `REJECT` hasta
terminarla y luego `APPROVE`. `--skip-scan` omite el re-escaneo (no usar en
DERR).

**Limitaciones declaradas por el autor**
- Las skills integradas de Claude Code y las sincronizadas desde claude.ai
  **no pasan por el gate** (solo las instaladas en disco).
- El escaneo estático da falsos positivos en skills con mucha documentación;
  la revisión humana (o la capa LLM) es la que los filtra.
- Es un proyecto de terceros, no de NVIDIA. **Aplica la misma regla:** escanea
  `skillspector-gate` con SkillSpector antes de instalarlo, y revisa su código
  (es pequeño: un hook y un script de aprobación).

**Alternativas equivalentes vistas en la comunidad**
- `TronJuan/skillspector-claude-skill`: skill de Claude Code que permite
  preguntar "¿es segura esta skill? [url]" y Claude ejecuta SkillSpector por
  ti. Añade un modo opcional `SKILLSPECTOR_SCORING=contextual` que redujo un
  66 % los falsos `DO NOT INSTALL` en su set de pruebas. Usa un *fork* del
  escáner, no el oficial.
- `epistemedeus/skillguard`: escáner estático independiente con hook
  `PreToolUse` similar.

**Recomendación DERR:** instalar `skillspector-gate` en la máquina de
desarrollo principal. Es la única forma de que la regla se cumpla aunque se
olvide. Para la skill de TronJuan, usar solo si se prefiere el flujo
conversacional y aceptando que corre un fork.

---

## 5. Lo que SkillSpector NO cubre (y qué sí lo cubre en DERR)

| Amenaza | ¿SkillSpector? | Control DERR vigente |
|---|---|---|
| Skill maliciosa o vulnerable | **Sí** | Esta regla + gate |
| Fuga de PHI a la nube | No | DERR corre local; Apify y MCP solo sin PHI |
| Tokens filtrados (Apify, APIs) | No | Tokens como secreto, `.gitignore`, rotación |
| Inyección de prompts desde webs scrapeadas | Parcial (solo dentro de la skill) | Revisión humana de outputs; Actors solo informan, no deciden |
| Vulnerabilidades en dependencias del propio DERR | No | Auditoría de dependencias del proyecto (pendiente de formalizar) |
| Cambios de código en el repo | No | Skill `security-review` de Claude Code antes de mergear |

---

## 6. Estado y próximos pasos

- [ ] Instalar SkillSpector en la máquina local de desarrollo (§2) y verificar
      con `skillspector --version`.
- [ ] Escanear `skillspector-gate` con SkillSpector y, si da `SAFE`, instalarlo
      como guardián (§4).
- [x] Crear el registro de la §3.4: `DERR-Seguridad-Skills-Aprobadas.md`
      (2026-10-04).
- [ ] Escanear las filas `Provisional` del registro (su apartado "Escanear",
      sobre lo instalado) y rellenar su columna SkillSpector. Cierra la
      excepción vigente de §0.
- [ ] Añadir a este doc cualquier falso positivo recurrente y cómo se resolvió.

---

## Fuentes

- [NVIDIA/SkillSpector (GitHub, README oficial)](https://github.com/NVIDIA/SkillSpector)
- [Scanning agent skills (docs.nvidia.com)](https://docs.nvidia.com/skills/scanning-agent-skills)
- [JPF1111/skillspector-gate (GitHub)](https://github.com/JPF1111/skillspector-gate)
- [TronJuan/skillspector-claude-skill (GitHub)](https://github.com/TronJuan/skillspector-claude-skill)
- [epistemedeus/skillguard (GitHub)](https://github.com/epistemedeus/skillguard)
- [From green checkmark to real judgment: auditing AI agent skills with SkillSpector (Towards Data Science)](https://towardsdatascience.com/from-green-checkmark-to-real-judgment-auditing-ai-agent-skills-with-skillspector/)
- [OWASP Agentic Skills Top 10 — Skill Scanner Integration](https://owasp.org/www-project-agentic-skills-top-10/skill-scanner-integration)
