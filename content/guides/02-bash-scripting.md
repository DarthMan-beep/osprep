---
title: Bash scripting
topic: bash
order: 2
summary: Variables, arguments, tests, conditionals, loops, case, functions — the script-writing toolkit.
---

# Bash scripting ("command procedures")

A script is just a plain text file containing the same commands you would type at the
prompt. When you run it, the shell reads the file line by line and executes each command
exactly as if you had typed it interactively. There is no compilation step — Bash is an
**interpreter**, so a "syntax error" is only discovered when execution reaches that line.

The big mental shift from a language like C or Python is this: **Bash is a command
launcher first and a programming language second.** Almost everything you write is, at
heart, "run this program with these words as arguments." The control structures
(`if`, `while`, `case`) and the variables exist mainly to decide *which* commands to run
and *with what arguments*. Understanding that "words" are the basic unit — and how the
shell turns a line of text into a list of words — explains nearly every quoting rule and
gotcha below.

## Shebang & running scripts

The first line of a script is the **shebang** (`#!` followed by an interpreter path):

```bash
#!/bin/bash
```

### How the shebang actually works

`#!` is not a Bash feature — it is a **kernel** feature. When you execute a file, the
kernel looks at its first two bytes. If they are `#!`, the kernel does *not* try to run
the file as a binary; instead it reads the rest of that line, treats it as the path to an
interpreter, and runs that interpreter, passing the script's path as an argument. So:

```console
$ ./script.sh           # you type this
```

effectively becomes, behind the scenes:

```console
/bin/bash ./script.sh
```

This is why the shebang must be the **very first line** with no blank line or space
before `#!`, and why the path must be absolute — the kernel does no `PATH` lookup.

- `#!/bin/bash` — use the real Bash interpreter (needed for arrays, `[[ ]]`, `$(( ))`
  tricks, `select`, etc.).
- `#!/bin/sh` — request POSIX-only shell behaviour. On many systems `/bin/sh` is *not*
  Bash (it may be `dash`), so "bashisms" like arrays will fail. For this course, prefer
  `#!/bin/bash`.
- `#!/usr/bin/env bash` — portable form that finds `bash` via `PATH` instead of hard-coding
  `/bin/bash`. Common in the wild; either is acceptable for the exam.

### Three ways to run a script

```console
$ chmod +x script.sh    # set the execute bit once
$ ./script.sh           # run it as a program (kernel reads the shebang)

$ bash script.sh        # run it by naming the interpreter (shebang & exec bit ignored)

$ source script.sh      # or: . script.sh
```

The difference matters:

| Invocation | New process? | Reads shebang? | Affects current shell? |
|---|---|---|---|
| `./script.sh` | Yes (child shell) | Yes | No |
| `bash script.sh` | Yes (child shell) | No (you named bash) | No |
| `source` / `.` | No (runs in current shell) | No | **Yes** — variable & `cd` changes persist |

You must write `./script.sh`, not just `script.sh`, because the shell only searches `PATH`
for command names — and `.` (the current directory) is normally **not** in `PATH` for
security reasons. The `./` says "this exact file, here."

`#` starts a comment: everything from `#` to the end of the line is ignored (except in the
shebang). There are no block comments.

## Variables

Bash variables are **untyped** — every value is fundamentally a **string**. There is no
`int`, no `bool`; `count=5` stores the two-character string `5`, and arithmetic only
happens when you explicitly ask for it (see [Arithmetic](#arithmetic)).

### Assignment: why no spaces around `=`

```bash
name="Ana"          # correct
name = "Ana"         # WRONG
```

This is the single most common beginner error, and the reason is the "command launcher"
model. The shell splits a line into words on spaces. `name="Ana"` is one word with no
space, so the shell recognises the `word=value` *assignment* form. But `name = "Ana"` is
**three** words: `name`, `=`, `Ana`. The shell tries to run a **program called `name`**
with arguments `=` and `Ana`, giving `name: command not found`. The lack of spaces is what
tells the shell "this is an assignment, not a command."

### Using a variable: `$` triggers expansion

```bash
name="Ana"
echo "$name"        # use — always quote (see below)
echo "${name}_x"    # braces delimit where the name ends -> Ana_x
echo "$name_x"      # WRONG: looks for a variable called name_x (likely empty)
```

`$name` is **parameter expansion**: before the command runs, the shell replaces `$name`
with the variable's value. The braces in `${name}` are needed whenever the character after
the name could be part of a name (a letter, digit, or underscore).

### Quoting — the core mental model

This is the topic that trips up the most people and the most `shellcheck` warnings, so
internalise the *order of operations*. After the shell substitutes a variable's value, it
performs two more steps on the **unquoted** result:

1. **Word splitting** — the result is chopped into separate words at every space, tab, or
   newline (technically, at each character in `$IFS`, the Internal Field Separator,
   which defaults to space/tab/newline).
2. **Glob expansion** (pathname expansion) — any word containing `*`, `?`, or `[...]` is
   replaced by the list of matching filenames.

Double quotes turn **both** steps off for the value inside them. That is the whole point of
quoting `"$var"`.

```bash
file="my report.txt"

rm $file            # DANGER: splits into two words -> rm "my" "report.txt"
rm "$file"          # correct: one argument, "my report.txt"
```

```bash
pattern="*.txt"
echo $pattern       # glob runs: prints every .txt file in the directory
echo "$pattern"     # prints the literal string  *.txt
```

| Quote style | Variable expansion `$x` | Command sub `$(...)` | Word splitting / globbing |
|---|---|---|---|
| `"double"` | yes | yes | **no** (safe) |
| `'single'` | **no** (fully literal) | **no** | no |
| unquoted | yes | yes | **yes** (dangerous) |

Single quotes are completely literal — even `$` and `\` mean themselves. Use them when you
want the text exactly as written:

```bash
echo 'Cost is $5 for *everyone*'   # prints literally, no expansion, no glob
```

**Rule of thumb for the exam and for `shellcheck`: quote every variable expansion as
`"$var"` and every command substitution as `"$(cmd)"` unless you have a specific reason to
want splitting/globbing.** The deliberate exception is loop heads like `for x in $list`
where you *want* splitting — but even there, an array is cleaner.

### Variable attributes & scope

```bash
readonly PI=3.14159   # constant; assigning to it later is an error
unset name            # removes the variable entirely
export PATH           # mark a variable for export to child processes
greeting="hi" prog    # one-shot: set greeting only for the command prog
```

A plain variable lives **only in the current shell** and is *not* visible to programs the
script launches. `export` copies it into the **environment**, a list of `KEY=value` strings
that the kernel hands to every child process. This is how, e.g., `PATH` or `HOME` reach the
programs you run. Exporting is one-way (parent → child): a child can never change the
parent's variables, which is exactly why `source` exists when you *do* want changes to
persist.

A handy default-value form (parameter expansion) avoids "unbound variable" surprises:

```bash
echo "${EDITOR:-vi}"   # use $EDITOR if set & non-empty, else the literal "vi"
name="${1:?need a name}"  # exit with an error message if $1 is empty/unset
```

## Arrays

Arrays hold an indexed list of strings — the right tool whenever you have "a list of
things" (filenames, arguments) and want to avoid the word-splitting hazards of stuffing a
list into one space-separated string.

```bash
a=(one two three)        # create; indices 0,1,2
echo "${a[1]}"           # element 1  -> two   (0-based!)
echo "${a[@]}"           # ALL elements, each as a separate quoted word
echo "${#a[@]}"          # number of elements -> 3
echo "${!a[@]}"          # the list of indices -> 0 1 2

a[5]="six"               # arrays are sparse; gaps are allowed
a+=(four)                # append one element

unset 'a[1]'             # remove element 1 (note the quotes for shellcheck)
```

### Why `"${a[@]}"` is special

The combination of `@` **and** double quotes is the only way to get every element back as
its own properly-quoted word — preserving spaces inside elements:

```bash
files=("my report.txt" "notes.md")

for f in "${files[@]}"; do   # 2 iterations: "my report.txt", then "notes.md"
  echo "[$f]"
done

for f in "${files[*]}"; do   # 1 iteration: the elements joined into one string
  echo "[$f]"
done
```

`"${a[@]}"` → each element is a separate word. `"${a[*]}"` → all elements joined into a
single word (separated by the first character of `IFS`). You almost always want `@`.
Unquoted `${a[@]}` would re-split each element on spaces, undoing the benefit of the array.

## Arguments & special variables

When you run `./script.sh alpha beta`, the words after the script name become the
**positional parameters**. The shell does *not* parse flags for you — `$1` is just whatever
word came first.

| Var | Meaning |
|---|---|
| `$0` | script name (as it was invoked) |
| `$1 … $9`, `${10}` | positional arguments (braces required from 10 up) |
| `$#` | number of positional arguments |
| `$*` | all arguments as one word when quoted (`"$*"`) |
| `$@` | all arguments, each as its own word when quoted (`"$@"`) |
| `$?` | exit status of the **last** command (0 = success, non-zero = failure) |
| `$$` | PID of the current shell — handy for unique temp file names |
| `$!` | PID of the **last background** command (`cmd &`) |
| `$-` | current shell option flags |
| `$REPLY` | the value read by `select` (and bare `read`) |

### `"$@"` vs `"$*"` — the distinction that matters

```bash
# called as:  ./s.sh "a b" c
for x in "$@"; do echo "[$x]"; done   # [a b]   [c]      (2 args, preserved)
for x in "$*"; do echo "[$x]"; done   # [a b c]          (1 joined string)
```

`"$@"` expands to exactly the original argument list, spaces inside arguments intact — this
is what you use to **forward all arguments** to another command. `"$*"` joins everything
into one string. Unquoted `$@` and `$*` both word-split and are almost always wrong.

### Shifting arguments

`shift` discards `$1` and renumbers the rest down (`$2` becomes `$1`, etc.), decrementing
`$#`. It is the classic way to process arguments in a loop:

```bash
while [ "$#" -gt 0 ]; do
  echo "arg: $1"
  shift
done
```

### Validating arguments

Always check `$#` before touching `$1`, or an empty `$1` will silently break logic later:

```bash
if [ "$#" -ne 1 ]; then
  echo "usage: $0 <name>" >&2     # error messages go to stderr
  exit 1                          # non-zero exit = "I failed"
fi
echo "Hello, $1!"
```

`>&2` redirects this `echo` to standard error so it does not pollute the script's normal
output (which a caller might be capturing). `exit 1` ends the script with a failure status
that the *caller* can detect via `$?`.

## Command substitution

Command substitution runs a command and **replaces the `$(...)` with that command's
standard output** (trailing newlines trimmed). It is how you capture program results into
variables or into the middle of another command.

```bash
files=$(ls)                 # capture output into a variable
count=$(ls | wc -l)         # capture the result of a pipeline
today=$(date +%F)
echo "Backup-$today.tar"    # substitute inside a string
```

### How it works under the hood

`$(...)` launches a **subshell** — a separate child process running the inner command. Its
standard output is captured into a buffer instead of going to the terminal, and that buffer
(minus trailing newlines) is spliced into the command line *before* the outer command runs.
Because it is a subshell, variables you set inside `$(...)` do **not** survive afterwards.

The older backtick form `` `...` `` does the same thing but nests poorly and is harder to
read; `$(...)` is preferred and is what `shellcheck` recommends.

**Pitfall — quote the substitution too.** The captured output is still subject to word
splitting and globbing if unquoted:

```bash
echo "$(ls)"        # output preserved line by line
echo $(ls)          # newlines collapsed to spaces, globs expanded
```

To capture multi-line output into a variable, prefer process substitution or read into an
array; for a single value, `"$(cmd)"` is the safe form.

## Arithmetic

Because all variables are strings, you must enter an **arithmetic context** to do math. The
`$(( ... ))` form evaluates an integer expression and substitutes the numeric result:

```bash
sum=$(( 2 + 3 * 4 ))     # -> 14  (normal operator precedence)
n=5
n=$(( n + 1 ))           # increment; note: no $ needed on names inside (( ))
half=$(( n / 2 ))        # INTEGER division -> 3, the remainder is discarded
rem=$(( n % 2 ))         # modulo -> 1
```

Key facts:

- **Integers only.** Bash has no floating point. `$(( 7 / 2 ))` is `3`. For decimals you
  must call out to `bc` or `awk`: `result=$(echo "7/2" | bc -l)`.
- Inside `(( ))` you may omit the `$` on variable names — the arithmetic parser knows they
  are variables. `$(( n + 1 ))` and `$(( $n + 1 ))` are equivalent.
- `(( ... ))` **without** the leading `$` is a *command* whose exit status reflects whether
  the result was non-zero — useful in conditions, and it supports C-style operators:

```bash
(( count++ ))                 # post-increment
if (( x > 10 )); then ... fi  # clean numeric comparison, no -gt needed
while (( i < n )); do ((i++)); done
```

Note that `(( ))` follows C's truth convention: a result of `0` is "false" (exit status 1),
non-zero is "true" (exit status 0) — the reverse of shell exit codes, so use it only as a
condition, not to capture a value.

The legacy `let` and `expr` do similar jobs but are clumsier; prefer `(( ))` / `$(( ))`.

## Exit status — the engine behind conditionals

Before `if`, understand **exit status**. Every command, on finishing, returns an integer
0–255 to the shell: **0 means success**, anything else means failure. This is the opposite
of C's truthiness, and it is the value stored in `$?`.

```bash
ls /etc >/dev/null; echo "$?"   # 0
ls /nope 2>/dev/null; echo "$?" # non-zero (e.g. 2)
```

`if`, `while`, `&&`, and `||` do **not** test "true/false" — they test *exit status*. `if
cmd` runs `cmd` and branches on whether it exited 0. There is no special boolean type; the
"condition" is simply a command.

### `&&`, `||`, `!` — short-circuit operators

```bash
mkdir build && cd build          # cd only if mkdir succeeded (exit 0)
ping -c1 host || echo "no reply" # echo only if ping failed (non-zero)
! grep -q error log.txt          # negate: true when grep finds nothing
```

- `A && B` — run `B` **only if `A` succeeded** (A's status was 0).
- `A || B` — run `B` **only if `A` failed** (A's status was non-zero).
- `! A` — invert A's exit status.

They short-circuit left to right. A common idiom for "do or die":

```bash
[ -r "$f" ] || { echo "cannot read $f" >&2; exit 1; }
```

The `{ ...; }` groups commands in the current shell; note the required spaces after `{`
and the semicolon before `}`.

## test / `[ ]`

`[` is **not syntax** — it is literally a command (an external program `/usr/bin/[`, also a
shell builtin) whose other name is `test`. `[ "$x" -gt 10 ]` is the shell running the
command `[` with the arguments `"$x"`, `-gt`, `10`, and a final `]`. The `]` is just a
required closing argument that `[` insists on. That single fact explains every spacing rule:

- **Spaces around `[` and `]` are mandatory** because they separate arguments. `[$x]` would
  be the shell looking for a program named `[$x]`. `[ "$x" ]` is `[` with argument `"$x"`.
- **Spaces around operators are mandatory** for the same reason: `-gt`, `=`, `-eq` are
  separate argument *words*, not glued-on symbols. `[ "$x"=5 ]` passes the single word
  `x=5` to `[`, which is not what you mean.

`[` evaluates its arguments as a condition and **exits 0 if true, non-zero if false** — so
it plugs straight into `if`/`&&`/`||`.

### Operator tables

| String tests | File tests | Integer tests |
|---|---|---|
| `-z s` — string is empty | `-e f` — exists | `-eq` — equal |
| `-n s` — string is non-empty | `-f f` — regular file | `-ne` — not equal |
| `s1 = s2` — equal (string) | `-d f` — directory | `-lt` — less than |
| `s1 != s2` — not equal | `-r f` — readable | `-gt` — greater than |
| | `-w f` — writable | `-le` — ≤ |
| | `-x f` — executable | `-ge` — ≥ |

```bash
[ -f "$f" ] && echo "exists and is a regular file"
[ -z "$name" ] && echo "name is empty"
[ "$a" = "$b" ]    && echo "strings equal"      # = for STRINGS
[ "$x" -eq "$y" ]  && echo "numbers equal"      # -eq for NUMBERS
```

### Two pitfalls that bite everyone

**1. String vs integer comparison are different operators.** `=`/`!=` compare strings;
`-eq`/`-lt`/`-gt` compare numbers. Mixing them gives wrong answers:

```bash
[ "01" = "1" ]    # FALSE — different strings
[ "01" -eq "1" ]  # TRUE  — same number
```

**2. Always quote, or empty values break the syntax.** If `$x` is empty and unquoted:

```bash
x=""
[ $x = "yes" ]     # becomes  [ = "yes" ]  -> syntax error "unary operator expected"
[ "$x" = "yes" ]   # becomes  [ "" = "yes" ] -> works, evaluates false
```

### `[[ ]]` — the Bash upgrade

Bash also has `[[ ... ]]`, which is *shell keyword syntax* (not a command). Inside it, word
splitting and globbing are suppressed, so unquoted variables are safe; it adds `&&`, `||`,
`<`, `>` for strings, and `=~` for regex and `==` with glob patterns:

```bash
if [[ "$name" == A* ]]; then echo "starts with A"; fi   # glob match
if [[ "$x" -gt 10 && "$y" -lt 5 ]]; then ...; fi         # combine conditions
if [[ "$line" =~ ^[0-9]+$ ]]; then echo "all digits"; fi  # regex
```

For the exam, plain `[ ]` is the portable POSIX form and is what older OS materials use;
`[[ ]]` is the safer, more powerful Bash form. Know both. (`shellcheck` is happy with
either.)

## Conditionals: if / elif / else

```bash
if [ "$x" -gt 10 ]; then
  echo big
elif [ "$x" -gt 0 ]; then
  echo small
else
  echo nonpositive
fi
```

Read this literally: `if` runs the command `[ "$x" -gt 10 ]`; if that command exits 0, the
`then` branch runs. The `;` before `then` is a command separator (you could put `then` on
its own line instead). `fi` closes the block. Because the condition is *any command*, this
is perfectly valid and idiomatic:

```bash
if grep -q "fatal" log.txt; then     # no [ ] at all — grep IS the condition
  echo "found a fatal error"
fi
```

`grep -q` prints nothing and just sets its exit status (0 if it matched) — exactly what
`if` wants. Wrapping it in `[ ]` would be a mistake.

## case

`case` matches a value against **glob patterns** (not regex) — cleaner than a long
`if`/`elif` chain when branching on the form of a string. The shell tries each pattern in
order and runs the first that matches.

```bash
case "$1" in
  1)        echo "one" ;;
  2|3)      echo "two or three" ;;      # | means OR
  *.txt)    echo "a text file" ;;       # glob: ends in .txt
  [0-9]*)   echo "starts with a digit" ;;
  "")       echo "empty argument" ;;
  *)        echo "something else" ;;    # * is the default/catch-all
esac
```

Each branch ends with `;;`. The `*)` at the end acts as the default case — put it last,
since matching stops at the first hit. Quote the subject (`"$1"`) so an empty or
space-containing value still works. Patterns are *not* quoted — that is how `*.txt` stays a
glob rather than a literal.

## Loops: for / while / until

### `for` — iterate over a word list

```bash
for f in "$dir"/*; do          # iterate over matching files
  [ -f "$f" ] || continue      # skip anything that is not a regular file
  echo "$f"
done
```

`for VAR in LIST` walks through the words of `LIST` one at a time. The crucial detail:
`"$dir"/*` is a **glob** the shell expands into the actual filenames *before* the loop
starts. If the directory is empty, the glob matches nothing and (by default) stays the
literal `*` — hence the `[ -f "$f" ]` guard. Quote `"$dir"` (the variable) but leave the
`*` unquoted so it can expand.

C-style `for` is available in Bash for counting:

```bash
for (( i = 0; i < 5; i++ )); do echo "$i"; done   # 0 1 2 3 4
```

A common but slightly wasteful idiom uses `seq`:

```bash
for i in $(seq 0 20); do echo "$i"; done          # 0..20 (here unquoted on purpose)
```

For pure counting, brace expansion needs no external program: `for i in {0..20}`.

### `while` — loop while a command keeps succeeding

```bash
while read -r line; do          # loop body runs as long as read succeeds
  echo ">> $line"
done < input.txt                # redirect the file into the loop's stdin
```

`while CMD` repeats the body as long as `CMD` exits 0. Reading a file line by line is the
canonical use: `read` returns success while there is input and fails (non-zero) at EOF,
which ends the loop. The `< input.txt` after `done` feeds the file to the whole loop's
standard input, which is where `read` pulls from.

**Read pitfalls:** always use `read -r` (without `-r`, backslashes are interpreted and
mangled — `shellcheck` warns about this). Leading/trailing whitespace is trimmed unless you
clear `IFS`: `while IFS= read -r line`.

### `until` — the inverse of while

`until CMD` loops *until* `CMD` succeeds (i.e. it repeats while `CMD` fails):

```bash
until ping -c1 -W1 host >/dev/null 2>&1; do
  echo "waiting for host..."
  sleep 2
done
echo "host is up"
```

### break / continue

`break` exits the loop immediately; `continue` skips the rest of the current iteration and
jumps to the next. Both take an optional number to break/continue *N* levels of nested
loops (`break 2`).

## select (menus)

`select` builds a numbered text menu from a word list, prints the prompt in `$PS3`, reads
the user's choice, sets the chosen *value* in the loop variable and the raw number in
`$REPLY`, then repeats forever until you `break`.

```bash
PS3="Choose: "
select f in *.txt "Quit"; do
  case "$f" in
    Quit) break ;;
    "")   echo "invalid choice, try again" ;;   # $f is empty on a bad number
    *)    cat "$f" ;;
  esac
done
```

Notes on how it behaves:

- The list (`*.txt "Quit"`) is expanded exactly like a `for` list — the glob produces the
  menu entries.
- If the user types a number with no matching entry, the loop variable (`f`) becomes the
  **empty string** — guard with `""`) as above.
- `select` does **not** terminate on its own; you must `break` out (here, on `Quit`).
- It reads from standard input each iteration; `$REPLY` holds exactly what was typed.

## read — getting input

```bash
read -r name                    # read one line of stdin into $name
read -rp "Your age: " age       # -p prints a prompt first (no newline)
read -r first rest              # split the line: first word -> $first, the rest -> $rest
read -rt 5 answer || echo "timed out"   # -t adds a timeout in seconds
```

`read` splits its input into the named variables on `$IFS` (spaces/tabs). If there are more
words than variables, the **last** variable soaks up everything remaining. With no variable
name, the line lands in `$REPLY`. Use `-r` always.

## Functions

Functions group commands under a name. They behave like mini-scripts: they receive their
own positional parameters (`$1`, `$2`, ...), and they communicate results two ways — by
**printing to stdout** (captured with command substitution) and by **return status** (an
integer 0–255, via `return`).

```bash
to_lower() {
  echo "$1" | tr 'A-Z' 'a-z'
}

result=$(to_lower "HELLO")   # capture the printed output -> hello
echo "$result"
```

### How arguments and "return values" work

```bash
greet() {
  local who="$1"             # 'local' keeps the variable inside the function
  echo "Hello, $who"          # this is the function's OUTPUT (stdout)
}

is_even() {
  (( $1 % 2 == 0 ))           # the LAST command's status becomes the return status
}

is_even 4 && echo "even"     # use it like any other condition
```

- Call a function by name with space-separated arguments: `greet Ana`. Inside, `$1` is
  `Ana`, `$#` is the function's own argument count — the script's positional parameters are
  shadowed while the function runs.
- `return N` sets the **exit status** (a small integer), not a value. To return *data*,
  `echo` it and capture with `$(...)`.
- Use `local` for variables that should not leak into the rest of the script — Bash
  variables are global by default, which `shellcheck` flags as a frequent bug source.
- A function with the same name as a command shadows it; define functions before you call
  them (Bash reads top to bottom).

## Redirection

Each process starts with three open file descriptors: **0 = stdin** (input), **1 = stdout**
(normal output), **2 = stderr** (error output). Redirection rewires these to/from files
*before* the command runs.

| Syntax | Effect |
|---|---|
| `cmd > file` | stdout → file (**truncate/overwrite**) |
| `cmd >> file` | stdout → file (**append**) |
| `cmd < file` | file → stdin |
| `cmd 2> file` | stderr → file |
| `cmd > out 2> err` | stdout and stderr to separate files |
| `cmd > file 2>&1` | stdout → file, then stderr → wherever stdout now points |
| `cmd &> file` | Bash shorthand for `> file 2>&1` |
| `cmd >/dev/null 2>&1` | discard **all** output |
| `a | b` | a's stdout → b's stdin (a **pipe**) |

```bash
> report.txt              # with no command: just truncate the file to empty
echo "line" >> report.txt # append a line
sort < data.txt           # feed data.txt as input to sort
```

### Why the order in `> file 2>&1` matters

`2>&1` means "make file descriptor 2 (stderr) point to *the same place as* fd 1 (stdout)
**right now**." Redirections are processed left to right, so:

```bash
cmd > file 2>&1     # 1) stdout -> file   2) stderr -> (same as stdout) file   GOOD
cmd 2>&1 > file     # 1) stderr -> (same as stdout = terminal)   2) stdout -> file
                    #    -> errors still go to the TERMINAL, only normal output to file
```

The classic `>/dev/null 2>&1` therefore reads: "send stdout to the bit bucket, then send
stderr to the same bit bucket" — i.e. **silence everything**. `/dev/null` is a special file
that discards anything written to it and yields EOF when read.

## Calling external programs

This is what scripts mostly *do*: invoke other programs and react to their exit status and
output. The shell finds the program by searching the directories in `$PATH` (left to right)
for a matching executable name. You wire programs together with pipes and capture their
output with `$(...)`:

```bash
matches=$(grep -c "ERROR" log.txt)        # capture a count
if grep -q "ERROR" log.txt; then ...; fi   # branch on whether grep matched
sorted=$(sort -u names.txt | head -5)      # pipeline inside a substitution
```

Useful workhorse tools you will combine: `grep` (search), `sort`, `uniq`, `wc` (count),
`cut`/`awk` (extract columns), `sed`/`tr` (transform text), `find` (walk the filesystem),
`cat`/`head`/`tail`. Each communicates via stdin/stdout and exit status — the universal
"interface" of the shell.

**Pipeline gotcha:** in `a | b`, the exit status of the whole pipeline is that of the
**last** command (`b`) by default. If `a` fails but `b` succeeds, `$?` is 0. Set
`set -o pipefail` (see below) to make the pipeline fail if *any* stage fails.

## Defensive scripting: `set -euo pipefail`

Putting these options near the top of a script turns silent failures into loud ones — a
strongly recommended habit and a frequent exam talking point:

```bash
#!/bin/bash
set -euo pipefail
```

| Option | Effect |
|---|---|
| `set -e` | exit immediately if any command exits non-zero (stops "carrying on after an error") |
| `set -u` | treat use of an **unset** variable as an error (catches typos like `$flie`) |
| `set -o pipefail` | a pipeline fails if **any** stage fails, not just the last |

Trade-offs to know: with `-e`, a command you *expect* might fail must be guarded
(`cmd || true`); with `-u`, reference optional variables with a default (`"${VAR:-}"`).
These are not magic, but they catch a large class of real bugs early.

## A complete example — run & log Python files

Demonstrates `$#`, `"$@"`, `$?`, `case`, `continue`, and redirection together:

```bash
#!/bin/bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "USAGE: $0 file1.py file2.py ..." >&2
  exit 1
fi

> report.txt                          # truncate the report to empty

for file in "$@"; do                  # "$@": each argument as its own word
  if [ ! -f "$file" ]; then
    echo "Warning: $file is not a file." >&2
    continue                          # skip to the next argument
  fi
  case "$file" in
    *.py)
      if python3 "$file" >/dev/null 2>&1; then   # run silently, branch on success
        echo "$file SUCCESS" >> report.txt
      else
        echo "$file FAIL" >> report.txt
      fi
      ;;
    *)
      echo "Warning: $file is not a .py file." >&2
      ;;
  esac
done

cat report.txt
```

Walk-through of the moving parts:

- `[ "$#" -eq 0 ]` — integer test on the argument count; bail out with usage on stderr.
- `> report.txt` — a redirection with no command, used purely to empty the file.
- `for file in "$@"` — iterate the actual arguments, spaces preserved.
- `if python3 "$file" ...; then` — note we branch on the command **directly** rather than
  running it and then checking `$?` separately. The older idiom

  ```bash
  python3 "$file" >/dev/null 2>&1
  if [ $? -eq 0 ]; then ...
  ```

  works but is fragile: any command between the run and the check overwrites `$?`. Testing
  the command inline is clearer and `shellcheck`-clean.
- `>> report.txt` — append each result so the loop accumulates a log.

## Exam & `shellcheck` checklist

The exercises lint with `shellcheck`, so adopt these habits — they map directly to its most
common warnings:

- **Quote every expansion:** `"$var"`, `"$@"`, `"$(cmd)"`, `"${arr[@]}"`. (SC2086)
- **`read -r`** always; prefer `while IFS= read -r line`. (SC2162)
- **No `$` inside `(( ))`** assignments and prefer `(( ))` for numeric tests.
- **`[ ]` needs spaces** around brackets and operators; quote operands.
- **String `=` vs integer `-eq`** — never cross them.
- **Don't parse `ls`** in scripts; glob with `for f in *` instead. (SC2012)
- **Test commands directly** in `if`/`while` rather than via `$?`.
- **`local`** your function variables so they don't leak globally. (SC2034 cousins)
- **`set -euo pipefail`** at the top for fail-fast behaviour.
- Check `$#` before using `$1`; send errors and usage to **stderr** (`>&2`).
