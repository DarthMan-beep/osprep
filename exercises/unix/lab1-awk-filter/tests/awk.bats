#!/usr/bin/env bats
SCRIPT="/work/command.sh"

setup() {
  cat > OS2.txt <<'EOF'
21001 14.03.2024 done 80
22002 15.03.2024 in_progress 45
21003 14.03.2024 done 30
22004 16.03.2024 done 50
23005 17.03.2024 in_progress 90
22006 15.03.2024 done 51
EOF
}

@test "selects 2022 students scoring <= 50 and prints index, date, points" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  expected=$'22002 15.03.2024 45\n22004 16.03.2024 50'
  [ "$output" = "$expected" ]
}
