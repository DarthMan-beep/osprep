# The missing tool

The build context has two files:

- **`data.json`** — a small JSON file describing a product.
- **`show.sh`** — a shell script that reads `data.json` and prints the product name. It does
  this with **`jq`**, a command-line JSON processor.

Write a **`Dockerfile`** so that running the image prints exactly:

```
Fridge
```

## The catch

`show.sh` works fine on a machine where `jq` is installed — but a slim base image
**doesn't ship `jq`**. If you just copy the files in and run the script, you'll see
something like `jq: not found`. Your Dockerfile has to make sure the tool is available
inside the image before the script runs.

> Debian/Ubuntu-based images install packages with their package manager; the relevant
> one here is named `jq`. (`show.sh` expects the files at `/app`.)
