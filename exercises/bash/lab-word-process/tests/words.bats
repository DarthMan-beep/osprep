#!/usr/bin/env bats
SCRIPT="/work/script.sh"

@test "processes qualifying files and writes correct out files and summary" {
  rm -rf source processed summary.txt
  mkdir source
  printf 'Error, warning, INFO.\nApple banana apple.\ncat-dog dog 123\n' > source/report1.txt
  printf 'Orange orange grape.\nkiwi; grape MELON.\n' > source/notes2.txt
  printf 'no digit in name so ignored\n' > source/alpha.txt
  printf 'others cannot read this one\n' > source/data3.txt
  chmod o+r source/report1.txt source/notes2.txt source/alpha.txt
  chmod o-r source/data3.txt

  run bash "$SCRIPT" source
  [ "$status" -eq 0 ]

  # report1 unique words, sorted
  [ "$(cat processed/report1.out)" = "$(printf 'apple\nbanana\ncat\ndog\nerror\ninfo\nwarning')" ]
  # notes2 unique words, sorted
  [ "$(cat processed/notes2.out)" = "$(printf 'grape\nkiwi\nmelon\norange')" ]
  # alpha (no digit) and data3 (no others-read) skipped
  [ ! -e processed/alpha.out ]
  [ ! -e processed/data3.out ]

  expected=$'processedFiles: 2\ntotalUniqueWords: 11\nfileWithMostUniqueWords: report1.txt\nmaxUniqueWords: 7'
  [ "$(cat summary.txt)" = "$expected" ]
}

@test "missing argument prints usage and exits 1" {
  run bash "$SCRIPT"
  [ "$status" -eq 1 ]
  [ "$output" = "Usage: ./script.sh <source_directory>" ]
}

@test "nonexistent directory prints error and exits 1" {
  run bash "$SCRIPT" no_such_dir_here
  [ "$status" -eq 1 ]
  [ "$output" = "Error: source directory does not exist" ]
}

@test "no qualifying files still creates processed and a zero summary" {
  rm -rf empty processed summary.txt
  mkdir empty
  printf 'ignored\n' > empty/plain.txt   # no digit in name
  chmod o+r empty/plain.txt

  run bash "$SCRIPT" empty
  [ "$status" -eq 0 ]
  [ -d processed ]
  expected=$'processedFiles: 0\ntotalUniqueWords: 0\nfileWithMostUniqueWords: none\nmaxUniqueWords: 0'
  [ "$(cat summary.txt)" = "$expected" ]
}
