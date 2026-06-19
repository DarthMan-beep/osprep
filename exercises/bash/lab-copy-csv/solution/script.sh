#!/usr/bin/env bash
set -uo pipefail

src="${1:-}"
mkdir -p copiedFiles

count=0
totalSize=0
totalLines=0
maxSize=0
maxName=""

for f in "$src"/*.csv; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  case "$name" in
    *[0-9]*) ;;
    *) continue ;;
  esac
  perms=$(stat -c '%A' "$f")
  [ "${perms:7:1}" = "r" ] || continue

  cp "$f" copiedFiles/
  size=$(stat -c%s "$f")
  lines=$(wc -l < "$f")
  count=$((count + 1))
  totalSize=$((totalSize + size))
  totalLines=$((totalLines + lines))
  if [ "$size" -gt "$maxSize" ]; then
    maxSize=$size
    maxName=$name
  fi
done

{
  echo "copiedFiles: $count"
  echo "totalSize: $totalSize"
  echo "totalNumberOfLines: $totalLines"
  echo "largestFile: $maxSize"
  echo "longestName: $maxName"
} > statistics.txt

cat statistics.txt
