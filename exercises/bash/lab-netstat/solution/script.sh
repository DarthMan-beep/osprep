#!/usr/bin/env bash
awk '/^tcp/ {
  ip = $4
  sub(/[0-9]+$/, "", ip)            # drop the port digits
  if (ip ~ /[^:]:$/) sub(/:$/, "", ip)   # drop the colon before the port, keep :::
  count[ip]++
}
END {
  for (ip in count) printf "%s %s\n", count[ip], ip
}' | sort -k1,1nr -k2,2 | awk '{printf "%-20s %s\n", $2, $1}'
