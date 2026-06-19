#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  1) echo "one" ;;
  2) echo "two" ;;
  3) echo "three" ;;
  *)
    echo "error: argument must be 1, 2 or 3" >&2
    exit 1
    ;;
esac
