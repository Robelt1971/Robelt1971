# DERR — Dictado clínico local (whisper.cpp)

Implementación de la spec `docs/DERR-Dictado-Clinico-Whisper-Spec.md`. Todo corre
en `127.0.0.1`; ningún audio ni texto sale de la máquina.

> **Sin PHI mientras sea prueba.** Hasta que el servicio esté integrado en el
> cliente DERR y haya pasado §6 de la spec, dicta solo notas sintéticas.

## Puesta en marcha (Windows con Docker Desktop: desde Git Bash o WSL)

```bash
cd docker/dictado
cp .env.example .env            # opcional: modelo, hilos, puerto
./descargar-modelos.sh          # ~0,6 GB, una sola vez; registra/verifica SHA-256
docker compose -f docker-compose.whisper.yml up -d
./probar-dictado.sh estado      # debe decir "Servidor responde: sí"
./probar-dictado.sh aislamiento # puerto solo loopback, cero salida a internet
```

Luego abre **http://127.0.0.1:8081/** en el navegador: botón «Dictar», hablas,
«Parar», y el texto aparece marcado como *dictado sin revisar* hasta que pulses
«Confirmar revisión». La página muestra idioma detectado, segundos de audio y
de transcripción y el ratio (objetivo ≤ 1,5×).

El primer arranque tarda hasta un minuto en cargar el modelo (`start_period`
del healthcheck). Si la página no responde, mira `docker compose -f
docker-compose.whisper.yml logs`.

## Qué hay en esta carpeta

| Archivo | Para qué |
|---|---|
| `docker-compose.whisper.yml` | Servicio `derr-whisper`: `whisper-server` con VAD, conversión ffmpeg, puerto solo en loopback, sin capabilities, modelos en solo lectura, temporales en RAM. Copiar al compose principal de DERR. |
| `.env.example` | Modelo, idioma por defecto, hilos, puerto, memoria. |
| `descargar-modelos.sh` | Descarga el modelo Whisper y el modelo VAD (Silero) a `models/` y verifica SHA-256 contra `models/SHA256SUMS`. |
| `probar-dictado.sh` | `estado`, `transcribir`, `benchmark` y `aislamiento` (spec §7). |
| `prompts/<modulo>-<idioma>.txt` | Prompt inicial con vocabulario médico por módulo (MS, Dental) e idioma (es, nl). Editable sin tocar código. |
| `public/index.html` | Página de dictado de prueba servida por el propio `whisper-server`. También es la **implementación de referencia** del botón «Dictar» (función `transcribir()`). |
| `models/` | Modelos descargados. Fuera de git salvo `SHA256SUMS`. |
| `audio-prueba/` | Audios sintéticos para el benchmark. Fuera de git. |

## Benchmark de modelos (spec §7.1)

```bash
# graba 10 notas sintéticas por idioma con cualquier grabadora (wav/m4a/webm) en audio-prueba/
./probar-dictado.sh benchmark audio-prueba es ms
# cambia WHISPER_MODEL en .env, reinicia el contenedor y repite
./descargar-modelos.sh ggml-medium-q5_0.bin
```

El WER se anota a mano comparando con el texto leído. Los errores que se
repitan van a la lista de correcciones (spec §3.3, pendiente de implementar en
el cliente).

## Integración en el cliente DERR (lo que falta)

1. Añadir el servicio `derr-whisper` al compose principal de DERR y la descarga
   de modelos al procedimiento de instalación.
2. Portar `transcribir()` e `insertarEnCursor()` de `public/index.html` al
   componente de nota del cliente. La URL del servidor es
   `http://127.0.0.1:8081/inference`; el servidor responde con CORS abierto,
   así que no hace falta proxy.
3. Guardar en la auditoría de la nota: usuario, fecha, modelo y versión de la
   imagen, y el estado `dictada_sin_revisar` hasta la confirmación (spec §3.4).
4. Antes de producción: fijar la imagen por digest (comentario al inicio del
   compose) y copiar `models/SHA256SUMS` a `.claude/SHA256SUMS`.

## Seguridad

- El servidor expone también `/load` (cambiar de modelo en caliente). Solo es
  alcanzable desde la propia máquina; aun así, no publicar nunca el puerto fuera
  de `127.0.0.1`.
- `--no-context` evita que un dictado influya en el siguiente;
  `--suppress-nst` y el VAD reducen las alucinaciones en silencios (spec §8).
- Los logs de `whisper-server` no incluyen el texto transcrito. Si en el
  benchmark aparece texto en `docker compose logs`, es un fallo de §6.
