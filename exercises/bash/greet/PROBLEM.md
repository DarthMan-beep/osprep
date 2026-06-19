# Greeting script

Write a Bash script **`greet.sh`** that greets a user by name.

## Requirements

1. When called with exactly **one argument** (the name), print to **stdout**:

   ```
   Hello, <name>!
   ```

   and exit with status **0**.

2. When called with **no arguments**, print a usage message to **stderr**:

   ```
   usage: greet.sh <name>
   ```

   and exit with status **1**. (Nothing should be printed to stdout.)

3. The script must pass `shellcheck` with no warnings.

## Examples

```console
$ ./greet.sh World
Hello, World!
$ echo $?
0

$ ./greet.sh
usage: greet.sh <name>     # this line goes to stderr
$ echo $?
1
```

> **Tip:** `"$1"` is the first argument; `$#` is the argument count. Send text to
> stderr with `>&2`.
