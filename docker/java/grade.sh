#!/usr/bin/env bash
# Grades a Java submission. Invoked as: grade [TestClass]
# /work contains the student's .java files + a test driver (default OSPrepTest.java).
# Compiles everything, runs the test class (bounded by `timeout` to catch deadlocks),
# and emits marker-delimited sections the host parses. The driver prints TAP lines.
set -uo pipefail

TEST_CLASS="${1:-OSPrepTest}"
cd /work || { echo "no /work"; exit 99; }

COMPILE_OUT="$(javac ./*.java 2>&1)"
COMPILE_CODE=$?

TAP_OUT=""
TAP_CODE=0
if [ "$COMPILE_CODE" -eq 0 ]; then
  # 30s hard cap: a deadlocked submission is killed and reported as a timeout.
  TAP_OUT="$(timeout 30 java "$TEST_CLASS" 2>&1)"
  TAP_CODE=$?
fi

echo "===OSPREP-COMPILE-CODE==="
echo "$COMPILE_CODE"
echo "===OSPREP-COMPILE-OUT==="
echo "$COMPILE_OUT"
echo "===OSPREP-TAP-CODE==="
echo "$TAP_CODE"
echo "===OSPREP-TAP==="
echo "$TAP_OUT"
echo "===OSPREP-END==="
