#!/usr/bin/env bats
SCRIPT="/work/classify.sh"

@test "1 -> one" {
  run bash "$SCRIPT" 1
  [ "$status" -eq 0 ]
  [ "$output" = "one" ]
}

@test "2 -> two" {
  run bash "$SCRIPT" 2
  [ "$status" -eq 0 ]
  [ "$output" = "two" ]
}

@test "3 -> three" {
  run bash "$SCRIPT" 3
  [ "$status" -eq 0 ]
  [ "$output" = "three" ]
}

@test "invalid value exits 1" {
  run bash "$SCRIPT" 9
  [ "$status" -eq 1 ]
}

@test "no argument exits 1" {
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
}

@test "error message goes to stderr, not stdout" {
  stdout="$(bash "$SCRIPT" 9 2>/dev/null || true)"
  stderr="$(bash "$SCRIPT" 9 2>&1 >/dev/null || true)"
  [ -z "$stdout" ]
  [ "$stderr" = "error: argument must be 1, 2 or 3" ]
}
