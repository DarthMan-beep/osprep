#!/usr/bin/env bash
# Grades one Bash submission. Invoked as: grade <entrypoint-filename>
# Expects /work to contain the student's <entrypoint> and a tests/ directory.
# Emits a single JSON object between the OSPREP-RESULT markers on stdout.
set -uo pipefail

ENTRY="${1:?usage: grade <entrypoint> [severity] [exclude]}"
SEVERITY="${2:-style}"   # shellcheck minimum severity that counts (style = all)
EXCLUDE="${3:-}"         # comma-separated shellcheck codes to ignore (e.g. SC2018)
cd /work || { echo "no /work"; exit 99; }

chmod +x "$ENTRY" 2>/dev/null || true

# --- shellcheck (syntax / lint) -------------------------------------------
if [[ -f "$ENTRY" ]]; then
  if [[ -n "$EXCLUDE" ]]; then
    SC_OUT="$(shellcheck -S "$SEVERITY" -e "$EXCLUDE" -f gcc "$ENTRY" 2>&1)"
  else
    SC_OUT="$(shellcheck -S "$SEVERITY" -f gcc "$ENTRY" 2>&1)"
  fi
  SC_CODE=$?
else
  SC_OUT="entrypoint '$ENTRY' not found"
  SC_CODE=127
fi

# --- bats (behavior), TAP so the host can parse per-test results ----------
if [[ -d tests ]]; then
  BATS_OUT="$(bats --tap tests 2>&1)"
  BATS_CODE=$?
else
  BATS_OUT="no tests directory"
  BATS_CODE=2
fi

# --- emit structured result -----------------------------------------------
echo "===OSPREP-RESULT-START==="
jq -nM \
  --argjson sc_code "$SC_CODE" \
  --arg     sc_out  "$SC_OUT" \
  --argjson bats_code "$BATS_CODE" \
  --arg     bats_out  "$BATS_OUT" \
  '{shellcheck: {code: $sc_code, output: $sc_out},
    bats:       {code: $bats_code, tap: $bats_out}}'
echo "===OSPREP-RESULT-END==="
