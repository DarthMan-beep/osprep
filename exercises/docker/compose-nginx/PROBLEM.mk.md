# Docker Compose: сервирај папка со nginx

Напиши **`compose.yaml`** што дефинира една услуга која сервира статични датотеки со
**nginx**. Build контекстот има папка **`html/`** што содржи `products.txt`.

## Барања

Дефинирај услуга (било кое име, на пр. `web`) што:

1. ја користи сликата **`nginx:alpine`**,
2. прави **bind-mount** на локалната папка `./html` во контејнерот на
   **`/usr/share/nginx/html`** (од каде што сервира nginx),
3. **објавува** контејнерска порта **80** на **порта 8085 на домаќинот**.

Оценувачот ја подига апликацијата со `docker compose up` и проверува:

```
GET http://localhost:8085/products.txt  ->  HTTP 200, телото содржи "Fridge"
```

## Пример форма

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8085:80"
    volumes:
      - ./html:/usr/share/nginx/html
```

> **Совет:** под услуга, `image:` бира готова слика, `ports:` мапира `"HOST:CONTAINER"`,
> а `volumes:` мапира `HOST_PATH:CONTAINER_PATH`. Релативна патека како `./html` се
> разрешува до compose датотеката.
