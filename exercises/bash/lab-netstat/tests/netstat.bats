#!/usr/bin/env bats
SCRIPT="/work/script.sh"

# Compare user+count pairs, ignoring exact column padding.
norm() { printf '%s\n' "$1" | awk '{print $1, $2}'; }

@test "distinct counts, sorted descending" {
  cat > in.txt <<'EOF'
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 192.168.1.10:8080       0.0.0.0:*               LISTEN
tcp        0      0 192.168.1.10:22         0.0.0.0:*               LISTEN
tcp        0      0 10.0.0.5:3306           0.0.0.0:*               LISTEN
tcp        0      0 10.0.0.5:33060          0.0.0.0:*               LISTEN
tcp        0      0 10.0.0.5:443            0.0.0.0:*               LISTEN
tcp6       0      0 :::443                  :::*                    LISTEN
EOF
  run bash -c "bash '$SCRIPT' < in.txt"
  [ "$status" -eq 0 ]
  [ "$(norm "$output")" = "$(printf '10.0.0.5 3\n192.168.1.10 2\n::: 1')" ]
}

@test "tie on count breaks ascending by IP; ::: preserved" {
  cat > in.txt <<'EOF'
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:111             0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp6       0      0 :::111                  :::*                    LISTEN
tcp6       0      0 :::22                   :::*                    LISTEN
tcp6       0      0 :::80                   :::*                    LISTEN
EOF
  run bash -c "bash '$SCRIPT' < in.txt"
  [ "$status" -eq 0 ]
  [ "$(norm "$output")" = "$(printf '::: 3\n0.0.0.0 2\n127.0.0.1 2')" ]
}
