# Your first Dockerfile

A small Python program **`main.py`** is provided in the build context:

```python
print("Hello from Docker!")
```

Write a **`Dockerfile`** that packages and runs it. When the image is built and a
container is started from it, the container must print:

```
Hello from Docker!
```

## Requirements

Your Dockerfile should:

1. start **`FROM`** a Python base image (e.g. `python:3.12-slim`),
2. set a working directory with **`WORKDIR`**,
3. **`COPY`** `main.py` into the image,
4. run it on start with **`CMD`**.

> **Tip:** the four instructions you need are `FROM`, `WORKDIR`, `COPY`, and `CMD`.
> `CMD` takes a JSON array, e.g. `CMD ["python", "main.py"]`. Each instruction becomes a
> layer; `COPY main.py .` copies into the current `WORKDIR`.
