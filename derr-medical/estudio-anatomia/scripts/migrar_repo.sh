#!/usr/bin/env bash
# Traslada el módulo a un repositorio propio conservando su historial de commits.
# Decisión y motivos: docs/DERR-Medical-Modulo-Estudio-Anatomia.md (§3, "Dónde viven los binarios").
#
# Requisitos: el repositorio destino ya creado en GitHub (vacío, sin README) y permiso de push;
#             git-filter-repo (pip install git-filter-repo) y Python 3.
# Uso:        scripts/migrar_repo.sh <url-del-repo-destino> [carpeta-temporal]
# Qué hace:   clona este repositorio en una carpeta temporal, se queda solo con el historial de
#             derr-medical/estudio-anatomia/ (movido a la raíz) y de la spec docs/DERR-Medical-Modulo-
#             Estudio-Anatomia.md (que pasa a docs/ del nuevo repo), y lo empuja a `main` del destino.
#             No toca este repositorio: quitar aquí el módulo y dejar el enlace es un PR aparte.
set -euo pipefail
DESTINO="${1:?url del repositorio destino, p. ej. https://github.com/Robelt1971/DERR-Medical-Anatomia.git}"
TMP="${2:-$(mktemp -d)}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
ORIGEN="$(git -C "$AQUI" rev-parse --show-toplevel)"
MODULO="derr-medical/estudio-anatomia"
SPEC="docs/DERR-Medical-Modulo-Estudio-Anatomia.md"
command -v git-filter-repo >/dev/null || { echo "falta git-filter-repo: pip install git-filter-repo"; exit 1; }

echo "== clonando $ORIGEN en $TMP/modulo"
git clone -q --no-local "$ORIGEN" "$TMP/modulo"
cd "$TMP/modulo"
echo "== filtrando historial: $MODULO -> / y $SPEC -> docs/"
git filter-repo --force \
  --path "$MODULO/" --path "$SPEC" \
  --path-rename "$MODULO/:" \
  --path-rename "$SPEC:docs/DERR-Medical-Modulo-Estudio-Anatomia.md"
# El .gitattributes del módulo (GLB como binarios) ya queda en la raíz tras el rename.
echo "== commits conservados: $(git rev-list --count HEAD) · tamaño: $(du -sh .git | cut -f1)"
git branch -M main
git remote add origin "$DESTINO"
echo "== empujando a $DESTINO (main)"
git push -u origin main
echo "Listo. Siguiente: PR en el repositorio de perfil que quite $MODULO y apunte el README al nuevo repositorio."
