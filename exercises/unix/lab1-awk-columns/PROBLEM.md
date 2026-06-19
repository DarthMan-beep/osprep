# Lab 1 — Print selected columns

Each line of **`OS1.txt`** and **`OS2.txt`** has the fields:

```
<index> <exam-date> <quiz-status> <points>
```

Write the command that prints, for **every line of both files combined**, the
**index** and the **quiz status** (fields 1 and 3), space-separated.

## Example

`OS1.txt`:
```
21001 14.03.2024 done 80
22002 15.03.2024 in_progress 45
```
`OS2.txt`:
```
21003 14.03.2024 done 30
```
Output:
```
21001 done
22002 in_progress
21003 done
```

> **Tip:** `awk '{ print $1, $3 }'` can take several files at once.
