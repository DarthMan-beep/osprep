---
title: Unix commands
topic: unix
order: 1
summary: Files, permissions, processes, redirection, pipes, and the grep/sed/awk filtering trio.
---

# Unix commands

## The shell: what it actually is

The shell (`bash`, `sh`, `zsh`, …) is a **command interpreter**. Its core is an
infinite loop usually called the **REPL** (read–eval–print loop):

1. Print a prompt (`$` for a normal user, `#` for root).
2. **Read** one line of input.
3. **Parse** it: split into words, expand variables, expand wildcards, set up
   redirections and pipes.
4. **Evaluate**: find the program named by the first word and `fork()`+`exec()`
   it (or run a *builtin* like `cd` directly inside the shell), wait for it to
   finish.
5. Print the result / next prompt, and loop.

General form of a command:

```
command_name -options arguments
```

- The **first word** is what gets run. The shell looks it up either as a builtin,
  or as a file found by searching the directories listed in the `PATH`
  environment variable (check with `echo $PATH`).
- **Options** (a.k.a. flags, switches) modify behaviour. They are
  **case-sensitive** and conventionally start with `-`. Single-letter options can
  be **combined**: `ls -a -l` is identical to `ls -al` or `ls -la`. Long options
  use `--`, e.g. `ls --all`.
- **Arguments** are the things the command acts on (usually filenames).

### Getting help

- `man command` — full manual. Inside a man page the notation `[ ]` marks an
  **optional** part and `...` marks something **repeatable**. Press `q` to quit,
  `/word` to search.
- `command --help` — quick usage summary for most GNU tools.
- `type command` — tells you whether something is a builtin, an alias, or a file
  on disk (and where).

> **Mental model to carry through everything below:** almost every tool reads a
> stream of bytes from **standard input** and writes a stream of bytes to
> **standard output**. The shell's job is to *wire those streams together*
> (files, pipes, terminals). Once you internalise this, redirection and pipes
> stop being magic.

## Files & directories

Unix has a single **rooted tree** starting at `/`. A path is **absolute** if it
starts with `/` (resolved from the root) and **relative** otherwise (resolved
from your current directory). Two special names exist in every directory: `.`
(this directory) and `..` (the parent).

| Command | What it's for | Key options |
|---|---|---|
| `pwd` | print the working directory (where you are) | `-P` resolve symlinks |
| `cd DIR` | change directory | `cd ..` parent · `cd ~` / `cd` home · `cd -` previous dir |
| `ls` | list directory contents | `-a` incl. hidden · `-l` long · `-h` human sizes · `-t` by time · `-R` recursive |
| `cp SRC DST` | copy a file | `-r` recursive · `-p` preserve metadata · `-i` ask before overwrite · `-s` make symlink |
| `mv SRC DST` | move / rename | `-i` ask · `-n` never overwrite |
| `rm NAME` | remove (delete) | `-r` recursive · `-f` force (no prompt, ignore missing) |
| `touch FILE` | create empty file / update timestamp | `-c` don't create if absent |
| `cat FILE` | print or concatenate files | `-n` number lines · `-b` number non-blank · `-s` squeeze blank runs |
| `wc FILE` | count | `-l` lines · `-w` words · `-c` bytes · `-m` chars |
| `cut` | extract columns | `-c LIST` chars · `-f LIST -d C` fields by delimiter |
| `find PATH` | walk a directory tree, test each entry | `-name` · `-type` · `-mtime` · `-size` · `-exec` |

### How they work

**`pwd`/`cd`** — the shell keeps a "current working directory" per process.
`cd` is a *builtin* (it must be — it has to change the shell's own state; a
separate program could only change its own directory and then exit). `cd -`
jumps back to the previous directory.

**`ls -l`** — the long format is the one you must be able to read on sight:

```console
$ ls -l
-rw-r--r--  1 ana  staff   1280 Jun 18 09:14 report.txt
drwxr-xr-x  2 ana  staff   4096 Jun 17 22:01 src
```

Field by field: `-`/`d` is the **type** (`-` regular file, `d` directory,
`l` symlink), then **9 permission bits** (see Permissions below), **link count**,
**owner**, **group**, **size in bytes**, **modification time**, **name**.

**`cp -r` vs files** — without `-r`, `cp` refuses to copy a directory. `cp -p`
keeps the original timestamps and permissions; a plain `cp` resets them to "now"
and applies your umask.

**`rm` has no undo.** `rm -rf dir` deletes a whole subtree silently. The classic
disaster is an unexpected space: `rm -rf / home/me/tmp` (note the space after
`/`) tries to wipe the entire filesystem. Always double-check globs (below)
before combining them with `rm -f`.

**`cat`** literally con**cat**enates: `cat a b c` streams a, then b, then c to
stdout. With one file it just dumps it; that's the common everyday use.

**`wc`** — worked example:

```console
$ wc poem.txt
   3   12   67 poem.txt
   │    │    └─ bytes
   │    └────── words
   └─────────── lines
$ wc -l poem.txt
3 poem.txt
```

**`cut`** — pull out columns. Two modes: by character position (`-c`) or by
delimited field (`-f` with `-d`).

```console
$ echo 'ana:1001:/home/ana' | cut -d: -f1,3
ana:/home/ana
$ echo 'abcdef' | cut -c2-4
bcd
```

Pitfall: `cut -f` treats **a single character** as the delimiter and does **not**
collapse repeated delimiters. If columns are separated by *runs* of spaces, `cut`
will misbehave — use `awk` instead, which splits on whitespace runs by default.

### `find` — the tree walker

`find` starts at `PATH` and **recursively visits every entry**, applying a chain
of **tests**; entries that pass all tests trigger an **action** (default action is
`-print`). Tests are ANDed together left to right.

| Test / action | Meaning |
|---|---|
| `-name '*.c'` | name matches a glob (quote it so the *shell* doesn't expand it first) |
| `-iname` | case-insensitive name |
| `-type f` / `-type d` | regular file / directory |
| `-mtime -5` | modified less than 5 days ago (`+5` = more than, `5` = exactly) |
| `-size +2000c` | larger than 2000 bytes (`k`, `M` also work; bare number = 512-byte blocks) |
| `-exec CMD {} \;` | run CMD on each hit; `{}` is the filename, `\;` ends it |
| `-exec CMD {} +` | run CMD once with many filenames batched (faster) |

```console
$ find / -name '*alpha*' -print           # every file with "alpha" in its name
$ find . -type f -mtime -1                 # files changed in the last 24h
$ find . -name core -exec rm -f {} \;      # find core dumps and delete each
$ find . -name '*.log' -size +1M           # log files bigger than 1 MB
```

Gotcha: in `-name '*.c'` the quotes are essential. Unquoted, the **shell** would
expand `*.c` against the *current* directory before `find` ever runs, breaking the
recursive search.

## Permissions — `chmod`

Every file has an **owner** (user) and a **group**, and a 9-bit permission set
split into three classes — **u**ser (owner), **g**roup, **o**ther — each with
three bits: **r** (read), **w** (write), **x** (execute). `ls -l` shows them as
`rwxr-x---`.

### What rwx means depends on file vs directory

| Bit | On a **file** | On a **directory** |
|---|---|---|
| `r` | read the contents | **list** the names inside (`ls`) |
| `w` | modify the contents | create/delete/rename entries inside |
| `x` | execute it as a program | **enter / traverse** it (`cd`, use a path through it) |

Key consequences:

- `x` without `r` on a directory: you can `cd` into it and access a file *if you
  already know its name*, but you can't `ls` it.
- `r` without `x` on a directory: `ls` may show names but you can't actually reach
  the files (you get "Permission denied" on access).
- To delete a file you need `w` on its **directory**, not on the file itself —
  because deletion changes the directory's list of entries.

### Two ways to set permissions

**Symbolic** — `chmod [who][op][perms]`. `who` ∈ `u g o a` (a = all),
`op` ∈ `+ - =` (add / remove / set exactly), `perms` ∈ `r w x`.

```console
$ chmod u+x script.sh      # give the owner execute
$ chmod go-w shared.txt    # remove write from group and others
$ chmod a=r notes.txt      # everyone: read only, nothing else
```

**Octal** — each class is one octal digit, formed from its three bits read as
binary `rwx`:

| rwx | binary | octal |
|---|---|---|
| `rwx` | 111 | 7 |
| `rw-` | 110 | 6 |
| `r-x` | 101 | 5 |
| `r--` | 100 | 4 |
| `-wx` | 011 | 3 |
| `--x` | 001 | 1 |
| `---` | 000 | 0 |

So three digits = user, group, other:

```console
$ chmod 640 f      # -rw-r-----  owner rw, group r, others nothing
$ chmod 755 f      # -rwxr-xr-x  owner all, others read+enter/execute
$ chmod 600 f      # -rw-------  private file
```

Why this works: `6` = `4+2` = `r + w`; `5` = `4+1` = `r + x`; `7` = `4+2+1` =
all. You're just summing the place values (r=4, w=2, x=1).

> Tip: `755` is the normal mode for directories and programs (everyone can use
> them, only the owner can change them); `644` is normal for plain files.

## Processes

A **process** is a running program with a unique **PID**. The shell starts each
external command as a child process and normally **waits** for it (foreground).

```console
$ command &        # run in the BACKGROUND: shell prints [job] PID and returns at once
$ ps               # processes in this terminal
$ ps -ef           # EVERY process, full listing (UID, PID, PPID, start, command)
$ ps -ef | grep nginx
$ jobs             # background/stopped jobs started by THIS shell
$ fg %1            # bring job 1 back to the foreground
$ kill PID         # ask a process to terminate (sends SIGTERM = signal 15)
$ kill -9 PID      # force kill (SIGKILL = 9, cannot be caught/ignored)
$ pidof -s bash    # PID(s) of a program by name; -s = single PID
```

### How background jobs work

`&` tells the shell **not to wait**. The process keeps running and you get the
prompt back immediately. `jobs` lists those started by the current shell with job
numbers (`%1`, `%2`); `fg`/`bg` move them between foreground and background, and
`Ctrl-Z` suspends the current foreground job.

### Signals and `kill`

`kill` doesn't necessarily "kill" — it **sends a signal**. Defaults to `SIGTERM`
(15), a polite "please shut down" the program can handle (e.g. flush files).
`kill -9` sends `SIGKILL`, which the kernel enforces immediately and the program
cannot trap — use it only when `SIGTERM` is ignored.

### The `/proc` virtual filesystem

`/proc` is not real disk; the kernel **synthesises** these files on read, exposing
live kernel/process state as text. For a process with PID *N*:

| Path | Contents |
|---|---|
| `/proc/<pid>/status` | human-readable state, memory (VmRSS, VmSize), UID, threads |
| `/proc/<pid>/statm` | memory sizes **in pages** — multiply by the page size |
| `/proc/<pid>/maps` | every mapped memory region (code, heap, stack, libraries) |
| `/proc/<pid>/cmdline` | the exact command line (NUL-separated) |

```console
$ cat /proc/self/status | head -3
$ getconf PAGESIZE          # usually 4096 bytes → multiply statm fields by this
$ pmap -x <PID>             # formatted memory map with sizes per region
```

Gotcha: `statm` numbers are in **pages**, not bytes. A value of `1000` with a
4096-byte page means ~4 MB. Always multiply by `getconf PAGESIZE`.

## Redirection & pipes

Every process starts with three open streams identified by **file descriptors**:

| Stream | FD | Default |
|---|---|---|
| standard input (**stdin**) | 0 | the keyboard |
| standard output (**stdout**) | 1 | the terminal |
| standard error (**stderr**) | 2 | the terminal |

Redirection tells the shell to **reconnect a descriptor to a file** *before* the
command runs. The command itself doesn't know or care — it just reads FD 0 and
writes FD 1/2.

| Operator | Meaning |
|---|---|
| `> file` | stdout → file (**create/overwrite**) |
| `>> file` | stdout → file (**append**) |
| `< file` | stdin ← file |
| `2> file` | stderr → file |
| `2>&1` | stderr → wherever stdout currently goes |
| `&> file` | both stdout and stderr → file (bash) |
| `\| cmd2` | stdout of left → stdin of right (a **pipe**) |
| `tee file` | copy stdin to *file* **and** pass it on to stdout |

```console
$ ls -l > list.txt                 # overwrite list.txt with the listing
$ echo "line" >> log.txt           # append one line
$ sort -rn < nums.txt > sorted.txt # read from one file, write to another
$ make 2> errors.txt               # keep only the error messages
$ cmd > out.txt 2>&1               # both streams into out.txt (order matters!)
$ cmd > /dev/null 2>&1             # discard everything
```

### How a pipe actually works

`A | B` makes the shell create an in-kernel **pipe buffer**, then run **A and B at
the same time**: A's stdout (FD 1) is connected to the write end, B's stdin
(FD 0) to the read end. Bytes A produces flow straight into B without ever
touching disk. If B is slow, A blocks when the buffer fills (back-pressure); when
A finishes and closes its end, B sees end-of-input.

```console
$ ls -l | grep '^d' | wc -l        # count subdirectories: list → keep dir lines → count
$ ls | tee files.txt | wc -l       # save the list AND count it in one pass
```

Gotchas:

- `cmd > out.txt 2>&1` works, but `cmd 2>&1 > out.txt` does **not** redirect
  errors to the file — redirections are applied **left to right**, so at the time
  of `2>&1`, stdout was still the terminal.
- `>` truncates the file the instant the command starts. `sort f > f` will
  **empty f before sort reads it** — never redirect into a file you're also
  reading.
- Only **stdout** flows through a pipe; **stderr** still goes to the terminal
  unless you add `2>&1`.

## Globbing (filename wildcards)

Globbing is done **by the shell**, *before* the command runs. The shell expands
the pattern into the list of **matching existing filenames** and passes those as
separate arguments. The command never sees the `*` — it just receives a list of
names. (Compare `grep`'s regexes, which `grep` itself interprets on text.)

| Pattern | Matches |
|---|---|
| `?` | exactly one character |
| `*` | any run of characters (including none) |
| `[abc]` | one of the listed characters |
| `[2-4]` | one character in the range |
| `[^0-9]` / `[!0-9]` | one character **not** in the set |
| `{a,b}` | brace expansion: produces `a` and `b` (not a wildcard — works even if no file exists) |

```console
$ echo *.txt                 # show what the glob expands to before running anything
$ rm *[^0-9]                 # remove files whose name does NOT end in a digit
$ mv ab* new/                # move everything starting with "ab"
$ cp file{1,2,3}.c backup/   # expands to file1.c file2.c file3.c
```

Gotchas:

- If a glob matches **nothing**, bash (by default) passes the pattern through
  **literally**. `ls *.xyz` with no matches runs `ls *.xyz` and errors "No such
  file or directory" — it does not run plain `ls`.
- `*` does **not** match a leading dot. Hidden files (`.bashrc`) are skipped
  unless you write the dot explicitly (`.[!.]*`) or set `dotglob`.
- Brace expansion `{a,b}` happens even with no matching files and is **not** a
  glob; it's pure text generation.

## Filtering: grep · sed · awk

These three read input **line by line** and decide, per line, what to do. They're
the backbone of pipelines. The regular expressions below are **Basic Regular
Expressions (BRE)** unless noted.

### grep — find matching lines

**What it's for:** print the lines of its input that match a regex (search).

**How it works:** reads input one line at a time; if the line contains a match
for the pattern, it prints the **whole line** (by default). It does *not* edit
anything.

Core regex syntax: `^` start of line · `$` end of line · `.` any one char ·
`*` zero-or-more of the previous · `[ ]` character class · `\` escape a special
char.

| Option | Effect |
|---|---|
| `-v` | invert: print **non-matching** lines |
| `-i` | case-insensitive |
| `-c` | print only the **count** of matching lines |
| `-n` | prefix each hit with its line number |
| `-l` | print only the **names** of files that contain a match |
| `-r` | recurse into directories |
| `-E` | extended regex (`+`, `?`, `|`, `()` without backslashes) |

```console
$ grep '^From ' mailbox          # lines that START with "From "
$ grep -v '^#' config            # everything EXCEPT comment lines
$ grep -i unix notes.txt         # match Unix, UNIX, unix, …
$ grep -rn TODO src/             # every TODO under src/, with file:line
$ grep -E '^[0-9]{3}-[0-9]{4}$' phones   # lines that are exactly NNN-NNNN
```

Worked example:

```console
$ cat fruit.txt
apple
banana
Apricot
$ grep -i '^a' fruit.txt
apple
Apricot
```

### sed — stream editor

**What it's for:** transform text on the fly — most often **search-and-replace**.

**How it works:** reads each line into a "pattern space", applies your editing
commands, and (by default) prints the result. By default it does **not** modify
the file; output goes to stdout. The workhorse is the substitute command
`s/old/new/flags`.

| Command | Meaning |
|---|---|
| `s/re/repl/` | replace the **first** match on each line |
| `s/re/repl/g` | replace **all** matches on the line |
| `s/re/repl/gi` | all matches, case-insensitive |
| `/re/d` | delete lines matching re |
| `/re/p` | print matching lines (use with `-n`) |
| `-n` | suppress the automatic print (so only `p` outputs) |
| `-i` | edit the file **in place** (dangerous; make a backup) |

```console
$ sed 's/Aple/Apple/g' f.txt     # fix every "Aple" → "Apple"
$ sed '/^#/d' config             # drop all comment lines
$ sed -n '/error/p' log          # behave like grep: print only matches
$ sed -n '2,5p' file             # print only lines 2 through 5
```

Worked example:

```console
$ echo 'color colour color' | sed 's/colou\?r/COLOR/g'
COLOR COLOR COLOR        # (using -E or \? in BRE; matches both spellings)
```

Gotcha: `s///` without `g` changes only the **first** occurrence per line. And
`sed -i` overwrites the file with no undo — test without `-i` first.

### awk — field/record processor

**What it's for:** column-oriented processing and small reports — when you think
in terms of "field 1, field 3, sum of field 2".

**How it works:** awk reads input one **record** (line) at a time and splits it
into **fields**. A program is a list of `pattern { action }` rules: for each line,
every rule whose `pattern` is true runs its `action`. Omit the pattern to run on
every line; omit the action and the default is "print the line".

| Built-in | Meaning |
|---|---|
| `$0` | the whole line |
| `$1`, `$2`, … | first, second, … field |
| `NF` | number of fields on this line |
| `NR` | current line (record) number |
| `-F C` | set the field separator to C (default: whitespace runs) |
| `BEGIN { }` | runs once **before** any input |
| `END { }` | runs once **after** all input |

```console
$ awk '{ print $1, $3 }' data            # print columns 1 and 3
$ awk -F: '{ print $1 }' /etc/passwd     # usernames (passwd is colon-separated)
$ awk '$3 > 75 { print $0 }' grades      # whole line where field 3 > 75
$ awk 'END { print NR }' file            # line count (like wc -l)
$ awk 'BEGIN{c=0} /^ *$/{c++} END{print c}' f   # count blank lines
$ awk '{ s += $2 } END { print s }' nums         # sum of the 2nd column
```

Worked example:

```console
$ cat scores.txt
ana 90
bob 60
cyd 78
$ awk '$2 >= 75 { print $1 }' scores.txt
ana
cyd
```

Note: unlike `cut -f`, awk's default split collapses **runs** of whitespace, so it
handles columns padded with multiple spaces correctly.

### sort / uniq / tr

**`sort`** — orders lines. By default lexicographic (so `10` sorts before `9`).

| Option | Effect |
|---|---|
| `-n` | numeric sort (`9` before `10`) |
| `-r` | reverse |
| `-k N` | sort by field N |
| `-u` | drop duplicate lines after sorting |

**`uniq`** — collapses **adjacent** duplicate lines only. This is the classic
trap: it does **not** find duplicates that aren't next to each other, so you
almost always pipe `sort | uniq`. `-c` prefixes each line with its count; `-d`
shows only the duplicated lines.

**`tr`** — translate or delete **characters** (reads stdin only, no filename arg).
`tr 'a-z' 'A-Z'` upper-cases; `-d` deletes a set; `-s` squeezes runs of a
character to one.

```console
$ sort -n nums.txt                    # 2, 9, 10  (numeric)
$ sort names.txt | uniq -c            # frequency of each name
$ echo 'Hello World' | tr 'a-z' 'A-Z' # HELLO WORLD
$ echo 'a    b' | tr -s ' '           # collapse spaces → "a b"
$ cat file | tr -d '\r'               # strip Windows carriage returns
```

Worked example — top words by frequency:

```console
$ cat words.txt
red
blue
red
red
blue
$ sort words.txt | uniq -c | sort -rn
      3 red
      2 blue
```

> **Practice:** the Unix exercises let you build these pipelines and check the
> exact output. Try to predict each command's output *before* running it — that's
> what the exam asks of you.
