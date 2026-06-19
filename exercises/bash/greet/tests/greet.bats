#!/usr/bin/env bats
# Tests for greet.sh. The student's script lives at /work/greet.sh.

SCRIPT="/work/greet.sh"

setup() {
  chmod +x "$SCRIPT" 2>/dev/null || true
}

@test "greets a single named user on stdout" {
  run bash "$SCRIPT" World
  [ "$status" -eq 0 ]
  [ "$output" = "Hello, World!" ]
}

@test "works with a different name" {
  run bash "$SCRIPT" Ana
  [ "$status" -eq 0 ]
  [ "$output" = "Hello, Ana!" ]
}

@test "no arguments: exits 1" {
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
}

@test "no arguments: prints usage to stderr, nothing to stdout" {
  # Capture stdout and stderr separately. The `|| true` keeps the assignment's
  # exit status 0 — the script exits 1 here, and bats would otherwise treat the
  # non-zero assignment as a test failure.
  stdout="$(bash "$SCRIPT" 2>/dev/null || true)"
  stderr="$(bash "$SCRIPT" 2>&1 >/dev/null || true)"
  [ -z "$stdout" ]
  [ "$stderr" = "usage: greet.sh <name>" ]
}
