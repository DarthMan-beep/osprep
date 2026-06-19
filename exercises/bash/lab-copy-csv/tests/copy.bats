#!/usr/bin/env bats
SCRIPT="/work/script.sh"

@test "copies qualifying files and writes correct statistics" {
  rm -rf source copiedFiles statistics.txt
  mkdir source
  echo "a" > source/file1.csv
  echo "b" > source/file2.csv
  echo "c" > source/test.csv     # no digit -> skipped
  chmod o+r source/file1.csv source/file2.csv
  chmod o-r source/test.csv

  run bash "$SCRIPT" source
  [ "$status" -eq 0 ]

  [ -f copiedFiles/file1.csv ]
  [ -f copiedFiles/file2.csv ]
  [ ! -e copiedFiles/test.csv ]

  expected=$'copiedFiles: 2\ntotalSize: 4\ntotalNumberOfLines: 2\nlargestFile: 2\nlongestName: file1.csv'
  [ "$(cat statistics.txt)" = "$expected" ]
}

@test "skips .csv files without others-read permission" {
  rm -rf src2 copiedFiles statistics.txt
  mkdir src2
  echo "x" > src2/keep9.csv
  echo "y" > src2/secret7.csv
  chmod o+r src2/keep9.csv
  chmod o-r src2/secret7.csv

  run bash "$SCRIPT" src2
  [ "$status" -eq 0 ]
  [ -f copiedFiles/keep9.csv ]
  [ ! -e copiedFiles/secret7.csv ]
  [ "$(head -1 statistics.txt)" = "copiedFiles: 1" ]
}
