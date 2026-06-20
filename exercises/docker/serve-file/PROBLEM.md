# Serve a file over HTTP

Containerize a simple file-hosting service (like the catalog host from the lab). The build
context includes **`products.txt`**:

```
Fridge;$600;5
TV;$1500;6
Microwave;$200;10
```

Write a **`Dockerfile`** that serves files from **`/srv/catalog`** using Python's built-in
HTTP server, listening on **port 9000** inside the container. The server is started with:

```
python3 -m http.server 9000 --directory /srv/catalog
```

When the grader runs your image (publishing the port), this request must succeed:

```
GET /products.txt  ->  HTTP 200, body contains "Fridge"
```

## Requirements

1. `FROM` a Python base image.
2. `COPY` `products.txt` into `/srv/catalog`.
3. `EXPOSE 9000` (documents the port).
4. `CMD` starts the HTTP server shown above.

> **Tip:** `CMD` as a JSON array, one token per element:
> `CMD ["python3", "-m", "http.server", "9000", "--directory", "/srv/catalog"]`.
> You don't publish the port in the Dockerfile — `EXPOSE` only documents it; the grader
> maps it with `-p` when it runs the container.
