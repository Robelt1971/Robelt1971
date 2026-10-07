# DERR — Spec técnica: Dictado clínico local con whisper.cpp

> Especificación corta para añadir dictado por voz (voz → texto) a los
> módulos clínicos de DERR (MS, Dental, Q-Engine). **Toca PHI**, por eso corre
> **100 % local**, dentro del mismo perímetro Docker/localhost que el resto de
> DERR. Ningún audio ni transcripción sale de la máquina.
> Fecha: 2026-10-07 · Responsable: Ernesto (Albert Rodríguez Robelt)
> Estado: **BORRADOR** — pendiente de decidir §5 antes de implementar.

---

## 0. Resumen ejecutivo (TL;DR)

- **Qué:** el clínico dicta la nota; un servidor whisper.cpp en Docker la
  transcribe; el texto aparece en el campo de la nota para **revisar y firmar**.
  El dictado nunca escribe en el expediente sin revisión humana.
- **Por qué whisper.cpp y no una app o API de voz:** es código abierto (MIT),
  corre en CPU sin GPU, los modelos se descargan una vez y se guardan en local,
  y no tiene ninguna dependencia de red en tiempo de ejecución. Es la única
  familia de opciones compatible con la regla "sin PHI en la nube" del
  `DERR-Apify-Plan-de-Accion.md` §2.
- **Idiomas:** español, neerlandés e inglés están cubiertos por los modelos
  multilingües de Whisper. **Papiamento no** está entre los 99 idiomas de
  Whisper; ver §8.
- **Descartado:** apps tipo "AI Voice Studio" / ElevenLabs y cualquier API de
  dictado en la nube, por enviar audio con PHI a terceros.

---

## 1. Objetivo y alcance

**Objetivo:** reducir el tiempo de escritura de notas clínicas permitiendo
dictarlas, sin degradar la fiabilidad del registro ni sacar PHI del entorno
local.

**En alcance:**
- Dictado de texto libre en campos de nota (evolución, anamnesis, plan,
  observaciones dentales).
- Transcripción por lotes (grabar → transcribir) como primera versión.
  El modo "en vivo" mientras se habla queda para una segunda fase.
- Selección de idioma por nota (ES / NL / EN) o detección automática.
- Revisión y edición obligatoria antes de guardar.

**Fuera de alcance (explícito):**
- Comandos de voz que naveguen o modifiquen el expediente ("borrar nota",
  "firmar"). Solo texto.
- Codificación automática (CIE-10, procedimientos) a partir del dictado.
- Identificación del hablante o cualquier biometría de voz.
- Papiamento (sin modelo disponible; ver §8).

---

## 2. Arquitectura del flujo

```
┌──────────────────────────────┐
│  Cliente DERR (navegador)    │
│  - Botón "Dictar" en la nota │
│  - Captura micrófono (WebRTC)│
│  - Envía audio WAV 16 kHz    │
└──────────────┬───────────────┘
               │ HTTP POST, solo localhost
               ▼
┌──────────────────────────────┐
│  Contenedor whisper-server   │
│  (red interna Docker, puerto │
│   publicado solo en 127.0.0.1)│
│  - Modelo GGML local         │
│  - VAD para recortar silencio│
│  - Devuelve texto + idioma   │
└──────────────┬───────────────┘
               │ JSON {text, language, segments}
               ▼
┌──────────────────────────────┐
│  Cliente DERR                │
│  - Inserta texto en el campo │
│  - Marca la nota "dictada,   │
│    sin revisar"              │
│  - El clínico corrige y firma│
└──────────────────────────────┘
```

El audio se procesa en memoria y **se descarta** al devolver el texto
(decisión por defecto; ver §5 si se requiere conservarlo para auditoría).

---

## 3. Componentes

### 3.1 Servidor de transcripción
- **whisper.cpp** (`github.com/ggml-org/whisper.cpp`, licencia MIT). Puerto en
  C/C++ del modelo Whisper de OpenAI. Trae tres binarios útiles:
  - `whisper-server`: servidor HTTP con endpoint `/inference` (archivo de
    audio → JSON). **Es el que se usa.**
  - `whisper-cli`: línea de comandos, para pruebas y benchmark.
  - `whisper-stream`: transcripción en vivo desde micrófono. Fase 2.
- Despliegue como **un contenedor más** en el `docker-compose` de DERR, con
  la imagen oficial `ghcr.io/ggml-org/whisper.cpp` fijada por **digest**, no
  por etiqueta. Volumen de solo lectura con los modelos.
- Sin acceso a red externa: `network_mode` interno o regla de firewall en el
  compose. El puerto se publica únicamente en `127.0.0.1`.

### 3.2 Modelos
- Formato GGML, descargados **una vez** desde el repositorio oficial de
  whisper.cpp en Hugging Face, hash SHA-256 verificado y anotado en
  `.claude/SHA256SUMS` (misma disciplina que las skills).
- Candidatos a evaluar en §7 (todos multilingües):

| Modelo | Tamaño aprox. | Para qué |
|---|---|---|
| `large-v3-turbo` (q5_0 / q8_0) | 0,5–0,9 GB | Candidato principal: calidad de large-v3 con ~4× menos coste de decodificación |
| `medium` (q5_0) | ~0,5 GB | Alternativa si turbo va lento en la máquina |
| `small` | ~0,5 GB | Solo si la CPU no da para más; peor con términos médicos |

- No usar las variantes `.en`: solo inglés.

### 3.3 Vocabulario médico
- Whisper no admite diccionarios personalizados. El mecanismo disponible es el
  **prompt inicial** (`--prompt` / campo `prompt` del servidor): un texto corto
  con terminología frecuente del módulo (p. ej. "amoxicilina, periodontitis,
  oclusión, radiografía periapical") que sesga la transcripción hacia esos
  términos. Un prompt por módulo (MS, Dental), en el idioma de la nota.
- Lista de **correcciones post-transcripción** (reemplazos exactos) para los
  errores sistemáticos que aparezcan en §7. Vive en configuración, no en código.

### 3.4 Integración en el cliente DERR
- Botón "Dictar" junto a los campos de texto largo. Grabación con
  `MediaRecorder`, conversión a WAV mono 16 kHz antes de enviar.
- El texto devuelto se **inserta** en la posición del cursor, nunca sustituye
  el contenido existente.
- La nota queda marcada como `dictada_sin_revisar` hasta que el clínico la
  edite o confirme explícitamente. Esa marca se registra en la auditoría de la
  nota (quién dictó, cuándo, modelo y versión usados).

---

## 4. Configuración operativa

| Parámetro | Valor propuesto |
|---|---|
| Modelo inicial | `large-v3-turbo` q5_0 (confirmar en §7) |
| Hilos CPU | núcleos físicos − 1 |
| Idioma | `auto`, con override manual por nota |
| VAD | activado (modelo Silero incluido en whisper.cpp) |
| Duración máxima por grabación | 3 min (más largo → trocear) |
| Audio tras transcribir | descartado (por defecto) |
| Red del contenedor | interna; puerto solo en `127.0.0.1` |
| Logs del servidor | sin texto transcrito; solo tiempos y errores |

---

## 5. Decisiones pendientes

- [ ] **Conservar audio o no.** Por defecto se descarta. Si auditoría o
      medicina legal exige conservarlo, debe guardarse **cifrado** en
      `DERR-Protected-Data` con la misma retención que la nota, y hay que
      documentarlo como PHI adicional.
- [ ] **Hardware disponible.** CPU, RAM y si hay GPU en la máquina de
      producción. Determina modelo y latencia aceptable.
- [ ] **Módulo piloto.** Propuesta: notas de evolución de **MS** (texto libre,
      un idioma dominante por sesión). Dental después.
- [ ] **Latencia aceptable** para el clínico: proponer ≤ 1,5× la duración del
      audio en modo por lotes.
- [ ] **Qué hacer con papiamento** (§8): descartarlo, o probar la
      transcripción como español/neerlandés y medir cuánto se pierde.

---

## 6. Criterios de aceptación

- [ ] **Cero conexiones salientes** del contenedor de whisper durante una
      sesión de dictado (verificado con captura de red o firewall en modo
      registro).
- [ ] Transcripción en ES, NL y EN sobre un corpus de prueba **sin PHI**
      (notas sintéticas leídas en voz alta) con tasa de error de palabra que el
      clínico juzgue aceptable; objetivo orientativo: WER ≤ 10 % en ES.
- [ ] Latencia dentro del límite fijado en §5.
- [ ] Ninguna nota dictada se guarda sin pasar por el estado
      `dictada_sin_revisar` y una acción explícita del clínico.
- [ ] Los logs del servidor no contienen texto transcrito ni rutas de audio.
- [ ] Imagen y modelo fijados por hash y registrados en `.claude/SHA256SUMS`
      y `.claude/THIRD-PARTY-LICENSES.md`.

---

## 7. Plan de pruebas

1. **Benchmark de modelos** con `whisper-cli` sobre 10 notas sintéticas por
   idioma, grabadas por 2 voces. Medir WER y tiempo real por modelo de §3.2.
   Elegir el mejor que cumpla la latencia de §5.
2. **Términos médicos:** repetir con y sin prompt inicial; anotar errores
   sistemáticos → lista de correcciones de §3.3.
3. **Silencio y ruido:** grabaciones con pausas largas y ruido de consulta.
   Verificar que el VAD evita transcripciones inventadas en los silencios.
4. **Cambio de idioma:** notas mixtas ES/NL; comprobar que `auto` acierta o
   que el override manual funciona.
5. **Aislamiento de red:** levantar el contenedor con el firewall registrando
   todo; dictar; confirmar cero tráfico saliente.
6. **Flujo completo:** dictar → revisar → firmar; verificar marca de auditoría
   y que el audio no queda en disco (o queda cifrado, según §5).

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Alucinaciones** de Whisper en silencios o audio corto (frases inventadas, repeticiones) | VAD activado; descartar segmentos con probabilidad baja; revisión humana obligatoria |
| Error en dosis, lateralidad o negaciones ("no presenta") | Revisión obligatoria antes de firmar; resaltar números y negaciones en el texto dictado para que el ojo vaya ahí |
| **Papiamento sin soporte** | Fuera de alcance en v1. Opción futura: fine-tuning comunitario de Whisper si aparece un dataset; mientras tanto, dictar en ES/NL |
| Latencia alta en CPU modesta | Bajar a `medium`/`small` cuantizado; trocear grabaciones; o GPU dedicada |
| Fuga de PHI por configuración | Puerto solo en `127.0.0.1`, red interna, logs sin contenido, test de aislamiento en §7.5 en cada actualización |
| Cadena de suministro (imagen o modelo manipulados) | Imagen por digest, modelo por SHA-256, ambos registrados; actualización solo tras re-verificar |
| El clínico confía ciegamente en el texto | Estado `dictada_sin_revisar` visible y bloqueante para firmar |

---

## 9. Relación con las reglas DERR vigentes

- **PHI solo local:** cumple por diseño (§2, §4). Cualquier cambio que
  introduzca una llamada de red en el flujo de dictado invalida esta spec.
- **Código de terceros:** whisper.cpp no es una skill de Claude Code, así que
  `DERR-Seguridad-Skills-SkillSpector.md` no aplica literalmente, pero sí su
  espíritu: versión fijada, hash verificado y licencia (MIT) anotada en
  `.claude/THIRD-PARTY-LICENSES.md`. El modelo Whisper está bajo licencia
  MIT de OpenAI.
- **Separación con el ecosistema Apify/Firecrawl:** ninguna relación. El
  dictado vive dentro del core clínico; Apify queda fuera de él.

---

*Relacionado: `DERR-Apify-Plan-de-Accion.md` §2 (regla "sin PHI en la nube")
y `DERR-Seguridad-Skills-Aprobadas.md` (disciplina de hashes y licencias).*
