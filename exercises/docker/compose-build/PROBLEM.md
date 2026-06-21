# Compose: build from a Dockerfile

In the last compose exercise the service used a ready-made image (`image: nginx:alpine`).
This time, Compose should **build the image itself** from a `Dockerfile`.

The build context (shown in *Provided files* below) contains a working **`Dockerfile`** and
a **`page.html`**. The Dockerfile starts a tiny web server on container port **8000**.

## Task

Write a **`compose.yaml`** with one service (any name) that:

- **builds** from the `Dockerfile` in the current directory (instead of using `image:`), and
- publishes container port **8000** on **host port 8087**.

The grader runs `docker compose up --build` and checks that
`http://localhost:8087/page.html` contains `built by compose`.

> **Hint:** to build instead of pull, replace `image:` with **`build:`**. The simplest form
> is `build: .` — the `.` means "use the Dockerfile in this directory as the build context."
> Everything else (`ports:`) is the same as before.
