#!/usr/bin/env bats
SCRIPT="/work/command.sh"

@test "hello_world.py becomes rw for owner and group only" {
  : > hello_world.py
  chmod 000 hello_world.py
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  [ "$(stat -c '%A' hello_world.py)" = "-rw-rw----" ]
}
