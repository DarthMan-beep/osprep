# Deadlock-free money transfer

A `Bank` holds several accounts. `transfer(from, to, amount)` must lock **both** accounts
so no money is lost to a race. The starter locks them **in argument order** — `from` then
`to`:

```java
public void transfer(int from, int to, int amount) {
    synchronized (lock[from]) {
        synchronized (lock[to]) {
            balance[from] -= amount;
            balance[to]   += amount;
        }
    }
}
```

This is thread-safe but **deadlocks**: if one thread does `transfer(0, 1, …)` while another
does `transfer(1, 0, …)`, the first grabs `lock[0]` and waits for `lock[1]`, while the
second grabs `lock[1]` and waits for `lock[0]` — neither can proceed (circular wait).

## Your task

Make `transfer` **both** thread-safe **and** deadlock-free.

## Requirements

- Concurrent transfers in opposite directions must **complete** (no deadlock).
- The **total** money across all accounts is conserved (both balances updated atomically).

> **Tip — consistent lock ordering breaks the cycle:** always acquire the two locks in the
> same global order regardless of transfer direction, e.g. by account index:
> `int first = Math.min(from, to), second = Math.max(from, to);` then lock `first` then
> `second`. (A single global lock around the whole transfer also works, just with less
> concurrency.)
