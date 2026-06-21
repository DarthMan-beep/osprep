# Compose: more than one service

The whole point of Compose is running **several containers together**. The `services:`
block is a **map**, so you just add more entries — one per service.

Two folders are provided: **`a/`** and **`b/`**, each with an `index.html`.

## Task

Write a **`compose.yaml`** with **two** services:

| Service | Image | Serves folder | Host port |
|---|---|---|---|
| `alpha` | `nginx:alpine` | `./a` | 8088 |
| `beta`  | `nginx:alpine` | `./b` | 8089 |

Each service bind-mounts its folder into nginx's web root (`/usr/share/nginx/html`) and
publishes port 80 on its host port. The grader checks:

```
GET http://localhost:8088/  -> contains "Service A"
GET http://localhost:8089/  -> contains "Service B"
```

> **Hint:** it's just the previous exercises twice. Under `services:`, list two names
> (`alpha:` and `beta:`), and give **each** its own `image:`, `ports:`, and `volumes:`
> (`- ./a:/usr/share/nginx/html`). Two services, two ports, two folders — same keys you
> already know, repeated.
