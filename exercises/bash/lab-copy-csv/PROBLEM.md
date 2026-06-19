# Scripts lab — Copy CSV files and report statistics

Write a shell script that copies all files from a source directory that satisfy **all**
of these conditions:

- they have a **`.csv`** extension,
- their **filename contains at least one digit**,
- **others** have **read** permission on the file.

## Requirements

- The source directory is given as a **command-line argument**.
- Create a directory **`copiedFiles`** in the current directory and copy the matching
  files into it.
- Also create **`statistics.txt`** with **exactly** this format:

  ```
  copiedFiles: X
  totalSize: Y
  totalNumberOfLines: Z
  largestFile: A
  longestName: B
  ```

  where `X` = number of copied files, `Y` = their total size in bytes,
  `Z` = their total number of lines, `A` = the size (bytes) of the largest copied
  file, and `B` = the name of that largest file.

## Example

```console
$ mkdir source && cd source
$ echo "a" > file1.csv; echo "b" > file2.csv; echo "c" > test.csv
$ chmod o+r file1.csv file2.csv; chmod o-r test.csv
$ cd ..
$ ./script.sh source
```

`statistics.txt`:

```
copiedFiles: 2
totalSize: 4
totalNumberOfLines: 2
largestFile: 2
longestName: file1.csv
```

(`test.csv` is skipped — no digit in its name.)

> **Tip:** match a digit in the name with a `case` glob `*[0-9]*`; read the "other"
> permission bit from `stat -c '%A'` (the 8th character); sizes via `stat -c%s`.
