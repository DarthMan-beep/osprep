# Thread-safe counter

The class **`Counter`** keeps an integer and exposes `increment()` and `get()`. The
starter version is **not thread-safe**: when many threads call `increment()` at the same
time, some increments are lost (a *race condition*), because `value++` is really three
steps — read, add one, write back — that can interleave.

## Your task

Make `Counter` **thread-safe** so that if **K threads each call `increment()` M times**,
the final value is **exactly K × M**, every time.

```java
public class Counter {
    private int value = 0;

    public void increment() {
        value++;          // not safe: read-modify-write can interleave
    }

    public int get() {
        return value;
    }
}
```

## Requirements

- After concurrent increments, `get()` must return the exact total (no lost updates),
  consistently across repeated runs.
- Don't deadlock or hang.

> **Tip:** the simplest fix is to make the critical section mutually exclusive with the
> `synchronized` keyword (on the methods, or a `synchronized(this){ … }` block). Both
> `increment()` and `get()` should agree on the same lock. (`java.util.concurrent`
> tools like `ReentrantLock` or `AtomicInteger` would also work.)
