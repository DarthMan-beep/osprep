# Compose: just an image and a port

Docker **Compose** describes one or more containers in a single file, `compose.yaml`, so
you can start everything with one command (`docker compose up`). Let's start with the
absolute minimum: **one service, a prebuilt image, and a published port.**

## Task

Write a **`compose.yaml`** with a single service named **`web`** that:

- runs the image **`nginx:alpine`**, and
- publishes the container's port **80** on **host port 8086**.

No build, no volumes, no environment — just those two settings. The grader runs
`docker compose up` and checks that `http://localhost:8086/` returns nginx's welcome page.

## The shape of a compose file

```yaml
services:          # top-level: a map of service names
  <name>:          # one service
    image: ...     # which image to run
    ports:
      - "HOST:CONTAINER"
```

> **Hint:** `ports` is a **list** (note the `-`), and each entry is a quoted
> `"host:container"` string — here, host `8086` mapped to container `80`. This is the
> compose equivalent of `docker run -p 8086:80 nginx:alpine`.
