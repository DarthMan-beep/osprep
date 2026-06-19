# Classify an argument with `case`

Write **`classify.sh`** that inspects its first argument using a `case` statement.

## Requirements

1. If the first argument is exactly `1`, `2`, or `3`, print the corresponding word
   to **stdout** and exit `0`:

   | arg | output |
   |---|---|
   | `1` | `one` |
   | `2` | `two` |
   | `3` | `three` |

2. For **any other value** (including when no argument is given), print

   ```
   error: argument must be 1, 2 or 3
   ```

   to **stderr** and exit with status `1`.

3. Must pass `shellcheck`.

## Examples

```console
$ ./classify.sh 2
two
$ ./classify.sh 9
error: argument must be 1, 2 or 3   # stderr
$ echo $?
1
```

> **Tip:** `case "$1" in 1) ... ;; esac`. Use `${1:-}` so referencing `$1` with no
> argument doesn't trip `set -u`.
