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

@test "prints only the 2021 enrollees" {
  run bash "$SCRIPT"
  [ "$status" -eq 0 ]
  expected=$'21001 14.03.2024 done 80\n21003 14.03.2024 done 30'
  [ "$output" = "$expected" ]
}
