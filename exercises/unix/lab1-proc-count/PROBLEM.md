# Lab 1 — Count processes per user

Reading **`ps aux`-style data from standard input**, print the number of processes
per user.

- Each output line must use the format `"%-20s %s\n"` — the first field is the
  **user**, the second is that user's **process count**.
- Sort the output in **descending order by process count**.
- The first line of `ps aux` output is a **header** and must be ignored.

## Example

Input on stdin:

```
USER  PID ... COMMAND
root    1 ... init
alice   2 ... bash
alice   3 ... vim
bob     4 ... top
alice   5 ... less
bob     6 ... cat
```

Output:

```
alice                3
bob                  2
root                 1
```

> **Tip:** build a pipeline — pull out the user column (skipping the header), then
> `sort | uniq -c | sort -nr`, then reformat with `awk` and `printf`.
