# Lab 1 — Count unfinished quizzes (from stdin)

Reading student data **from standard input** (one student per line, fields
`<index> <exam-date> <quiz-status> <points>`), write the command that prints the
**number of students who have not completed the quiz from `14.03.2024`** — i.e. whose
line contains both `14.03.2024` and the status `in_progress`.

## Example

Input on stdin:
```
21001 14.03.2024 done 80
22002 14.03.2024 in_progress 45
21003 14.03.2024 in_progress 30
22004 16.03.2024 in_progress 50
23005 14.03.2024 done 90
```
Output:
```
2
```

> **Tip:** chain filters with pipes — `grep ... | grep ... | wc -l`.
