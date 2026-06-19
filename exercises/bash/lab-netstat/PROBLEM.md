# Scripts lab — TCP connections per local IP

Write a shell script that, for data read from **standard input** (in the format of
`netstat -an`), prints the number of **TCP** connections for each **local address**
(IP without the port).

Each output line uses the format `"%-20s %s\n"`: first the local IP (no port), then
the number of TCP connections for it.

Sort the output:

- **descending** by the number of connections;
- for equal counts, **ascending** by the IP address.

## Rules

- Consider only TCP rows (`tcp` and `tcp6`); ignore header lines.
- Strip the port: `0.0.0.0:80` → `0.0.0.0`, and the IPv6 wildcard `:::80` → `:::`.
- Use `awk`, `sort`, `uniq` (or an equivalent `awk`-only solution). **No temp files.**
- Read **only** from stdin.

## Example

Input:

```
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address  Foreign Address  State
tcp   0 0 192.168.1.10:8080  0.0.0.0:*  LISTEN
tcp   0 0 10.0.0.5:3306      0.0.0.0:*  LISTEN
tcp   0 0 10.0.0.5:443       0.0.0.0:*  LISTEN
tcp6  0 0 :::443             :::*       LISTEN
tcp   0 0 192.168.1.10:22    0.0.0.0:*  LISTEN
```

Output:

```
10.0.0.5             3
192.168.1.10         2
:::                  1
```

> **Tip:** the local address is column 4. Strip trailing digits, then strip a single
> trailing colon **only** when it follows a non-colon (so `:::` is preserved).
