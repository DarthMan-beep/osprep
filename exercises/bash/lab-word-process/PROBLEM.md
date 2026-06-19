# Scripts lab — Extract unique words per file

Write a shell script that takes a **source directory** as a command-line argument and
processes the text files inside it.

Process only files that are **all** of:

- regular files,
- with a **`.txt`** extension,
- whose **filename contains at least one digit**,
- on which **others** have **read** permission.

## Output

- Create a directory **`processed`** in the current directory.
- For each qualifying file, create `processed/<name>.out` (same name, `.out` instead of
  `.txt`) containing all **unique words** that consist **only of English letters**,
  written in **lowercase**, each **once**, sorted **alphabetically**. A "word" is any
  run of characters separated by spaces or punctuation.
- Create **`summary.txt`** in the current directory with exactly:

  ```
  processedFiles: X
  totalUniqueWords: Y
  fileWithMostUniqueWords: Z
  maxUniqueWords: W
  ```

  `X` = files processed, `Y` = total unique words summed over all `.out` files,
  `Z` = the original `.txt` name with the most unique words, `W` = that count.

## Edge cases

- Not exactly one argument → print `Usage: ./script.sh <source_directory>` and exit 1.
- Directory does not exist → print `Error: source directory does not exist` and exit 1.
- No qualifying files → still create `processed` and `summary.txt`, with
  `processedFiles: 0`, `totalUniqueWords: 0`, `fileWithMostUniqueWords: none`,
  `maxUniqueWords: 0`.
- **No temporary files.**

> **Tip:** `tr -cs 'A-Za-z' '\n'` turns runs of non-letters into newlines; then lowercase
> with `tr 'A-Z' 'a-z'`, drop blank lines, and `sort -u`.
