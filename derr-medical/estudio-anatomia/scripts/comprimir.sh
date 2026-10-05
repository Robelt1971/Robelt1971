#!/usr/bin/env bash
# Comprime los GLB exportados por exportar_zanatomy.py con gltfpack (meshoptimizer) y los
# copia, junto con los JSON, a la carpeta del módulo (../modelos y ../data).
# Uso: ./comprimir.sh <carpeta_salida_del_export>
# Requiere: npx gltfpack@0.24.0 (Node 18+).
set -euo pipefail
ORIGEN="${1:?carpeta de salida del export}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
MODULO="$(dirname "$AQUI")"
mkdir -p "$MODULO/modelos" "$MODULO/data"
for f in "$ORIGEN"/glb/*.glb; do
  n="$(basename "$f")"
  # -cc: compresión meshopt alta; -kn/-km: conservar nombres de nodos y materiales (la app
  # identifica cada estructura por el nombre del nodo y colorea por el nombre del material);
  # -vpf: posiciones en coma flotante (las estructuras pequeñas pierden precisión con la cuantización).
  npx --yes gltfpack@0.24.0 -i "$f" -o "$MODULO/modelos/$n" -cc -kn -km -vpf
  echo "  $n -> $(du -h "$MODULO/modelos/$n" | cut -f1)"
done
cp "$ORIGEN/estructuras.json" "$ORIGEN/definiciones.json" "$MODULO/data/"
echo "Listo. Modelos en $MODULO/modelos, datos en $MODULO/data."
