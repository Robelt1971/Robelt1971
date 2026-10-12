#!/usr/bin/env bash
# DERR — descarga y verifica (SHA-256) los modelos de whisper.cpp.
# Se ejecuta UNA vez por máquina. Requiere curl y sha256sum (o shasum).
# Funciona en Linux, macOS, WSL y Git Bash.
#
# Uso:
#   ./descargar-modelos.sh                 # modelo de .env o large-v3-turbo-q5_0 + VAD
#   ./descargar-modelos.sh ggml-medium-q5_0.bin ggml-small.bin   # otros, para el benchmark
#
# Hashes: models/SHA256SUMS. La primera descarga de un archivo REGISTRA su hash
# (trust on first use); las siguientes lo VERIFICAN. Tras la primera descarga,
# copiar las líneas a .claude/SHA256SUMS del repo (sección whisper.cpp) para
# que queden bajo control de versiones junto a las skills.
set -euo pipefail

cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
MODELS_DIR="models"
SUMS="$MODELS_DIR/SHA256SUMS"
mkdir -p "$MODELS_DIR"
touch "$SUMS"

if command -v sha256sum >/dev/null; then
  sha() { sha256sum "$1" | cut -d' ' -f1; }
elif command -v shasum >/dev/null; then
  sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
else
  echo "ERROR: hace falta sha256sum o shasum" >&2; exit 1
fi
command -v curl >/dev/null || { echo "ERROR: hace falta curl" >&2; exit 1; }

url_de() {
  case "$1" in
    ggml-silero-*.bin) echo "https://huggingface.co/ggml-org/whisper-vad/resolve/main/$1" ;;
    ggml-*.bin)        echo "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$1" ;;
    *) echo "ERROR: nombre de modelo no reconocido: $1 (esperado ggml-<modelo>.bin)" >&2; return 1 ;;
  esac
}

descargar() {
  local f="$1" dest="$MODELS_DIR/$1" url
  url="$(url_de "$f")"
  if [ ! -s "$dest" ]; then
    echo ">> Descargando $f"
    curl -L --fail --progress-bar -o "$dest.part" "$url"
    mv "$dest.part" "$dest"
  else
    echo ">> Ya existe $f"
  fi
  local actual esperado
  actual="$(sha "$dest")"
  esperado="$(grep -E "  $f\$" "$SUMS" | cut -d' ' -f1 || true)"
  if [ -z "$esperado" ]; then
    echo "$actual  $f" >> "$SUMS"
    echo "   PRIMERA DESCARGA: hash registrado en $SUMS"
    echo "   $actual"
    echo "   Compáralo con otra fuente si puedes y cópialo a .claude/SHA256SUMS."
  elif [ "$actual" = "$esperado" ]; then
    echo "   OK  SHA-256 coincide"
  else
    echo "   ERROR: SHA-256 NO coincide para $f" >&2
    echo "   esperado $esperado" >&2
    echo "   actual   $actual" >&2
    echo "   El archivo se ha renombrado a $f.SOSPECHOSO. No lo uses." >&2
    mv "$dest" "$dest.SOSPECHOSO"
    exit 2
  fi
}

if [ $# -gt 0 ]; then
  modelos=("$@")
else
  modelos=("${WHISPER_MODEL:-ggml-large-v3-turbo-q5_0.bin}")
fi
# El modelo VAD (Silero) siempre hace falta: el compose lo activa.
modelos+=("ggml-silero-v5.1.2.bin")

for m in "${modelos[@]}"; do descargar "$m"; done
echo
echo "Listo. Siguiente paso:  docker compose -f docker-compose.whisper.yml up -d"
