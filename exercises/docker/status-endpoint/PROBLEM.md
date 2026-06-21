# Bring the service up

The build context contains **`server.py`** — a tiny HTTP service. Write a **`Dockerfile`**
that runs it so that, once the container is up, this request succeeds:

```
GET /health  ->  HTTP 200, body contains "healthy"
```

## What you have to figure out

- The grader publishes the container's port for you and then makes the request — but **you
  have to start the server when the container runs** (a base image won't run `server.py` on
  its own).
- **Which port** does it listen on? Don't guess — open `server.py` and read it. Your image
  should expose that port.

> No extra packages are needed (`server.py` only uses Python's standard library), so a
> `python:3.12-slim` base is enough. The work is: get the code in, and make the container
> launch it.
