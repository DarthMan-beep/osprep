# Copy two files and join them

Two text files are provided in the build context: **`intro.txt`** and **`outro.txt`**
(you can read both in the *Provided files* panel below).

Write a **`Dockerfile`** that copies **both** files into the image and, when the container
runs, prints them **one after another** so the output reads:

```
Welcome to the inventory system
```

Any small Linux base works (e.g. `debian:12-slim`).

> **Hints:** a single `COPY` can take several sources before the destination, e.g.
> `COPY intro.txt outro.txt ./` copies both into the current `WORKDIR`. To print files in
> order, `cat` accepts multiple filenames: `cat intro.txt outro.txt`. (If you forget to copy
> one of them, `cat` will error at run time because the file isn't in the image.)
