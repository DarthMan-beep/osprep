#!/usr/bin/env bash
awk 'NR > 1 {print $1}' | sort | uniq -c | sort -nr | awk '{printf "%-20s %s\n", $2, $1}'
