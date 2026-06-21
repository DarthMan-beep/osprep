# RUN at build, CMD at run

This one is about the two instructions people mix up most:

- **`RUN`** executes a command **while the image is being built** — its result is baked
  into the image as a layer.
- **`CMD`** sets the command that runs **when a container starts** from the image.

## Task

Write a **`Dockerfile`** that:

1. **During the build**, create a file `/status.txt` containing the word `READY` — do this
   with **`RUN`**.
2. **When the container runs**, print that file to the screen — do this with **`CMD`**.

Running the image must output:

```
READY
```

Any small Linux base works (e.g. `debian:12-slim`).

> **Hints:** to create the file during the build, run a shell command that writes text into
> a file (`echo ... > /status.txt`). To print a file when the container starts, the command
> is `cat`. So: one `RUN` line that makes the file, one `CMD` line that `cat`s it.
