#!/usr/bin/env bats
SCRIPT="/work/classify_sizes.sh"

@test "categorizes regular files by size, sorted by name" {
  mkdir -p data
  : > data/a                       # 0 bytes
  head -c 50   /dev/zero > data/b
  head -c 500  /dev/zero > data/c
  head -c 2000 /dev/zero > data/e
  run bash "$SCRIPT" data
  [ "$status" -eq 0 ]
  expected=$'a empty\nb small\nc medium\ne large'
  [ "$output" = "$expected" ]
}

@test "size boundaries: 100->small, 101->medium, 1000->medium, 1001->large" {
  mkdir -p bnd
  head -c 100  /dev/zero > bnd/w
  head -c 101  /dev/zero > bnd/x
  head -c 1000 /dev/zero > bnd/y
  head -c 1001 /dev/zero > bnd/z
  run bash "$SCRIPT" bnd
  [ "$status" -eq 0 ]
  expected=$'w small\nx medium\ny medium\nz large'
  [ "$output" = "$expected" ]
}

@test "ignores subdirectories" {
  mkdir -p tree/sub
  head -c 10 /dev/zero > tree/file
  run bash "$SCRIPT" tree
  [ "$status" -eq 0 ]
  [ "$output" = "file small" ]
}

@test "missing argument exits 1" {
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
}

@test "non-directory argument exits 1" {
  head -c 5 /dev/zero > plainfile
  run bash "$SCRIPT" plainfile
  [ "$status" -eq 1 ]
}
