# Lab 1 — Filter and project with awk

Using the same **`OS2.txt`** (fields: `<index> <exam-date> <quiz-status> <points>`),
write the command that prints the **index, exam date, and points** — in that order,
space-separated — for the students who:

- enrolled in **2022** (index begins with `22`), **and**
- scored **no more than 50** points.

## Example output

```
22002 15.03.2024 45
22004 16.03.2024 50
```

> **Tip:** in `awk` you can match a field against a regex with `~` (e.g. `$1 ~ /^22/`)
> and compare a numeric field with `<=`. Combine conditions with `&&`.
