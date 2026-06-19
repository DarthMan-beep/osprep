#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ] || [ ! -d "$1" ]; then
  echo "usage: classify_sizes.sh <dir>" >&2
  exit 1
fi

for file in "$1"/*; do
  [ -f "$file" ] || continue
  size=$(stat -c%s "$file")
  if [ "$size" -eq 0 ]; then
    category=empty
  elif [ "$size" -le 100 ]; then
    category=small
  elif [ "$size" -le 1000 ]; then
    category=medium
  else
    category=large
  fi
  echo "$(basename "$file") $category"
done | sort
