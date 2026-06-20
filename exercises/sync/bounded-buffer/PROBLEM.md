# Producer–consumer bounded buffer

Implement a **thread-safe bounded buffer** — the heart of the producer–consumer problem.
Multiple producers call `put(item)` and multiple consumers call `take()`, sharing a buffer
with a fixed capacity.

The starter is broken: it has no locking and no waiting, so it loses items when full,
returns garbage when empty, and corrupts under concurrency.

## Your task

Make `BoundedBuffer` correct:

```java
public class BoundedBuffer {
    public BoundedBuffer(int capacity) { ... }
    public void put(int item) throws InterruptedException { ... }
    public int take() throws InterruptedException { ... }
}
```

## Requirements

- **`put` blocks** while the buffer is **full**; **`take` blocks** while it is **empty**.
- Thread-safe: every item put is taken **exactly once** (no losses, no duplicates, no corruption).
- No deadlock.

> **Tip — the monitor pattern:** make `put` and `take` `synchronized` on the same object.
> Guard the condition in a **`while`** loop (not `if` — a thread can wake spuriously):
> `while (full) wait();` in `put`, `while (empty) wait();` in `take`. After changing the
> buffer, call `notifyAll()` to wake the other side. (A `Queue<Integer>` like `LinkedList`
> is a handy backing store.)
