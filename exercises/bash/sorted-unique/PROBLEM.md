# Sorted unique numbers

Write **`process.sh`** that processes a file of integers using a Unix pipeline.

## Requirements

1. The script takes **one argument**: the path to an input file with one integer per line.
2. It writes to a file named **`result.txt`** (in the current directory) the integers
   from the input **sorted in descending numeric order** with **duplicates removed**.
3. If the argument is missing or the file does not exist, print

   ```
   usage: process.sh <file>
   ```

   to **stderr** and exit `1`.
4. Must pass `shellcheck`.

## Example

Input `nums.txt`:

```
3
1
2
3
2
10
```

After `./process.sh nums.txt`, `result.txt` contains:

```
10
3
2
1
```

> **Tip:** `sort -rn` sorts numerically in reverse; `uniq` removes **adjacent**
> duplicates — which is why it comes *after* sorting. Combine them with a `|` pipe
> and redirect with `>`.
