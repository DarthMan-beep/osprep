#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: greet.sh <name>" >&2
  exit 1
fi

echo "Hello, $1!"
