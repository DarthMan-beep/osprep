---
title: "Bash: first steps"
topic: bash
order: 0
summary: Zero to your first working script — what a script is, how to run it, variables, input, and a first decision.
---

# Bash: first steps

Never written a script before? Start here. By the end of this page you'll have written
and run a real Bash script. It takes about 10 minutes.

## What *is* a Bash script?

A Bash script is just a **plain text file containing the same commands you would type in
the terminal**. When you run the file, the shell reads it **top to bottom** and runs each
line, one after another. That's it — no compiling, no magic.

So if you can type `echo hello` in a terminal, you can already write a script.

## Your first script

Create a file called `greet.sh` with these two lines:

```bash
#!/bin/bash
echo "Hello!"
```

- **Line 1** is the *shebang*. It tells the system "use the `bash` program to run this
  file." Always make it the very first line.
- **`echo`** prints text to the screen.

Now run it. Two steps — make it executable once, then run it:

```console
$ chmod +x greet.sh     # "this file is allowed to run"
$ ./greet.sh            # run it (the ./ means "the file right here")
Hello!
```

🎉 That's a working script.

## Comments

Anything after a `#` is a note for humans and is ignored by Bash:

```bash
#!/bin/bash
# This script says hello. (this line does nothing when run)
echo "Hello!"
```

## Variables — storing a value

A variable is a named box that holds a value:

```bash
#!/bin/bash
name="Ana"
echo "Hello, $name!"     # prints: Hello, Ana!
```

Three rules that catch everyone at the start:

1. **No spaces around `=`** when assigning. `name="Ana"` works; `name = "Ana"` does **not**.
2. To *use* the value, put a **`$`** in front: `$name`.
3. **Wrap it in double quotes**: `"$name"`. (This avoids surprises when the value has
   spaces — you'll see why later.)

## Using input — arguments

When you run a script you can pass it words. The first one is `$1`, the second `$2`, etc.:

```bash
#!/bin/bash
echo "Hello, $1!"
```

```console
$ ./greet.sh World
Hello, World!
$ ./greet.sh Ana
Hello, Ana!
```

So `$1` is "whatever the user typed as the first word."

## Making a decision — `if`

Scripts get useful when they can choose. Here we check whether the user actually gave us
a name:

```bash
#!/bin/bash
if [ -z "$1" ]; then
  echo "Please give me a name."
else
  echo "Hello, $1!"
fi
```

Reading it out loud: *"**if** `$1` is empty, print a reminder, **else** greet them."*

- `[ -z "$1" ]` is a **test**: `-z` means "is this empty?".
- The spaces inside `[ ... ]` are **required** — `[` is actually a command, and it needs
  its arguments separated by spaces.
- `if ... then ... else ... fi` — note it ends with `fi` (`if` backwards).

```console
$ ./greet.sh
Please give me a name.
$ ./greet.sh Ana
Hello, Ana!
```

## You now know enough to start

You can already: write a file, run it, use variables, read input, and branch with `if`.
That covers the first few exercises.

**Next:**
- Try the **Greeting script** exercise — it uses exactly these ideas.
- When you want the full toolkit (loops, `case`, arrays, command substitution, all the
  test operators, quoting in depth), read the **Bash scripting** guide.

> One habit worth forming now: always quote your variables (`"$1"`, `"$name"`) and put
> spaces inside `[ ]`. Those two habits prevent the most common beginner bugs — and the
> grader's linter (`shellcheck`) will nudge you about them too.
