# Ship the whole app

The build context holds a small Python program. Running it should print:

```
Total inventory value: 12000
```

Write a **`Dockerfile`** that packages and runs it with Python.

## The catch

The program is **not a single file** — `main.py` relies on another module in the same
folder. If your image only contains `main.py`, Python will fail at runtime with something
like `ModuleNotFoundError: No module named 'inventory'`. Make sure the image contains
everything the program needs.

> A base `python:3.12-slim` image already has Python; you just need the code (all of it)
> in place and a command that runs `main.py`.
