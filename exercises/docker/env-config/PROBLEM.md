# Configure a container with ENV

The build context contains a Java program **`CatalogViewer.java`** and a data file
**`products.txt`**. The program reads the path to the data file from the environment
variable **`PRODUCT_FILE_PATH`** (it throws if that variable isn't set), then prints each
product:

```
Product Name: Fridge
Product Price: $600
Product Quantity: 5
...
```

Write a **`Dockerfile`** that:

1. starts `FROM` a JDK image (`eclipse-temurin:21-jdk`),
2. `COPY`s both files in and **compiles** the program with `RUN javac CatalogViewer.java`,
3. sets a default `ENV PRODUCT_FILE_PATH=` pointing at the copied `products.txt`,
4. runs it with `CMD ["java", "CatalogViewer"]`.

## Requirements

- Running the image must print the products (so `PRODUCT_FILE_PATH` must be set in the image).

> **Tip:** `RUN` executes at **build** time (compiling), while `CMD` runs at **start**
> time. `ENV KEY=value` bakes a default environment variable into the image — the program
> reads it with `System.getenv("PRODUCT_FILE_PATH")`. If you `COPY products.txt .` into
> `WORKDIR /app`, the path is `/app/products.txt`.
