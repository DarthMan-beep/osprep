#!/usr/bin/env bash
set -uo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: ./script.sh <source_directory>"
  exit 1
fi
src="$1"
if [ ! -d "$src" ]; then
  echo "Error: source directory does not exist"
  exit 1
fi

mkdir -p processed

processedFiles=0
totalUniqueWords=0
maxUniqueWords=0
fileWithMost="none"

for f in "$src"/*.txt; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  case "$name" in
    *[0-9]*) ;;
    *) continue ;;
  esac
  perms=$(stat -c '%A' "$f")
  [ "${perms:7:1}" = "r" ] || continue

  base=$(basename "$f" .txt)
  out="processed/${base}.out"
  tr -cs 'A-Za-z' '\n' < "$f" | tr 'A-Z' 'a-z' | grep -v '^$' | sort -u > "$out"

  uniq=$(wc -l < "$out")
  processedFiles=$((processedFiles + 1))
  totalUniqueWords=$((totalUniqueWords + uniq))
  if [ "$uniq" -gt "$maxUniqueWords" ]; then
    maxUniqueWords=$uniq
    fileWithMost=$name
  fi
done

{
  echo "processedFiles: $processedFiles"
  echo "totalUniqueWords: $totalUniqueWords"
  echo "fileWithMostUniqueWords: $fileWithMost"
  echo "maxUniqueWords: $maxUniqueWords"
} > summary.txt

cat summary.txt
