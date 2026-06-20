# Parallel sum of differences

Given two integer arrays `a` and `b` of the same length, compute:

```
result = Σ |a[i] - b[i]|
```

The work is split across **`threads`** worker threads — each handles a slice of the
arrays. The starter accumulates every thread's partial into one **shared** field
`total`, **without synchronization**, so the threads race on `total += …` and updates get
lost — the result comes out too small.

## Your task

Implement `VectorDiff.sumOfAbsDiff(int[] a, int[] b, int threads)` so it returns the
**exact** sum using `threads` threads — no lost updates, for any array size and thread
count.

```java
public class VectorDiff {
    public static long sumOfAbsDiff(int[] a, int[] b, int threads)
            throws InterruptedException {
        // split the arrays into `threads` slices, sum each in a thread,
        // then combine the partial sums into the total.
    }
}
```

## Requirements

- Returns the exact total, consistently across repeated runs.
- Works when the array length is **not divisible** by `threads`, and when `threads == 1`.

> **Tip (the idiomatic fix):** give each thread its **own** accumulator (e.g. a slot in a
> `long[] partial` indexed by thread number, or a thread-local variable). Each thread
> writes only its own slot — so there's no shared write to race on — and after `join()`
> the main thread adds the partials together. (Locking a shared `total` on every addition
> also works but is far slower.)
