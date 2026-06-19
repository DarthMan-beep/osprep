#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "usage: process.sh <file>" >&2
  exit 1
fi

sort -rn "$1" | uniq > result.txt
