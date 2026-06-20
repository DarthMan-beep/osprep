# OSPrep — Operating Systems practical exam trainer

A self-hosted study app for the FINKI **Operating Systems practical exam**. Read the
study guides, then solve exercises in a **real sandbox**: you write code in the browser,
click **Run & Grade**, and it executes inside a throwaway Docker container and is checked
against automated tests. Available in **English and Macedonian** (toggle top-right).

Covers all four practical-exam topics: **Unix commands**, **Bash scripting**,
**Synchronization** (Java threads), and **Docker** (Dockerfile + Compose).

---

## Quick start

### Prerequisites

- **Node.js 20+** and npm — <https://nodejs.org>
- **Docker Desktop**, installed **and running** — <https://www.docker.com/products/docker-desktop/>
  (on Windows, enable the WSL2 backend). The grader needs Docker to run your code.
- **git**

### Steps

```bash
# 1. clone
git clone <REPO_URL>
cd osprep

# 2. install dependencies
npm install

# 3. start Docker Desktop (make sure it is running), then build the sandbox image
#    Linux/macOS/Git-Bash/WSL:
bash docker/build-images.sh
#    or directly (any OS):
docker build -t osprep-bash:latest ./docker/bash

# 4. run the app
npm run dev
```

Open **<http://localhost:3000>**. Pick an exercise, write your solution, and press
**▶ Run & Grade**. Use the **EN / MK** switch in the top-right to change language.

> If grading shows *"Image osprep-bash:latest not found"* you skipped step 3, and
> *"Docker daemon is not reachable"* means Docker Desktop isn't running.

---

## How it works

```
Browser (Monaco editor)
   │  POST /api/run { id, files }
   ▼
Next.js route handler  ──►  Docker executor (dockerode)
                                 │  copy your files into an ephemeral container
                                 │  run the pinned sandbox image (no network, capped RAM)
                                 │  capture output, parse, score
                                 ▼
                            graded result  ──►  results panel
```

- **Bash/Unix** exercises are checked with **`shellcheck`** (lint/syntax) + **`bats`**
  (behavioural tests). Both must pass for a green result.
- Reference solutions and tests live **server-side only** — they're never sent to the
  browser.

## Your progress is local and private

Solved status and your saved code live in **`userdata/progress.json`**, which is
**git-ignored**. It is **per-machine** and never committed — so when you clone this repo
you start with a clean slate (0 solved), and your work is never pushed back. The **reset**
button on an exercise wipes its saved code and solved status.

## Project layout

```
src/
  app/            # pages (home, /exercise/[...id], /guide/[slug]) + API routes
  components/     # Workbench (editor), ResultsPanel, LocaleToggle
  lib/            # exercises, guides, progress, docker executor, i18n
exercises/<topic>/<slug>/
  manifest.yaml   # id, title, difficulty, points, entrypoint, tags (+ *_mk, lint knobs)
  PROBLEM.md      # problem statement (+ PROBLEM.mk.md for Macedonian)
  starter/        # files you start with
  solution/       # reference answer (server-only)
  tests/          # bats checker
content/guides/   # study guides (<slug>.md + <slug>.mk.md)
docker/bash/      # the osprep-bash sandbox image (alpine + bash + shellcheck + bats)
```

## Adding a bash exercise

1. Create `exercises/<topic>/<slug>/` with `manifest.yaml`, `PROBLEM.md`, `starter/`,
   `solution/`, and `tests/*.bats`.
2. It appears on the home page automatically.

> **bats tip:** test bodies run with errexit-like behaviour — `var=$(cmd-that-exits-nonzero)`
> fails the test; use `run` or append `|| true` when a non-zero exit is expected.

## Grading per topic

- **Bash / Unix** → `osprep-bash` sandbox: `shellcheck` + `bats`.
- **Synchronization (Java)** → `osprep-java` sandbox: compile + a stress/timeout test driver
  (lost-update and deadlock detection).
- **Docker** → builds the student's Dockerfile/compose on the **host** daemon and asserts
  (stdout, HTTP on a published port, compose up). No extra image — uses Docker itself.

## Roadmap

- [ ] Timed exam simulator (multi-topic, scoring, review)
- [ ] More multi-service Compose exercises
