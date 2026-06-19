#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  cat > OS2.txt <<'EOF'
21001 14.03.2024 done 80
22002 15.03.2024 in_progress 45
21003 14.03.2024 done 30
EOF
}

@test "reports correct line, word and char counts and filename" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  got="$(printf '%s\n' "$output" | awk '{print $1, $2, $3, $4}')"
  want="$(wc OS2.txt | awk '{print $1, $2, $3, $4}')"
  [ "$got" = "$want" ]
}
