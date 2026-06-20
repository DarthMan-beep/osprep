# Limit concurrency with a semaphore

Sometimes you don't want *mutual exclusion* (one at a time) — you want to allow **up to N**
threads into a section at once (e.g. only N database connections, N parallel downloads).
That's what a **counting semaphore** is for.

`LimitedResource.access(work)` runs the given `work`, but the starter runs it with **no
limit** — every thread piles in at once.

## Your task

Make `access` allow **at most `LIMIT` threads** to run `work.run()` concurrently:

```java
public class LimitedResource {
    public static final int LIMIT = 3;

    public void access(Runnable work) throws InterruptedException {
        work.run();   // no limit yet — fix this
    }
}
```

## Requirements

- Never more than `LIMIT` threads inside `work.run()` at the same time.
- Every caller eventually gets in (no deadlock, no starvation).

> **Tip:** create one shared `java.util.concurrent.Semaphore` with `LIMIT` permits.
> `acquire()` before running the work and `release()` after — put the `release()` in a
> `finally` so a permit is never lost even if the work throws:
> `sem.acquire(); try { work.run(); } finally { sem.release(); }`.
