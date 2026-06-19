#!/usr/bin/env bash
awk '$1 ~ /^22/ && $4 <= 50 {print $1, $2, $4}' OS2.txt
