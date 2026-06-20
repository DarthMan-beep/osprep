---
title: Docker
topic: docker
order: 4
summary: Images vs containers, layers, the Dockerfile instructions, ports, volumes, env vars, and Compose.
---

# Docker

## Why Docker exists

You write a program, it runs perfectly on your laptop, you hand it to a colleague (or
deploy it to a server) and it breaks. The Python version is different, a system library is
missing, an environment variable is unset, the database is configured another way. This is
the **"works on my machine"** problem: your program does not run in isolation — it depends
on a whole environment around it, and that environment differs from machine to machine.

Docker's answer is the **container**: a way to package an application *together with*
everything it needs to run — the runtime, the libraries, the system tools, the config —
into one self-contained unit. That unit runs the same way on any machine that has Docker,
because the machine no longer supplies the environment; the container brings its own.

The mental model: instead of shipping *instructions* for how to set up the environment
("install Java 17, then..."), you ship the environment itself, already set up.

## Virtual machines vs containers

The obvious older way to get a reproducible environment is a **virtual machine (VM)**: run
a full guest operating system on top of your real one. That works, but it is heavy — every
VM carries an entire OS (its own kernel, its own boot process, gigabytes of disk).

A **container** is lighter. It does **not** boot its own kernel. Instead, all containers on
a host **share the host's kernel** and are isolated from each other using kernel features
(namespaces for "what you can see," cgroups for "how much you can use"). This is called
**OS-level virtualization**. A container packages only the application and its user-space
dependencies — not a whole operating system.

| | Virtual machine | Container |
|---|---|---|
| Virtualizes | Hardware (full guest OS) | The OS (shares host kernel) |
| Contains | Whole OS + app | Just app + its dependencies |
| Size | Gigabytes | Megabytes |
| Startup | Seconds to minutes (boots an OS) | Milliseconds to seconds |
| Isolation | Strong (separate kernel) | Lighter (shared kernel) |
| Overhead | Heavy | Light |

The trade-off: VMs give stronger isolation (a separate kernel) at a high cost; containers
give *good enough* isolation for most apps, far more cheaply, so you can run many more of
them on the same hardware.

> **Gotcha:** because containers share the host kernel, a Linux container needs a Linux
> kernel. On Windows and macOS, Docker Desktop quietly runs a tiny Linux VM in the
> background and starts your containers inside it. So "containers don't use a VM" is true on
> a Linux host, but on Windows/macOS there is one shared lightweight VM underneath.

## Image vs container

This is the single most important distinction in Docker.

- An **image** is a **read-only template**: a frozen, packaged filesystem plus metadata
  (which command to run, which ports, which env vars). It is built once and never changes.
- A **container** is a **running (or stopped) instance** of an image — an image that has
  been given a writable layer and a process.

The class/object analogy is exact:

| Programming | Docker |
|---|---|
| Class (blueprint) | **Image** |
| Object (instance) | **Container** |
| `new Foo()` | `docker run foo` |

One image can spawn **many** containers, just as one class can have many objects. Each
container gets its own writable layer, so they don't interfere with each other.

### Container lifecycle

A container moves through states:

```text
docker run   ──► created ──► running ──► (stopped/exited) ──► removed
                              ▲   │
                  docker start│   │docker stop
                              └───┘
```

- **created** — exists but not started (rare; `docker create`).
- **running** — its main process is alive.
- **stopped / exited** — the process ended (it finished, crashed, or you ran `docker stop`).
  A stopped container still exists and can be restarted with `docker start`.
- **removed** — deleted with `docker rm`; its writable layer is gone for good.

> **Gotcha:** stopping a container is not the same as removing it. `docker ps` shows only
> *running* containers; stopped ones are still there (and still using disk) — use
> `docker ps -a` to see them. They pile up until you `docker rm` them (or run with `--rm`).

## Layers and the build cache

An image is not one blob — it is a **stack of layers**. **Each instruction in a Dockerfile
creates one layer** on top of the previous ones. A layer records the filesystem changes
that instruction made.

Two consequences matter a lot:

**1. Layers are cached and reused.** When you rebuild, Docker walks the Dockerfile top to
bottom. For each instruction, if nothing it depends on has changed, Docker reuses the
**cached** layer instead of redoing the work. The first instruction whose inputs changed —
and **everything after it** — must be rebuilt.

This drives a key ordering rule: **put stable, slow steps before frequently-changing
steps.** Dependencies change rarely; your application code changes constantly. So copy and
install dependencies *first*, then copy your source code *last*:

```dockerfile
# GOOD: deps cached separately from source
COPY package.json package-lock.json ./
RUN npm install          # this slow layer is reused while deps are unchanged
COPY . .                 # only this cheap layer rebuilds when you edit code
```

```dockerfile
# BAD: any code edit invalidates the install
COPY . .
RUN npm install          # re-runs on every single code change — slow
```

In the bad version, editing one line of source changes the `COPY . .` layer, which forces
`RUN npm install` to run again every time.

**2. The writable container layer is ephemeral.** Image layers are read-only. When you run
a container, Docker adds one thin **writable layer** on top. Anything the container writes
(logs, uploaded files, database rows) lives only in that layer — and it is **deleted when
the container is removed.** To keep data, you must store it outside the container, in a
**volume** (see below).

## The docker CLI

The command line is how you build images and run containers. The essentials:

| Command | What it does |
|---|---|
| `docker build -t name:tag .` | Build an image from the Dockerfile in `.`, tag it `name:tag` |
| `docker run [opts] image` | Create + start a container from an image |
| `docker ps` | List **running** containers |
| `docker ps -a` | List **all** containers (incl. stopped) |
| `docker images` | List local images |
| `docker logs <container>` | Show a container's stdout/stderr (`-f` to follow) |
| `docker exec -it <c> sh` | Run a command (here, a shell) **inside** a running container |
| `docker stop <container>` | Gracefully stop a running container |
| `docker rm <container>` | Remove a stopped container |
| `docker rmi <image>` | Remove an image |
| `docker pull <image>` | Download an image from a registry (e.g. Docker Hub) |
| `docker push <image>` | Upload an image to a registry |
| `docker network create <n>` | Create a user-defined network |
| `docker network ls` | List networks |

The important `docker run` flags:

| Flag | Meaning |
|---|---|
| `-d` | **Detached** — run in the background, return the prompt |
| `-p HOST:CONTAINER` | Publish a port (map host port to container port) |
| `-v SRC:DST` | Mount a volume or bind mount at `DST` inside the container |
| `-e KEY=value` | Set an environment variable |
| `--name myapp` | Give the container a stable name (else Docker invents one) |
| `--rm` | Auto-remove the container when it exits (no leftover) |
| `-it` | Interactive + TTY — attach a terminal (for shells, REPLs) |
| `--network <n>` | Attach the container to a named network |

Example invocations:

```console
$ docker build -t webapp:1.0 .
$ docker run -d --name web -p 8080:80 webapp:1.0
$ docker ps
$ docker logs -f web
$ docker exec -it web sh
$ docker stop web && docker rm web
$ docker run --rm -it ubuntu:24.04 bash      # throwaway interactive shell
```

> **Gotcha:** `docker run` always makes a **new** container. If you keep running it you
> accumulate containers. To re-enter an existing one, use `docker start` + `docker exec`,
> not another `docker run`.

## The Dockerfile

A **Dockerfile** is a text recipe for building an image. Docker reads it top to bottom,
running each instruction and committing a layer.

### Core instructions

| Instruction | When | Purpose |
|---|---|---|
| `FROM` | build | The base image to start from (every Dockerfile begins here) |
| `WORKDIR` | build | Set the working directory for later instructions |
| `COPY` | build | Copy files from the build context into the image |
| `ADD` | build | Like COPY, plus URL download and auto-extracting tar archives |
| `RUN` | build | Execute a command **while building** the image (creates a layer) |
| `ENV` | build | Set a default environment variable baked into the image |
| `ARG` | build | A build-time variable (passed with `--build-arg`, not in the final image) |
| `EXPOSE` | build | **Document** which port the app listens on (does not publish it) |
| `CMD` | run | Default command run when a container **starts** |
| `ENTRYPOINT` | run | The fixed executable the container runs; `CMD` supplies its args |

### RUN vs CMD — build time vs run time

This is the classic confusion. They run at completely different moments:

- **`RUN`** executes **during `docker build`**, to *prepare the image* (install packages,
  compile code). Its effect is baked into a layer. You can have many `RUN`s.
- **`CMD`** does **nothing at build time**. It only sets the **default command executed
  when a container starts**. There is effectively one `CMD` (the last wins).

```dockerfile
RUN apt-get update && apt-get install -y python3   # happens while BUILDING
CMD ["python3", "app.py"]                           # happens when you RUN the container
```

> **Gotcha:** `CMD` can be overridden at run time — anything after the image name on
> `docker run` replaces it (`docker run myimg echo hi` runs `echo hi`, not the `CMD`).

### CMD vs ENTRYPOINT

Both define what runs at start, but they combine:

- **`ENTRYPOINT`** is the fixed executable — "this image *is* this program."
- **`CMD`** provides the default **arguments** to that executable (and, if `ENTRYPOINT` is
  absent, it is the whole command).

```dockerfile
ENTRYPOINT ["ping"]
CMD ["localhost"]
```

`docker run myimg` runs `ping localhost`; `docker run myimg example.com` runs
`ping example.com` (the run-time arg replaces `CMD`, but `ENTRYPOINT` stays). Use
`ENTRYPOINT` when the container should always be one specific tool; use `CMD` alone when you
want an easily-overridable default command.

Prefer the **exec form** (`["prog", "arg"]`, a JSON array) over the **shell form**
(`prog arg`). The exec form runs your program directly as PID 1, so it receives signals like
`docker stop` correctly; the shell form wraps it in `/bin/sh -c`, which can swallow signals.

### A full worked Dockerfile

A small C program compiled at build time, then run when the container starts:

```dockerfile
# 1. base image with a C compiler
FROM gcc:14

# 2. all later paths are relative to /app
WORKDIR /app

# 3. copy source into the image (build context -> image)
COPY hello.c .

# 4. compile AT BUILD TIME -> produces /app/hello, baked into a layer
RUN gcc -O2 -o hello hello.c

# 5. document the intent (purely informational here)
EXPOSE 8080

# 6. what to run WHEN A CONTAINER STARTS
CMD ["./hello"]
```

Build and run it:

```console
$ docker build -t hello:1.0 .
$ docker run --rm hello:1.0
Hello from inside a container!
```

`gcc` runs once, during the build (step 4). `./hello` runs each time you start a container
(step 6).

## Publishing ports

A container has its own network namespace. A server listening on port 80 *inside* the
container is **not** reachable from your host until you **publish** the port:

```console
$ docker run -d -p 8080:80 nginx
                  │    └── port INSIDE the container
                  └─────── port ON THE HOST
```

Now `http://localhost:8080` on your machine reaches port 80 in the container. The mapping is
`-p HOST:CONTAINER` — left is the host, right is the container.

`EXPOSE 80` in the Dockerfile **only documents** that the app uses port 80. It does **not**
open anything to the host. You still need `-p` at run time to actually reach the service.

> **Gotcha:** the two numbers are often confused. `-p 3000:80` means "host 3000 → container
> 80," so you browse to `localhost:3000` even though the app inside listens on 80. They do
> not need to match.

## Volumes — keeping data alive

Recall that the container's writable layer is deleted on `docker rm`. To **persist** data
(or share files with the host), mount storage that lives outside that layer. Two kinds:

**Named volume** — Docker manages the storage; you refer to it by name. Best for data you
want to *keep* but don't need to browse directly (databases, app state):

```console
$ docker volume create dbdata
$ docker run -d -v dbdata:/var/lib/postgresql/data postgres
```

The data survives `docker rm` and can be reattached to a new container.

**Bind mount** — map a specific **host directory** into the container. Best for *developing*
(edit files on the host, see changes inside) and for feeding config/content in:

```console
$ docker run -d -p 8080:80 -v ./site:/usr/share/nginx/html:ro nginx
                              │      │                        └ read-only
                              │      └ path inside container
                              └ path on host (current dir / site)
```

| | Named volume | Bind mount |
|---|---|---|
| Source | Managed by Docker | A path on your host |
| Use for | Persistent app data (DBs) | Dev source, config, static files |
| Portable | Yes | No (tied to host paths) |
| You can edit on host | Not easily | Yes, directly |

Append **`:ro`** to mount read-only, so the container cannot modify the source — useful when
you mount config or content the app should only read.

> **Gotcha:** mounting *over* a directory that already had files in the image hides the
> image's files at that path — the mount takes precedence. An empty host folder bind-mounted
> onto `/app` makes `/app` appear empty inside the container.

## Environment variables

Environment variables are the standard way to configure a container without rebuilding it
(ports, modes, credentials, connection strings).

- **At run time:** `-e KEY=value` on `docker run` (highest priority).
- **As a default in the image:** `ENV KEY=value` in the Dockerfile.

```dockerfile
ENV PORT=8080
ENV MODE=production
```

```console
$ docker run -e PORT=9090 -e MODE=debug myapp   # overrides the ENV defaults
```

The application reads them the normal way for its language — e.g. `System.getenv("PORT")`
in Java, `os.environ["PORT"]` in Python, `process.env.PORT` in Node. The container does not
know or care how they were set; it just sees environment variables.

> **Gotcha:** `ENV` values are **baked into the image layers** — never put secrets (API
> keys, passwords) in a Dockerfile. Pass them at run time with `-e`, an `--env-file`, or a
> secrets mechanism, so they don't end up shipped inside the image.

## Docker Compose

Real applications are rarely a single container — a web app needs a database, maybe a cache,
maybe a worker. Starting each one by hand with the right `-p`, `-v`, `-e`, `--network` flags,
in the right order, is tedious and error-prone.

**Docker Compose** solves this: you describe *all* your services in **one YAML file**
(`compose.yaml`) and bring the whole stack up or down with **one command**. Compose also
creates a shared network automatically so the services can talk to each other.

A worked example — a web service that talks to a Postgres database:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    environment:
      - DB_HOST=db          # reach the database by its SERVICE NAME
      - DB_PASSWORD=secret
    depends_on:
      - db
    networks:
      - appnet

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - dbdata:/var/lib/postgresql/data    # named volume, persists
    networks:
      - appnet

volumes:
  dbdata:

networks:
  appnet:
```

The key keys:

| Key | Meaning |
|---|---|
| `services` | The containers that make up the app (one block each) |
| `image` | Use a prebuilt image from a registry |
| `build` | Build from a Dockerfile instead (`context` = dir, `dockerfile` = file) |
| `ports` | Publish ports, same `HOST:CONTAINER` as `-p` |
| `volumes` | Mount named volumes or bind mounts, same as `-v` |
| `environment` | Set env vars, same as `-e` |
| `depends_on` | Start order — start `db` before `web` |
| `networks` | Which networks the service joins |

### Service-name DNS

The most useful Compose feature: services on the same network reach each other **by service
name**. In the example, the `web` container connects to the database at host **`db`** — the
service name — not at an IP address. Compose runs a small DNS server that resolves each
service name to that container's address. This is why the `DB_HOST=db` env var above just
works.

Bring the stack up and down:

```console
$ docker compose up -d --build    # build images, start everything in the background
$ docker compose ps               # see the running services
$ docker compose logs -f web      # tail one service's logs
$ docker compose down             # stop and remove containers + network
```

`--build` forces a rebuild of services that have a `build:` section; `-d` runs detached.
`down` tears everything down (add `-v` to also delete named volumes).

> **Gotcha:** `depends_on` only controls **start order**, not readiness. `web` may start
> before Postgres is actually *accepting connections*. For real readiness use a healthcheck
> (`depends_on: { db: { condition: service_healthy } }`) or have the app retry its
> connection.

## Practice

Tie the concepts above to the app's docker exercises:

- **Your first Dockerfile** — write a minimal `FROM` + `CMD` Dockerfile, `build -t` it, and
  `run` it; observe an image producing a container.
- **Serve a file over HTTP** — run a web server container and publish its port with
  `-p HOST:CONTAINER` so you can reach it from the host.
- **Configure a container with ENV** — set a default with `ENV` and override it at run time
  with `-e`, and read it from the running app.
- **Docker Compose: serve a folder with nginx** — write a `compose.yaml` that bind-mounts a
  local folder into an nginx service and publishes its port, then `docker compose up -d`.
