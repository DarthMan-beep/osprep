#!/usr/bin/env bats
SCRIPT="/work/process.sh"

@test "writes unique numbers in descending order" {
  printf '3\n1\n2\n3\n2\n10\n' > nums.txt
  run bash "$SCRIPT" nums.txt
  [ "$status" -eq 0 ]
  expected=$'10\n3\n2\n1'
  [ "$(cat result.txt)" = "$expected" ]
}

@test "single value" {
  printf '42\n' > one.txt
  run bash "$SCRIPT" one.txt
  [ "$status" -eq 0 ]
  [ "$(cat result.txt)" = "42" ]
}

@test "missing argument exits 1" {
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
}

@test "nonexistent file exits 1" {
  run bash "$SCRIPT" does-not-exist.txt
  [ "$status" -eq 1 ]
}
