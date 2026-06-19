#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  cat > OS1.txt <<'EOF'
21001 14.03.2024 done 80
22002 15.03.2024 in_progress 45
EOF
  cat > OS2.txt <<'EOF'
21003 14.03.2024 done 30
22004 16.03.2024 in_progress 50
EOF
}

@test "prints index and quiz status from both files in order" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  expected=$'21001 done\n22002 in_progress\n21003 done\n22004 in_progress'
  [ "$output" = "$expected" ]
}
