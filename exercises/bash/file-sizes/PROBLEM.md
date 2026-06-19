# Categorize files by size

Write **`classify_sizes.sh`** that classifies the regular files in a directory by their
size in bytes. (Adapted from a course tutorial task.)

## Requirements

1. The script takes **one argument**: a directory.
2. For each **regular file** directly inside that directory (ignore subdirectories),
   print one line to **stdout**:

   ```
   <filename> <category>
   ```

   where `<filename>` is the base name (no path) and `<category>` is decided by the
   file's size in bytes:

   | size (bytes) | category |
   |---|---|
   | `0` | `empty` |
   | `1`–`100` | `small` |
   | `101`–`1000` | `medium` |
   | `> 1000` | `large` |

3. The output lines must be **sorted by filename** (ascending).
4. If the argument is missing or is not a directory, print

   ```
   usage: classify_sizes.sh <dir>
   ```

   to **stderr** and exit `1`. Otherwise exit `0`.
5. Must pass `shellcheck`.

## Example

For a directory `data/` containing `a` (0 B), `b` (50 B), `c` (500 B), `e` (2000 B):

```console
$ ./classify_sizes.sh data
a empty
b small
c medium
e large
```

> **Tips:** iterate with `for f in "$dir"/*`; skip non-files with
> `[ -f "$f" ] || continue`; get a size with `stat -c%s "$f"`; get the base name with
> `basename "$f"`. Pipe the loop's output through `sort` to order by name.
