#!/bin/sh
# Prints the "product" field from data.json using jq.
jq -r '.product' /app/data.json
