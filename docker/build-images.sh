#!/usr/bin/env bash
# Builds all sandbox images. Run from anywhere; requires the Docker daemon.
set -euo pipefail
cd "$(dirname "$0")"

echo ">> building osprep-bash"
docker build -t osprep-bash:latest ./bash

# future:
# docker build -t osprep-docker:latest ./docker
# docker build -t osprep-java:latest  ./java

echo ">> done"
docker images | grep '^osprep' || true
