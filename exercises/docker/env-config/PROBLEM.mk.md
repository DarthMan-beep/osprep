# Конфигурирај контејнер со ENV

Build контекстот содржи Java програма **`CatalogViewer.java`** и податочна датотека
**`products.txt`**. Програмата ја чита патеката до податочната датотека од променливата на
околината **`PRODUCT_FILE_PATH`** (фрла исклучок ако не е поставена), па ги печати
производите:

```
Product Name: Fridge
Product Price: $600
Product Quantity: 5
...
```

Напиши **`Dockerfile`** што:

1. почнува `FROM` JDK слика (`eclipse-temurin:21-jdk`),
2. ги `COPY`-ра двете датотеки и **компилира** со `RUN javac CatalogViewer.java`,
3. поставува стандардна `ENV PRODUCT_FILE_PATH=` што покажува на копираниот `products.txt`,
4. ја извршува со `CMD ["java", "CatalogViewer"]`.

## Барања

- Извршувањето на сликата мора да ги испечати производите (значи `PRODUCT_FILE_PATH` мора
  да е поставена во сликата).

> **Совет:** `RUN` се извршува во време на **градење** (компилирање), додека `CMD` во време
> на **стартување**. `ENV KEY=value` вградува стандардна променлива на околината во сликата
> — програмата ја чита со `System.getenv("PRODUCT_FILE_PATH")`. Ако `COPY products.txt .`
> во `WORKDIR /app`, патеката е `/app/products.txt`.
