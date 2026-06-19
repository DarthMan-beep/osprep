#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  cat > psaux.txt <<'EOF'
USER  PID %CPU %MEM   VSZ  RSS TTY STAT START TIME COMMAND
root    1  0.0  0.1  1000  100 ?   Ss   10:00 0:01 init
alice   2  0.0  0.1  1000  100 ?   S    10:00 0:00 bash
alice   3  0.0  0.1  1000  100 ?   S    10:00 0:00 vim
bob     4  0.0  0.1  1000  100 ?   S    10:00 0:00 top
alice   5  0.0  0.1  1000  100 ?   S    10:00 0:00 less
bob     6  0.0  0.1  1000  100 ?   S    10:00 0:00 cat
EOF
}

@test "counts processes per user, sorted descending" {
  run bash -c "bash '$SCRIPT' < psaux.txt"
  [ "$status" -eq 0 ]
  # Compare user + count, ignoring exact column padding.
  normalized="$(printf '%s\n' "$output" | awk '{print $1, $2}')"
  expected=$'alice 3\nbob 2\nroot 1'
  [ "$normalized" = "$expected" ]
}
