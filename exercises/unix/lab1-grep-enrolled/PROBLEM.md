# Lab 1 — Filter by enrolment year

A file **`OS2.txt`** in the current directory holds one student per line:

```
<index> <exam-date> <quiz-status> <points>
```

The index starts with the two-digit enrolment year (e.g. `21...` means 2021).

Write the command that prints **only the students who enrolled in 2021** — i.e. whose
index begins with `21`.

## Example

For this `OS2.txt`:

```
21001 14.03.2024 done 80
22002 15.03.2024 in_progress 45
21003 14.03.2024 done 30
```

the output is:

```
21001 14.03.2024 done 80
21003 14.03.2024 done 30
```

> **Tip:** `grep` matches a regular expression; `^` anchors it to the start of the line.
