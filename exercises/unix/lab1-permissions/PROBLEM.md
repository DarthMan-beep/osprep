# Lab 1 — Set file permissions

Write the command to change the permissions of **`hello_world.py`** so that **only
the owner and the owner's group** can **read** and **write** it — no execute for
anyone, and no permissions at all for others.

The file `hello_world.py` already exists in the current directory.

## Expected result

```console
$ ls -l hello_world.py
-rw-rw---- 1 user user 0 ... hello_world.py
```

> **Tip:** with octal `chmod`, each digit is a class (owner, group, other) and
> read = 4, write = 2, execute = 1.
