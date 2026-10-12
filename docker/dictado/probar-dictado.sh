#!/usr/bin/env bash
# DERR — pruebas del servicio de dictado (spec §7). Sin PHI: usa SOLO notas
# sintéticas leídas en voz alta. Funciona en Linux, macOS, WSL y Git Bash.
#
#   ./probar-dictado.sh estado
#   ./probar-dictado.sh transcribir <audio> [idioma] [modulo]   idioma: auto|es|nl|en  modulo: ms|dental
#   ./probar-dictado.sh benchmark <carpeta> [idioma] [modulo]   todos los audios de la carpeta
#   ./probar-dictado.sh aislamiento                             puerto solo loopback + cero salida a internet
#
# El audio puede ser wav, webm, ogg, m4a o mp3: el servidor lo convierte con ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
COMPOSE=(docker compose -f docker-compose.whisper.yml)
PORT="${WHISPER_PORT:-8081}"
BASE="http://127.0.0.1:$PORT"

prompt_de() {  # modulo idioma -> texto del prompt inicial (vacío si no hay archivo)
  local f="prompts/$1-$2.txt"
  [ "$2" = auto ] && f="prompts/$1-es.txt"
  [ -f "$f" ] && tr '\n' ' ' < "$f" || true
}

campo_json() {  # archivo_json campo -> valor (python3 si existe; si no, sed básico)
  if command -v python3 >/dev/null; then
    python3 -I -c 'import json,sys; d=json.load(open(sys.argv[1],encoding="utf-8")); v=d.get(sys.argv[2],""); print(v if not isinstance(v,float) else round(v,2))' "$1" "$2"
  else
    # Fallback sin python: cadenas (con comillas escapadas) o números.
    sed -n "s/.*\"$2\":\"\(\([^\"\\\\]\|\\\\.\)*\)\".*/\1/p; t; s/.*\"$2\":\([0-9.]*\).*/\1/p" "$1" | head -1
  fi
}

estado() {
  "${COMPOSE[@]}" ps
  echo
  echo -n "Puerto publicado: "; "${COMPOSE[@]}" port derr-whisper 8080 || echo "(contenedor parado)"
  echo -n "Servidor responde: "
  if curl -sf -o /dev/null --max-time 5 "$BASE/"; then echo "sí ($BASE)"; else echo "NO"; exit 1; fi
}

transcribir() {
  local audio="$1" idioma="${2:-auto}" modulo="${3:-ms}" out t0 t1
  [ -f "$audio" ] || { echo "No existe $audio" >&2; exit 1; }
  out="$(mktemp)"
  t0=$(date +%s.%N)
  curl -sS --fail --max-time 600 "$BASE/inference" \
    -F "file=@$audio" \
    -F "language=$idioma" \
    -F "prompt=$(prompt_de "$modulo" "$idioma")" \
    -F "temperature=0.0" \
    -F "temperature_inc=0.2" \
    -F "response_format=verbose_json" > "$out"
  t1=$(date +%s.%N)
  local dur lang texto tiempo ratio
  dur="$(campo_json "$out" duration)"; lang="$(campo_json "$out" language)"; texto="$(campo_json "$out" text)"
  tiempo="$(awk -v a="$t0" -v b="$t1" 'BEGIN{printf "%.1f", b-a}')"
  ratio="$(awk -v d="$dur" -v t="$tiempo" 'BEGIN{ if (d>0) printf "%.2f", t/d; else print "-"}')"
  echo "archivo : $audio"
  echo "idioma  : $lang (pedido: $idioma)   módulo: $modulo"
  echo "audio   : ${dur}s   transcripción: ${tiempo}s   ratio: ${ratio}x  (spec §5: objetivo ≤ 1.5x)"
  echo "texto   :"
  echo "$texto" | sed 's/^ *//'
  rm -f "$out"
  # Para el benchmark:
  echo "$audio|$lang|$dur|$tiempo|$ratio" >> "${BENCH_LOG:-/dev/null}"
}

benchmark() {
  local dir="$1" idioma="${2:-auto}" modulo="${3:-ms}"
  [ -d "$dir" ] || { echo "No existe la carpeta $dir" >&2; exit 1; }
  export BENCH_LOG; BENCH_LOG="$(mktemp)"
  local n=0
  for f in "$dir"/*.wav "$dir"/*.webm "$dir"/*.ogg "$dir"/*.m4a "$dir"/*.mp3; do
    [ -f "$f" ] || continue
    n=$((n+1)); echo "----- [$n] $f"; transcribir "$f" "$idioma" "$modulo"; echo
  done
  [ "$n" -gt 0 ] || { echo "Sin audios en $dir"; exit 1; }
  echo "===== Resumen (modelo: ${WHISPER_MODEL:-ggml-large-v3-turbo-q5_0.bin}, hilos: ${WHISPER_THREADS:-4})"
  printf "%-40s %-8s %8s %8s %7s\n" archivo idioma audio_s trans_s ratio
  awk -F'|' '{printf "%-40s %-8s %8s %8s %7s\n", substr($1,length($1)-39), $2, $3, $4, $5}' "$BENCH_LOG"
  awk -F'|' '{t+=$4; d+=$3} END{ if (d>0) printf "TOTAL  audio %.0fs  transcripción %.0fs  ratio medio %.2fx\n", d, t, t/d }' "$BENCH_LOG"
  echo "Anota el WER a mano comparando con el texto leído (spec §6: objetivo ≤ 10 % en ES)."
  rm -f "$BENCH_LOG"
}

aislamiento() {
  local fallos=0
  echo "1) El puerto solo escucha en loopback"
  local pub; pub="$("${COMPOSE[@]}" port derr-whisper 8080 2>/dev/null || true)"
  if [[ "$pub" == 127.0.0.1:* ]]; then echo "   OK  $pub"; else echo "   FALLO  publicado como '$pub' (debe ser 127.0.0.1:...)"; fallos=$((fallos+1)); fi

  echo "2) El contenedor no puede salir a internet (DNS)"
  if "${COMPOSE[@]}" exec -T derr-whisper getent hosts huggingface.co >/dev/null 2>&1; then
    echo "   FALLO  el contenedor resuelve nombres externos"; fallos=$((fallos+1))
  else echo "   OK  sin resolución DNS externa"; fi

  echo "3) El contenedor no puede salir a internet (HTTPS)"
  if "${COMPOSE[@]}" exec -T derr-whisper curl -sS --max-time 5 -o /dev/null https://huggingface.co 2>/dev/null; then
    echo "   FALLO  el contenedor tiene salida HTTPS"; fallos=$((fallos+1))
  else echo "   OK  sin salida HTTPS"; fi

  echo "4) El volumen de modelos es de solo lectura"
  if "${COMPOSE[@]}" exec -T derr-whisper sh -c 'touch /models/.prueba 2>/dev/null'; then
    echo "   FALLO  /models es escribible"; fallos=$((fallos+1))
  else echo "   OK  /models solo lectura"; fi

  echo
  if [ "$fallos" -eq 0 ]; then
    echo "AISLAMIENTO OK (spec §6, criterio 1)."
  else
    echo "AISLAMIENTO: $fallos fallo(s)."
    echo "Si fallan 2) o 3): en docker-compose.whisper.yml añade 'internal: true' a la red"
    echo "derr-dictado, reinicia y comprueba con './probar-dictado.sh estado' que el puerto"
    echo "sigue respondiendo. Si con internal el puerto deja de responder en tu Docker,"
    echo "bloquea la salida del contenedor con el firewall del host y repite esta prueba."
    exit 1
  fi
}

case "${1:-}" in
  estado)      estado ;;
  transcribir) shift; transcribir "$@" ;;
  benchmark)   shift; benchmark "$@" ;;
  aislamiento) aislamiento ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac
