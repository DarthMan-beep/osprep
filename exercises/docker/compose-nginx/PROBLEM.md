# Docker Compose: serve a folder with nginx

Write a **`compose.yaml`** that defines a single service which serves static files with
**nginx**. The build context has a folder **`html/`** containing `products.txt`.

## Requirements

Define a service (any name, e.g. `web`) that:

1. uses the image **`nginx:alpine`**,
2. **bind-mounts** the local `./html` folder into the container at
   **`/usr/share/nginx/html`** (where nginx serves from),
3. **publishes** container port **80** on **host port 8085**.

The grader brings the app up with `docker compose up` and checks:

```
GET http://localhost:8085/products.txt  ->  HTTP 200, body contains "Fridge"
```

## Example shape

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8085:80"
    volumes:
      - ./html:/usr/share/nginx/html
```

> **Tip:** under a service, `image:` picks a prebuilt image, `ports:` maps `"HOST:CONTAINER"`,
> and `volumes:` maps `HOST_PATH:CONTAINER_PATH`. A relative host path like `./html` is
> resolved next to the compose file.
