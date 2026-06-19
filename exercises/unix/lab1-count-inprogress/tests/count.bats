#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  cat > students.txt <<'EOF'
21001 14.03.2024 done 80
22002 14.03.2024 in_progress 45
21003 14.03.2024 in_progress 30
22004 16.03.2024 in_progress 50
23005 14.03.2024 done 90
EOF
}

@test "counts in_progress quizzes from 14.03.2024" {
  run bash -c "bash '$SCRIPT' < students.txt"
  [ "$status" -eq 0 ]
  [ "$(printf '%s' "$output" | tr -d '[:space:]')" = "2" ]
}
