#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  printf 'alpha\nbeta\n' > OS1.txt
  printf 'gamma\ndelta\n' > OS2.txt
}

@test "prints OS1.txt then OS2.txt" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  expected=$'alpha\nbeta\ngamma\ndelta'
  [ "$output" = "$expected" ]
}
