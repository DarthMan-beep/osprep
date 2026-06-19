#!/usr/bin/env bats
SCRIPT="/work/command.sh"

@test "creates both directories and an empty file in the first" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [ -d directory1 ]
  [ -d directory2 ]
  [ -f directory1/file123 ]
  [ ! -s directory1/file123 ]   # file is empty
}
