#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  mkdir -p directory1 directory2
  : > directory1/file123
}

@test "moves and renames the file" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [ ! -e directory1/file123 ]
  [ -f directory2/file456 ]
}
